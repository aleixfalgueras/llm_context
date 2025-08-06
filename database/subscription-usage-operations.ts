/**
 * Subscription and Usage database operations
 */

import {prisma} from '@/lib/prisma'
import {logger} from '@/lib/logger'
import {BaseOperations} from './base-operations'
import {SUBSCRIPTION_PLAN_DETAIL} from '@/lib/types/subscription-types'
import {SubscriptionPlan, SubscriptionStatus, UserSubscription, UserUsage} from "@prisma/client";

// TODO: Use base-operations methods
export class SubscriptionUsageOperations extends BaseOperations {
  /**
   * Find user subscription by userId
   */
  static async findByUserId(userId: string): Promise<UserSubscription | null> {
    try {
      return await prisma.userSubscription.findUnique({
        where: { userId },
      })
    } catch (error) {
      logger.error('Failed to find subscription by userId', error as Error, { userId })
      throw error
    }
  }

  /**
   * Find user subscription by stripeCustomerId
   */
  static async findByCustomerId(customerId: string): Promise<UserSubscription | null> {
    try {
      return await prisma.userSubscription.findFirst({
        where: { stripeCustomerId: customerId },
      })
    } catch (error) {
      logger.error('Failed to find subscription by customerId', error as Error, { metadata: { customerId } })
      throw error
    }
  }

  /**
   * Upsert user subscription
   */
  static async upsertSubscription(
    userId: string,
    updateData: Partial<UserSubscription> = {},
    createData: Partial<Omit<UserSubscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {}
  ): Promise<UserSubscription> {
    try {
      return await prisma.userSubscription.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...createData
        }
      })
    } catch (error) {
      logger.error('Failed to upsert subscription', error as Error, { userId })
      throw error
    }
  }

  /**
   * Create default basic subscription for new users
   */
  static async createDefaultBasicSubscription(userId: string): Promise<UserSubscription> {
    try {
      const now = new Date()
      const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days

      return await this.upsertSubscription(
        userId,
        {}, // Don't update if exists
        {
          plan: SubscriptionPlan.basic,
          status: SubscriptionStatus.active,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          tokenLimit: SUBSCRIPTION_PLAN_DETAIL[SubscriptionPlan.basic].tokenLimit,
          cancelAtPeriodEnd: false,
          pendingPlanChange: null,
        }
      )
    } catch (error) {
      logger.error('Failed to create default basic subscription', error as Error, { userId })
      throw error
    }
  }

  /**
   * Update existing subscription with new data
   */
  static async updateSubscription(userId: string, updateData: Partial<Omit<UserSubscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserSubscription> {
    try {
      return await this.upsertSubscription(
        userId,
        updateData,
        {} // Empty createData ensures it only updates, never creates
      )
    } catch (error) {
      logger.error('Failed to update subscription', error as Error, { userId, metadata: { updateData } })
      throw error
    }
  }

  /**
   * Clear schedule fields (stripeScheduleId and pendingPlanChange)
   */
  static async clearScheduleFields(userId: string): Promise<UserSubscription> {
    try {
      return await this.updateSubscription(userId, {
        stripeScheduleId: null,
        pendingPlanChange: null
      })
    } catch (error) {
      logger.error('Failed to clear schedule fields', error as Error, { userId })
      throw error
    }
  }

  /**
   * Find usage by billing period
   */
  static async findUsageByPeriod(
    userId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date
  ): Promise<UserUsage | null> {
    try {
      return await prisma.userUsage.findUnique({
        where: {
          userId_billingPeriodStart_billingPeriodEnd: {
            userId,
            billingPeriodStart,
            billingPeriodEnd
          }
        }
      })
    } catch (error) {
      logger.error('Failed to find usage by period', error as Error, { 
        userId,
        metadata: {
          billingPeriodStart: billingPeriodStart.toISOString(),
          billingPeriodEnd: billingPeriodEnd.toISOString()
        }
      })
      throw error
    }
  }

  /**
   * Upsert user usage record
   */
  static async upsertUsage(
    userId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    updateData: Partial<Pick<UserUsage, 'tokensUsed'>> = {}
  ): Promise<UserUsage> {
    try {
      return await prisma.userUsage.upsert({
        where: {
          userId_billingPeriodStart_billingPeriodEnd: {
            userId,
            billingPeriodStart,
            billingPeriodEnd
          }
        },
        update: updateData,
        create: {
          userId,
          billingPeriodStart,
          billingPeriodEnd,
          tokensUsed: 0,
          ...updateData
        }
      })
    } catch (error) {
      logger.error('Failed to upsert usage', error as Error, { 
        userId,
        metadata: {
          billingPeriodStart: billingPeriodStart.toISOString(),
          billingPeriodEnd: billingPeriodEnd.toISOString()
        }
      })
      throw error
    }
  }

  /**
   * Increment usage tokens atomically
   */
  static async incrementUsage(
    userId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    tokensToAdd: number
  ): Promise<UserUsage> {
    try {
      return await prisma.userUsage.upsert({
        where: {
          userId_billingPeriodStart_billingPeriodEnd: {
            userId,
            billingPeriodStart,
            billingPeriodEnd
          }
        },
        create: {
          userId,
          billingPeriodStart,
          billingPeriodEnd,
          tokensUsed: tokensToAdd
        },
        update: {
          tokensUsed: { increment: tokensToAdd }
        }
      })
    } catch (error) {
      logger.error('Failed to increment usage', error as Error, { 
        userId,
        metadata: {
          tokensToAdd,
          billingPeriodStart: billingPeriodStart.toISOString(),
          billingPeriodEnd: billingPeriodEnd.toISOString()
        }
      })
      throw error
    }
  }

}