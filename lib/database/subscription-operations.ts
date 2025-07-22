/**
 * Subscription-specific database operations
 */

import {prisma} from '../prisma'
import {logger} from '../logger'
import {BaseOperations} from './base-operations'
import {SUBSCRIPTION_PLAN_DETAIL} from '@/types/subscription-types'
import {SubscriptionPlan, SubscriptionStatus} from "@prisma/client";

export class SubscriptionOperations extends BaseOperations {
  /**
   * Find user subscription by userId
   */
  static async findByUserId(userId: string) {
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
   * Upsert user subscription
   */
  static async upsertSubscription(
    userId: string,
    updateData: Partial<any> = {},
    createData: Partial<any> = {}
  ) {
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
  static async createDefaultBasicSubscription(userId: string) {
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
  static async updateSubscription(userId: string, updateData: Partial<any>) {
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
  static async clearScheduleFields(userId: string) {
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

}