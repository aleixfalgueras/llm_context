import {clerkClient} from '@clerk/nextjs/server'
import {prisma} from '@/lib/prisma'
import {extractClientInfo, withdrawAllConsent} from '@/lib/utils/consent'
import {apiSuccess, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'
import {ApiErrors} from '@/lib/api/api-error-handler'
import {cancelSubscriptionImmediately} from '@/lib/stripe/stripe-subscription'
import {stripe} from '@/lib/stripe/stripe'
import {SubscriptionUsageOperations} from '@/database'
import {DELETE_CONFIRMATION_TEXT} from '@/lib/types/account-types'

/**
 * Account Deletion Endpoint
 * 
 * **Process Overview:**
 * The deletion process consists of 6 main steps executed in sequence to ensure
 * data integrity and proper cleanup across all systems.
 * 
 * Step 1: Validation & Consent Withdrawal
 * - Validates user-provided confirmation text matches required phrase
 * - Extracts client information (IP, user agent) for audit trail
 * - Withdraws all user consent records with proper documentation
 * - Performed outside transaction to avoid timeout issues
 * 
 * Step 2: Data Inventory & Audit Preparation
 * - Counts all user data across the platform for audit purposes
 * - Includes: clients, documents, chats, messages, prompts, feedback, affiliations
 * - Captures subscription details and Stripe customer information
 *
 * Step 3: Core Data Deletion (Transactional)
 * - Creates audit trail record before deletion begins
 * - Deletes user data in dependency order to respect foreign key constraints
 * - Handles affiliation hierarchy (orphans child affiliations instead of deleting)
 * - Add "deleted_user" to the userId from the UserSubscription table
 * - Updates audit record with actual deletion counts
 * - Uses extended timeout transaction to handle large data sets
 * 
 * Step 4: Completion Audit Logging
 * - Creates final audit log entry confirming deletion completion
 * - Records deletion request ID for traceability
 * - Performed outside transaction for reliability
 * 
 * Step 5: Stripe Cleanup
 * - Cancels active subscription immediately with proper reason code
 * - Handles errors gracefully - deletion continues even if Stripe operations fail
 * - Records success/failure status for each Stripe operation
 * 
 * Step 6: External Service Cleanup
 * - Removes user from Clerk authentication service
 * - Handles errors gracefully - process continues even if external cleanup fails
 * - Logs any failures for manual review
 *
 */
export const POST = withEnhancedApi(async ({ userId, req }) => {
  const { confirmationText, reason = 'user_request' } = await parseJsonBody(req)

  if (confirmationText !== DELETE_CONFIRMATION_TEXT) {
    return ApiErrors.badRequest(`Please type "${DELETE_CONFIRMATION_TEXT}" to confirm deletion`)
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

    // Anonymize UserSubscription records by prefixing userId
    const anonymizedSubscriptions = await tx.userSubscription.updateMany({
      where: { userId },
      data: { 
        userId: `deleted_user_${userId}`,
        updatedAt: new Date()
      }
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
            affiliationChildrenOrphaned: deletedAffiliationChildren.count,
            subscriptionsAnonymized: anonymizedSubscriptions.count
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
        affiliationChildrenOrphaned: deletedAffiliationChildren.count,
        subscriptionsAnonymized: anonymizedSubscriptions.count
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

  // 5. Handle Stripe subscription cleanup
  let stripeCleanupResults = {
    subscriptionCancelled: false,
    subscriptionError: null as string | null
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
      errors: {
        subscription: stripeCleanupResults.subscriptionError
      }
    }
  })
}, {
  context: 'Account deletion',
  allowedMethods: ['POST'],
  expectedContentType: 'application/json'
})