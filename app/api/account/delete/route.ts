import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { withdrawAllConsent, extractClientInfo } from '@/lib/utils/consent'
import { withEnhancedApi, parseJsonBody, apiSuccess } from '@/lib/api/api-middleware'
import { ApiErrors } from '@/lib/api/api-error-handler'
import { cancelSubscriptionImmediately } from '@/lib/stripe/stripe-subscription'
import { stripe } from '@/lib/stripe/stripe'
import { SubscriptionUsageOperations } from '@/database'

export const POST = withEnhancedApi(async ({ userId, req }) => {
  const { confirmationText, reason = 'user_request' } = await parseJsonBody(req)

  if (confirmationText !== 'DELETE MY ACCOUNT') {
    return ApiErrors.badRequest('Please type "DELETE MY ACCOUNT" to confirm deletion')
  }

  // Get client IP and user agent for audit trail
  const { ipAddress: clientIP, userAgent } = extractClientInfo(req)

  const userSubscription = await SubscriptionUsageOperations.findByUserId(userId)

  // 1. Withdraw all consent first (outside transaction to avoid timeout)
  await withdrawAllConsent(userId, 'account_deletion', {
    ipAddress: clientIP,
    userAgent
  })

  // 2. Count user data for audit purposes (parallelized)
  // First get user's affiliation code for child count
  const userAffiliation = await prisma.affiliation.findUnique({
    where: { userId },
    select: { affiliationCode: true }
  })

  const dataCountsPromise = Promise.all([
    prisma.client.count({ where: { userId } }),
    prisma.document.count({ where: { userId } }),
    prisma.chat.count({ where: { userId } }),
    prisma.message.count({
      where: {
        chat: { userId }
      }
    }),
    prisma.prompt.count({ where: { userId } }),
    prisma.feedback.count({ where: { userId } }),
    prisma.affiliation.count({ where: { userId } }),
    userAffiliation ? prisma.affiliation.count({ 
      where: { parentAffiliationCode: userAffiliation.affiliationCode } 
    }) : Promise.resolve(0)
  ])

  const [clientsCount, documentsCount, chatsCount, messagesCount, promptsCount, feedbacksCount, affiliationsCount, affiliationChildrenCount] = await dataCountsPromise

  const dataCounts = {
    clients: clientsCount,
    documents: documentsCount,
    chats: chatsCount,
    messages: messagesCount,
    prompts: promptsCount,
    feedbacks: feedbacksCount,
    affiliations: affiliationsCount,
    affiliationChildren: affiliationChildrenCount,
    subscription: userSubscription ? 1 : 0,
    stripeCustomerId: userSubscription?.stripeCustomerId || null,
    stripeSubscriptionId: userSubscription?.stripeSubscriptionId || null,
    subscriptionPlan: userSubscription?.plan || null,
    subscriptionStatus: userSubscription?.status || null
  }

  // 3. Start a transaction for core deletion operations with extended timeout
  const result = await prisma.$transaction(async (tx) => {

    // Create deletion request record for audit trail
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

    // Delete user data in the correct order (respecting foreign key constraints)
    
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

    // Handle affiliation cleanup
    let deletedAffiliationChildren = { count: 0 }
    let deletedAffiliations = { count: 0 }
    
    // First, update any child affiliations to remove parent reference
    if (userAffiliation?.affiliationCode) {
      deletedAffiliationChildren = await tx.affiliation.updateMany({
        where: { parentAffiliationCode: userAffiliation.affiliationCode },
        data: { parentAffiliationCode: null }
      })
    }
    
    // Then delete the user's own affiliation record
    deletedAffiliations = await tx.affiliation.deleteMany({
      where: { userId }
    })

    // Update deletion request with actual deletion counts
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
            userConsent: deletedUserConsent.count,
            affiliations: deletedAffiliations.count,
            affiliationChildrenOrphaned: deletedAffiliationChildren.count
          },
          ipAddress: clientIP,
          userAgent,
          processedAt: new Date().toISOString()
        }
      }
    })

    return { 
      deletionRequest, 
      dataCounts,
      actualDeletionCounts: {
        messages: deletedMessages.count,
        chats: deletedChats.count,
        documents: deletedDocuments.count,
        clients: deletedClients.count,
        prompts: deletedPrompts.count,
        feedbacks: deletedFeedbacks.count,
        userConsent: deletedUserConsent.count,
        affiliations: deletedAffiliations.count,
        affiliationChildrenOrphaned: deletedAffiliationChildren.count
      }
    }
  }, {
    timeout: 30000 // 30 second timeout for this specific transaction
  })

  // 4. Create final audit log entry (outside transaction)
  await prisma.consentAuditLog.create({
    data: {
      userId,
      action: 'account_deletion_completed',
      consentType: 'account_deletion',
      previousValue: false,
      newValue: false,
      reason: `immediate_processing_${result.deletionRequest.id}`,
      ipAddress: clientIP,
      userAgent
    }
  })

  // 5. Handle Stripe subscription and customer cleanup
  let stripeCleanupResults = {
    subscriptionCancelled: false,
    customerDeleted: false,
    subscriptionError: null as string | null,
    customerError: null as string | null
  }

  if (userSubscription?.stripeSubscriptionId) {
    try {
      await cancelSubscriptionImmediately(
        userSubscription.stripeSubscriptionId,
        'account_deletion'
      )
      stripeCleanupResults.subscriptionCancelled = true
    } catch (subscriptionError) {
      stripeCleanupResults.subscriptionError = subscriptionError instanceof Error 
        ? subscriptionError.message 
        : 'Unknown subscription cancellation error'
      console.error('Failed to cancel Stripe subscription:', subscriptionError)
      // Continue with deletion even if subscription cancellation fails
    }
  }

  if (userSubscription?.stripeCustomerId) {
    try {
      await stripe.customers.del(userSubscription.stripeCustomerId)
      stripeCleanupResults.customerDeleted = true
    } catch (customerError) {
      stripeCleanupResults.customerError = customerError instanceof Error
        ? customerError.message
        : 'Unknown customer deletion error'
      console.error('Failed to delete Stripe customer:', customerError)
      // Continue with deletion even if customer deletion fails
    }
  }

  // 6. Delete from Clerk (external service) - outside transaction
  try {
    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)
  } catch (clerkError) {
    console.error('Failed to delete user from Clerk:', clerkError)
    // Note: We continue with the deletion even if Clerk fails
    // The audit log will show this was processed
  }

  return apiSuccess({
    message: 'Account deleted successfully',
    deletionId: result.deletionRequest.id,
    dataDeleted: result.actualDeletionCounts,
    stripeCleanup: {
      hadSubscription: !!userSubscription?.stripeSubscriptionId,
      subscriptionCancelled: stripeCleanupResults.subscriptionCancelled,
      customerDeleted: stripeCleanupResults.customerDeleted,
      errors: {
        subscription: stripeCleanupResults.subscriptionError,
        customer: stripeCleanupResults.customerError
      }
    }
  })
}, {
  context: 'Account deletion',
  allowedMethods: ['POST'],
  expectedContentType: 'application/json'
})