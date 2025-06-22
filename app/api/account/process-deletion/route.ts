import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// This endpoint should be called by a cron job to process pending deletions
// For demo purposes, it can also be called manually by admins
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { force = false, deletionId } = await request.json()

    // For manual processing, require authentication
    if (deletionId && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find pending deletions that are ready to be processed
    const pendingDeletions = await prisma.dataExportRequest.findMany({
      where: {
        requestType: 'account_deletion',
        status: 'pending',
        ...(deletionId ? { id: deletionId } : {}),
        ...(force ? {} : {
          expiresAt: {
            lte: new Date()
          }
        })
      }
    })

    if (pendingDeletions.length === 0) {
      return NextResponse.json({
        message: 'No pending deletions to process',
        processed: 0
      })
    }

    const processedDeletions = []

    for (const deletion of pendingDeletions) {
      try {
        await processSingleAccountDeletion(deletion.userId, deletion.id)
        processedDeletions.push({
          userId: deletion.userId,
          deletionId: deletion.id,
          status: 'completed'
        })
      } catch (error) {
        console.error(`Failed to delete account ${deletion.userId}:`, error)
        
        // Mark as failed
        await prisma.dataExportRequest.update({
          where: { id: deletion.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            requestData: {
              ...deletion.requestData as any,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })

        processedDeletions.push({
          userId: deletion.userId,
          deletionId: deletion.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${processedDeletions.length} account deletions`,
      processed: processedDeletions.length,
      results: processedDeletions
    })
  } catch (error) {
    console.error('Error processing account deletions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processSingleAccountDeletion(userIdToDelete: string, deletionId: string) {
  return await prisma.$transaction(async (tx) => {
    // Get user data counts for audit log
    const dataCounts = {
      clients: await tx.client.count({ where: { userId: userIdToDelete } }),
      documents: await tx.document.count({ where: { userId: userIdToDelete } }),
      chats: await tx.chat.count({ where: { userId: userIdToDelete } }),
      messages: await tx.message.count({
        where: {
          chat: { userId: userIdToDelete }
        }
      }),
      prompts: await tx.prompt.count({ where: { userId: userIdToDelete } }),
      feedbacks: await tx.feedback.count({ where: { userId: userIdToDelete } })
    }

    // Delete user data in the correct order (respecting foreign key constraints)
    
    // 1. Delete messages (has foreign key to chat)
    const deletedMessages = await tx.message.deleteMany({
      where: {
        chat: { userId: userIdToDelete }
      }
    })

    // 2. Delete chats
    const deletedChats = await tx.chat.deleteMany({
      where: { userId: userIdToDelete }
    })

    // 3. Delete documents
    const deletedDocuments = await tx.document.deleteMany({
      where: { userId: userIdToDelete }
    })

    // 4. Delete clients
    const deletedClients = await tx.client.deleteMany({
      where: { userId: userIdToDelete }
    })

    // 5. Delete prompts
    const deletedPrompts = await tx.prompt.deleteMany({
      where: { userId: userIdToDelete }
    })

    // 6. Delete feedback
    const deletedFeedbacks = await tx.feedback.deleteMany({
      where: { userId: userIdToDelete }
    })

    // 7. Delete data export requests (except the current one)
    const deletedExportRequests = await tx.dataExportRequest.deleteMany({
      where: { 
        userId: userIdToDelete,
        id: { not: deletionId }
      }
    })

    // 8. Delete user consent records
    const deletedUserConsent = await tx.userConsent.deleteMany({
      where: { userId: userIdToDelete }
    })

    // Note: We keep consent audit logs for legal/compliance purposes
    // They contain minimal personal data and serve as proof of consent handling

    // 9. Mark deletion request as completed
    await tx.dataExportRequest.update({
      where: { id: deletionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        requestData: {
          actualDeletionCounts: {
            messages: deletedMessages.count,
            chats: deletedChats.count,
            documents: deletedDocuments.count,
            clients: deletedClients.count,
            prompts: deletedPrompts.count,
            feedbacks: deletedFeedbacks.count,
            exportRequests: deletedExportRequests.count,
            userConsent: deletedUserConsent.count
          },
          originalCounts: dataCounts,
          processedAt: new Date().toISOString()
        }
      }
    })

    // 10. Create final audit log entry
    await tx.consentAuditLog.create({
      data: {
        userId: userIdToDelete,
        action: 'account_deletion_completed',
        consentType: 'account_deletion',
        previousValue: false,
        newValue: false,
        reason: `automated_processing_deletion_${deletionId}`,
        ipAddress: 'system',
        userAgent: 'system'
      }
    })

    // 11. Delete from Clerk (external service)
    try {
      const clerk = await clerkClient()
      await clerk.users.deleteUser(userIdToDelete)
    } catch (clerkError) {
      console.error('Failed to delete user from Clerk:', clerkError)
      // Note: We continue with the deletion even if Clerk fails
      // The audit log will show this was processed
    }

    return {
      deletedCounts: {
        messages: deletedMessages.count,
        chats: deletedChats.count,
        documents: deletedDocuments.count,
        clients: deletedClients.count,
        prompts: deletedPrompts.count,
        feedbacks: deletedFeedbacks.count,
        exportRequests: deletedExportRequests.count,
        userConsent: deletedUserConsent.count
      },
      originalCounts: dataCounts
    }
  })
} 