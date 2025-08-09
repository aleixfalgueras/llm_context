import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { withdrawAllConsent } from '@/lib/utils/consent'

// Account deletion - immediate processing
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { confirmationText, reason = 'user_request' } = await request.json()

    // Require confirmation text for safety
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return NextResponse.json({
        error: 'Please type "DELETE MY ACCOUNT" to confirm deletion'
      }, { status: 400 })
    }

    // Get client IP and user agent for audit trail
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Withdraw all consent first
      await withdrawAllConsent(userId, 'account_deletion', {
        ipAddress: clientIP,
        userAgent
      })

      // 2. Create account deletion audit log
      const deletionLog = await tx.consentAuditLog.create({
        data: {
          userId,
          action: 'account_deletion_requested',
          consentType: 'account_deletion',
          previousValue: true,
          newValue: false,
          reason,
          ipAddress: clientIP,
          userAgent,
        }
      })

      // 3. Count user data for audit purposes
      const dataCounts = {
        clients: await tx.client.count({ where: { userId } }),
        documents: await tx.document.count({ where: { userId } }),
        chats: await tx.chat.count({ where: { userId } }),
        messages: await tx.message.count({
          where: {
            chat: { userId }
          }
        }),
        prompts: await tx.prompt.count({ where: { userId } }),
        feedbacks: await tx.feedback.count({ where: { userId } })
      }

      // 4. Create deletion request record for audit trail
      const deletionRequest = await tx.accountDeletionRequest.create({
        data: {
          userId,
          requestData: {
            reason,
            originalCounts: dataCounts,
            ipAddress: clientIP,
            userAgent,
            processedAt: new Date().toISOString()
          },
          reason
        }
      })

      // 5. Delete user data in the correct order (respecting foreign key constraints)
      
      // Delete messages (has foreign key to chat)
      const deletedMessages = await tx.message.deleteMany({
        where: {
          chat: { userId }
        }
      })

      // Delete chats
      const deletedChats = await tx.chat.deleteMany({
        where: { userId }
      })

      // Delete documents
      const deletedDocuments = await tx.document.deleteMany({
        where: { userId }
      })

      // Delete clients
      const deletedClients = await tx.client.deleteMany({
        where: { userId }
      })

      // Delete prompts
      const deletedPrompts = await tx.prompt.deleteMany({
        where: { userId }
      })

      // Delete feedback
      const deletedFeedbacks = await tx.feedback.deleteMany({
        where: { userId }
      })

      // Delete user consent records
      const deletedUserConsent = await tx.userConsent.deleteMany({
        where: { userId }
      })

      // 6. Update deletion request with actual deletion counts
      await tx.accountDeletionRequest.update({
        where: { id: deletionRequest.id },
        data: {
          requestData: {
            reason,
            originalCounts: dataCounts,
            actualDeletionCounts: {
              messages: deletedMessages.count,
              chats: deletedChats.count,
              documents: deletedDocuments.count,
              clients: deletedClients.count,
              prompts: deletedPrompts.count,
              feedbacks: deletedFeedbacks.count,
              userConsent: deletedUserConsent.count
            },
            ipAddress: clientIP,
            userAgent,
            processedAt: new Date().toISOString()
          }
        }
      })

      // 7. Create final audit log entry
      await tx.consentAuditLog.create({
        data: {
          userId,
          action: 'account_deletion_completed',
          consentType: 'account_deletion',
          previousValue: false,
          newValue: false,
          reason: `immediate_processing_${deletionRequest.id}`,
          ipAddress: clientIP,
          userAgent
        }
      })

      return { 
        deletionLog, 
        deletionRequest, 
        dataCounts,
        actualDeletionCounts: {
          messages: deletedMessages.count,
          chats: deletedChats.count,
          documents: deletedDocuments.count,
          clients: deletedClients.count,
          prompts: deletedPrompts.count,
          feedbacks: deletedFeedbacks.count,
          userConsent: deletedUserConsent.count
        }
      }
    })

    // 8. Delete from Clerk (external service) - outside transaction
    try {
      const clerk = await clerkClient()
      await clerk.users.deleteUser(userId)
    } catch (clerkError) {
      console.error('Failed to delete user from Clerk:', clerkError)
      // Note: We continue with the deletion even if Clerk fails
      // The audit log will show this was processed
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      deletionId: result.deletionRequest.id,
      dataDeleted: result.actualDeletionCounts
    })
  } catch (error) {
    console.error('Error processing account deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}