/**
 * Script to backfill email addresses for existing UserSubscription records
 * Run this after deploying the email field addition to populate existing records
 */

import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'

async function backfillSubscriptionEmails() {
  try {
    logger.info('Starting email backfill for UserSubscription records')
    
    // Get Clerk client
    const client = await clerkClient()
    
    // Fetch all subscriptions without email
    const subscriptionsWithoutEmail = await prisma.userSubscription.findMany({
      where: {
        email: null
      }
    })
    
    logger.info(`Found ${subscriptionsWithoutEmail.length} subscriptions without email`)
    
    let successCount = 0
    let failureCount = 0
    
    for (const subscription of subscriptionsWithoutEmail) {
      try {
        // Fetch user from Clerk
        const user = await client.users.getUser(subscription.userId)
        const email = user.emailAddresses[0]?.emailAddress
        
        if (email) {
          // Update subscription with email
          await prisma.userSubscription.update({
            where: {
              id: subscription.id
            },
            data: {
              email
            }
          })
          
          successCount++
          logger.info(`Updated subscription for user ${subscription.userId} with email ${email}`)
        } else {
          logger.warn(`No email found in Clerk for user ${subscription.userId}`)
          failureCount++
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        logger.error(`Failed to update email for subscription ${subscription.id}`, error as Error, {
          userId: subscription.userId
        })
        failureCount++
      }
    }
    
    logger.info('Email backfill completed', {
      metadata: {
        totalProcessed: subscriptionsWithoutEmail.length,
        successCount,
        failureCount
      }
    })
    
  } catch (error) {
    logger.error('Failed to run email backfill script', error as Error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
backfillSubscriptionEmails()
  .then(() => {
    console.log('✅ Email backfill completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Email backfill failed:', error)
    process.exit(1)
  })