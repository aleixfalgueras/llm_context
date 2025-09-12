/**
 * Subscription and Usage database operations
 */

import {prisma} from '@/lib/prisma'
import {logger} from '@/lib/logger'
import {BaseOperations} from './base-operations'
import {SUBSCRIPTION_PLAN_DETAIL, SubscriptionWithUsage} from '@/lib/types/subscription-types'
import {SubscriptionPlan, SubscriptionStatus, UserSubscription, UserUsage, BillingInterval} from "@prisma/client";


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
   * Create default apprentice subscription for new users
   */
  static async createDefaultApprenticeSubscription(userId: string, email?: string): Promise<UserSubscription> {
    try {
      const now = new Date()
      const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days

      return await this.upsertSubscription(
        userId,
        {}, // Don't update if exists
        {
          email,
          plan: SubscriptionPlan.apprentice,
          status: SubscriptionStatus.active,
          billingInterval: BillingInterval.monthly,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          spending_limit_usd: SUBSCRIPTION_PLAN_DETAIL[SubscriptionPlan.apprentice].spending_limit_usd,
          cancelAtPeriodEnd: false,
          pendingPlanChange: null,
        }
      )
    } catch (error) {
      logger.error('Failed to create default apprentice subscription', error as Error, { userId })
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
    updateData: Partial<Pick<UserUsage, 'cost_usd'>> = {}
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
          cost_usd: 0,
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
   * Increment usage cost atomically
   */
  static async incrementCost(
    userId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    costToAdd: number
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
          cost_usd: costToAdd
        },
        update: {
          cost_usd: { increment: costToAdd }
        }
      })
    } catch (error) {
      logger.error('Failed to increment cost', error as Error, { 
        userId,
        metadata: {
          costToAdd,
          billingPeriodStart: billingPeriodStart.toISOString(),
          billingPeriodEnd: billingPeriodEnd.toISOString()
        }
      })
      throw error
    }
  }

  /**
   * Get all users subscription information for admin customization
   */
  static async getAllUserSubscriptions(): Promise<UserSubscription[]> {
    return prisma.userSubscription.findMany({
      orderBy: {createdAt: 'desc'}
    });
  }

  /**
   * Get all user subscriptions with their current billing period usage
   */
  static async getAllUserSubscriptionsWithUsage(): Promise<Array<SubscriptionWithUsage>> {
    try {
      // Get all subscriptions
      const subscriptions = await prisma.userSubscription.findMany({
        orderBy: {createdAt: 'desc'}
      });

      // For each subscription, get the current billing period usage
      return await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            // Find usage for current billing period
            const usage = await prisma.userUsage.findUnique({
              where: {
                userId_billingPeriodStart_billingPeriodEnd: {
                  userId: subscription.userId,
                  billingPeriodStart: subscription.currentPeriodStart,
                  billingPeriodEnd: subscription.currentPeriodEnd
                }
              }
            });

            return {
              ...subscription,
              currentUsage: usage?.cost_usd || 0
            };
          } catch (error) {
            logger.warn('Failed to get usage for user');
            return {
              ...subscription,
              currentUsage: 0
            };
          }
        })
      );
    } catch (error) {
      logger.error('Failed to get subscriptions with usage', error as Error);
      throw error;
    }
  }

  /**
   * Update custom spending limit for a specific user
   */
  static async updateCustomSpendingLimit(
    userId: string,
    customSpendingLimit: number | null
  ): Promise<UserSubscription> {
    try {
      return await prisma.userSubscription.update({
        where: { userId },
        data: { custom_spending_limit_usd: customSpendingLimit }
      })
    } catch (error) {
      logger.error('Failed to update custom spending limit', error as Error, { userId })
      throw error
    }
  }

  /**
   * Admin-specific: Get dashboard statistics
   * Returns total users, recent users, and subscription counts by plan
   */
  static async getAdminDashboardStats(): Promise<{
    totalUsers: number
    recentUsers: number
    subscriptionsByPlan: Array<{ plan: SubscriptionPlan; _count: number }>
  }> {
    try {
      const [totalUsers, recentUsers, subscriptionsByPlan] = await Promise.all([
        // Total user count
        prisma.userSubscription.count(),
        
        // Recent users (last 30 days)
        prisma.userSubscription.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Subscription counts by plan
        prisma.userSubscription.groupBy({
          by: ['plan'],
          _count: true
        })
      ])

      return {
        totalUsers,
        recentUsers,
        subscriptionsByPlan
      }
    } catch (error) {
      logger.error('Failed to get admin dashboard stats', error as Error)
      throw error
    }
  }

  /**
   * Admin-specific: Get historical usage data for specified months
   */
  static async getHistoricalUsage(months: number): Promise<UserUsage[]> {
    try {
      return await prisma.userUsage.findMany({
        where: {
          billingPeriodStart: {
            gte: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          billingPeriodStart: true,
          cost_usd: true,
          userId: true,
          billingPeriodEnd: true
        }
      }) as UserUsage[]
    } catch (error) {
      logger.error('Failed to get historical usage', error as Error, { metadata: { months } })
      throw error
    }
  }

  /**
   * Admin-specific: Get all subscriptions for capacity calculations
   */
  static async getAllSubscriptionsForCapacityCalc(): Promise<Array<{
    createdAt: Date
    canceledAt: Date | null
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    spending_limit_usd: number
    custom_spending_limit_usd: number | null
    status: SubscriptionStatus
  }>> {
    try {
      return await prisma.userSubscription.findMany({
        select: {
          createdAt: true,
          canceledAt: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          spending_limit_usd: true,
          custom_spending_limit_usd: true,
          status: true
        }
      })
    } catch (error) {
      logger.error('Failed to get subscriptions for capacity calc', error as Error)
      throw error
    }
  }

  /**
   * Admin-specific: Get all subscriptions for monthly subscription history
   * Returns data needed to calculate total and active users per month
   */
  static async getMonthlySubscriptionHistory(): Promise<Array<{
    createdAt: Date
    canceledAt: Date | null
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    status: SubscriptionStatus
    plan: SubscriptionPlan
    stripeSubscriptionId: string | null
  }>> {
    try {
      return await prisma.userSubscription.findMany({
        select: {
          createdAt: true,
          canceledAt: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          status: true,
          plan: true,
          stripeSubscriptionId: true
        }
      })
    } catch (error) {
      logger.error('Failed to get monthly subscription history', error as Error)
      throw error
    }
  }

}