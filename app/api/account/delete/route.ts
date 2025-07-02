import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { withdrawAllConsent } from '@/lib/consent-utils'

// Account deletion request (soft delete with grace period)
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

      // 4. Schedule deletion (immediate for demo, could be delayed in production)
      const scheduledDeletion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days grace period

      // Create deletion request record
      const deletionRequest = await tx.dataExportRequest.create({
        data: {
          userId,
          requestType: 'account_deletion',
          status: 'pending',
          requestData: {
            reason,
            dataCounts,
            scheduledDeletion: scheduledDeletion.toISOString(),
            ipAddress: clientIP,
            userAgent,
            gracePeriodEnds: scheduledDeletion.toISOString()
          },
          expiresAt: scheduledDeletion
        }
      })

      return { deletionLog, deletionRequest, dataCounts, scheduledDeletion }
    })

    return NextResponse.json({
      success: true,
      message: 'Account deletion scheduled. You have 7 days to cancel this request.',
      deletionId: result.deletionRequest.id,
      scheduledDeletion: result.scheduledDeletion,
      dataToBeDeleted: result.dataCounts,
      gracePeriodDays: 7
    })
  } catch (error) {
    console.error('Error scheduling account deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Cancel account deletion (during grace period)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { deletionId } = await request.json()

    // Find the pending deletion request
    const deletionRequest = await prisma.dataExportRequest.findFirst({
      where: {
        id: deletionId,
        userId,
        requestType: 'account_deletion',
        status: 'pending'
      }
    })

    if (!deletionRequest) {
      return NextResponse.json({
        error: 'No pending deletion request found'
      }, { status: 404 })
    }

    // Check if grace period has expired
    if (new Date() > deletionRequest.expiresAt!) {
      return NextResponse.json({
        error: 'Grace period has expired. Account deletion cannot be cancelled.'
      }, { status: 400 })
    }

    // Cancel the deletion request
    await prisma.dataExportRequest.update({
      where: { id: deletionId },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    })

    // Log the cancellation
    await prisma.consentAuditLog.create({
      data: {
        userId,
        action: 'account_deletion_cancelled',
        consentType: 'account_deletion',
        previousValue: false,
        newValue: true,
        reason: 'user_request',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling account deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 