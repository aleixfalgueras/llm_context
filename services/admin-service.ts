import {currentUser} from '@clerk/nextjs/server'
import {logger} from '@/lib/logger'
import {AdminDashboardData, FeedbackItem, UpdateSpendingLimitResponse} from '@/lib/types/admin-types'
import {clearAllCaches} from '@/services/subscription/subscription-cache'
import {FeedbackService, isValidFeedbackState} from '@/services/feedback-service'
import {FeedbackOperations} from '@/database/feedback-operations'
import {SubscriptionUsageOperations} from '@/database/subscription-usage-operations'
import {SubscriptionPlan, SubscriptionStatus, UserSubscription} from '@prisma/client'

const ADMIN_EMAILS = ['feina.aleix@gmail.com', 'a.nelson@dreamotion.io']

export class AdminService {
  
  static async isAdminUser(userId: string): Promise<boolean> {
    try {
      const user = await currentUser()
      const userEmail = user?.emailAddresses[0]?.emailAddress
      return userEmail ? ADMIN_EMAILS.includes(userEmail) : false
    } catch (error) {
      logger.error('Error checking admin status', error as Error, { userId })
      return false
    }
  }

  static async getAdminDashboardData(): Promise<AdminDashboardData> {
    try {
      // Get comprehensive system statistics using operations layer
      const [
        dashboardStats,
        feedbackResult,
        historicalUsage,
        allSubscriptions,
        subscriptionHistory
      ] = await Promise.all([
        // Get dashboard stats (total users, recent users, subscriptions by plan)
        SubscriptionUsageOperations.getAdminDashboardStats(),
        
        // All feedback for admin filtering
        FeedbackOperations.findAllFeedbackForAdmin(),
        
        // Get usage data for the last 12 months
        SubscriptionUsageOperations.getHistoricalUsage(12),
        
        // Get all subscriptions to calculate max possible usage
        SubscriptionUsageOperations.getAllSubscriptionsForCapacityCalc(),
        
        // Get subscription history for user trends
        SubscriptionUsageOperations.getMonthlySubscriptionHistory()
      ])

      // Extract feedback data from result
      const recentFeedback = feedbackResult.success ? feedbackResult.data : []

      // Process historical usage data into monthly buckets
      const monthlySpendingMap = new Map<string, number>()
      const monthlyMaxPossibleMap = new Map<string, number>()
      
      // Initialize last 12 months with 0 values
      const now = new Date()
      const monthKeys: string[] = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthKeys.push(monthKey)
        monthlySpendingMap.set(monthKey, 0)
        monthlyMaxPossibleMap.set(monthKey, 0)
      }
      
      // Aggregate spending by month
      historicalUsage.forEach(usage => {
        const date = new Date(usage.billingPeriodStart)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const currentTotal = monthlySpendingMap.get(monthKey) || 0
        monthlySpendingMap.set(monthKey, currentTotal + usage.cost_usd)
      })
      
      // Calculate max possible usage for each month
      monthKeys.forEach(monthKey => {
        const [year, month] = monthKey.split('-')
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1)
        const monthEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
        
        // Count active subscriptions for this month
        let maxPossible = 0
        allSubscriptions.forEach(sub => {
          const subStart = new Date(sub.createdAt)
          const subEnd = sub.canceledAt ? new Date(sub.canceledAt) : new Date()
          
          // Check if subscription was active during this month
          if (subStart <= monthEnd && subEnd >= monthStart) {
            // Use custom limit if available, otherwise use default
            const limit = sub.custom_spending_limit_usd ?? sub.spending_limit_usd
            maxPossible += limit
          }
        })
        
        monthlyMaxPossibleMap.set(monthKey, maxPossible)
      })
      
      // Convert to array format for chart
      const monthlySpendingHistory = monthKeys.map(monthKey => {
        const [year, month] = monthKey.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        return { 
          month: monthName, 
          spending: monthlySpendingMap.get(monthKey) || 0,
          maxPossible: monthlyMaxPossibleMap.get(monthKey) || 0
        }
      })

      // Process subscription history for monthly user trends
      const monthlySubscriptionMap = new Map<string, {
        totalUsers: Set<string>
        activeUsers: Set<string>
        planCounts: Map<SubscriptionPlan, number>
        apprenticeFreeCount: number
      }>()
      
      // Initialize maps for last 12 months
      monthKeys.forEach(monthKey => {
        monthlySubscriptionMap.set(monthKey, {
          totalUsers: new Set(),
          activeUsers: new Set(),
          planCounts: new Map([
            [SubscriptionPlan.apprentice, 0],
            [SubscriptionPlan.knight, 0],
            [SubscriptionPlan.master, 0],
            [SubscriptionPlan.jedi, 0]
          ]),
          apprenticeFreeCount: 0
        })
      })
      
      // Process each subscription for each month
      monthKeys.forEach(monthKey => {
        const [year, month] = monthKey.split('-')
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1)
        const monthEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
        
        subscriptionHistory.forEach((sub, index) => {
          const subStart = new Date(sub.createdAt)
          const subEnd = sub.canceledAt ? new Date(sub.canceledAt) : new Date()
          
          // Check if user existed during this month
          if (subStart <= monthEnd) {
            const monthData = monthlySubscriptionMap.get(monthKey)!
            monthData.totalUsers.add(`user_${index}`)
            
            // Check if subscription was active during this month using similar logic to SubscriptionService.isSubscriptionActive
            const isStatusActive = sub.status === SubscriptionStatus.active
            const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null
            const isNotExpired = periodEnd && periodEnd > monthStart
            const notCanceledInMonth = !sub.canceledAt || new Date(sub.canceledAt) > monthStart
            
            if (isStatusActive && isNotExpired && notCanceledInMonth) {
              monthData.activeUsers.add(`user_${index}`)
              
              // Count by plan type, separating free vs paid apprentice
              if (sub.plan === SubscriptionPlan.apprentice && !sub.stripeSubscriptionId) {
                monthData.apprenticeFreeCount += 1
              } else {
                const currentCount = monthData.planCounts.get(sub.plan) || 0
                monthData.planCounts.set(sub.plan, currentCount + 1)
              }
            }
          }
        })
      })
      
      // Convert to array format for chart
      const monthlySubscriptionHistory = monthKeys.map(monthKey => {
        const [year, month] = monthKey.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        const monthData = monthlySubscriptionMap.get(monthKey)!
        
        return {
          month: monthName,
          totalUsers: monthData.totalUsers.size,
          activeUsers: monthData.activeUsers.size,
          subscriptionBreakdown: {
            apprentice: monthData.planCounts.get(SubscriptionPlan.apprentice) || 0,
            apprenticeFree: monthData.apprenticeFreeCount,
            knight: monthData.planCounts.get(SubscriptionPlan.knight) || 0,
            master: monthData.planCounts.get(SubscriptionPlan.master) || 0,
            jedi: monthData.planCounts.get(SubscriptionPlan.jedi) || 0
          }
        }
      })

      return {
        totalUsers: dashboardStats.totalUsers,
        recentUsers: dashboardStats.recentUsers,
        allFeedback: recentFeedback as FeedbackItem[],
        userSubscriptions: dashboardStats.subscriptionsByPlan,
        monthlySpendingHistory,
        monthlySubscriptionHistory
      }
    } catch (error: any) {
      logger.error('Admin dashboard database error', error)
      
      // Check for connection timeout specifically
      if (error.code === 'P1017' || error.message?.includes('connection pool') || error.message?.includes('Timed out')) {
        throw new Error('Database connection timeout. Admin dashboard requires direct database access for complex queries. Please check your database configuration.')
      }
      
      // Re-throw with more context
      throw new Error(`Failed to load admin dashboard data: ${error.message || 'Unknown database error'}`)
    }
  }

  static async clearAllServerCaches(userId: string): Promise<{
    success: boolean
    message: string
    clearedCaches: string[]
  }> {
    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress

    // Check if user is admin
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      logger.warn('Non-admin user attempted to clear caches', { userId, metadata: { userEmail } })
      throw new Error('Forbidden - Admin access required')
    }

    // Clear all server-side caches
    logger.info('Admin clearing all server-side caches', { userId, metadata: { userEmail } })
    
    await clearAllCaches()
    
    logger.info('All server-side caches cleared successfully', { userId, metadata: { userEmail } })
    
    return { 
      success: true, 
      message: 'All caches cleared successfully',
      clearedCaches: [
        'subscription cache',
        'usage cache', 
        'storage cache',
        'client count cache'
      ]
    }
  }

  static async updateFeedbackState(
    feedbackId: string, 
    newState: string, 
    adminEmail: string
  ): Promise<{ success: boolean; message: string }> {
    // Validate that this is being called by an admin
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      throw new Error('Unauthorized: Admin access required')
    }

    // Validate the new state
    if (!isValidFeedbackState(newState)) {
      throw new Error('Invalid feedback state')
    }

    // Use FeedbackService to update the state
    const result = await FeedbackService.updateFeedbackState(feedbackId, newState, adminEmail)
    
    // Transform the result to match the expected format
    return {
      success: true,
      message: result.message
    }
  }

  /**
   * Get all user subscriptions information
   */
  static async getUserSubscriptions(adminUserId: string): Promise<UserSubscription[]> {
    const isAdmin = await this.isAdminUser(adminUserId)
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required')
    }

    try {
      return await SubscriptionUsageOperations.getAllUserSubscriptions()
    } catch (error) {
      logger.error('Failed to fetch users with subscriptions', error as Error)
      throw new Error('Failed to fetch users')
    }
  }

  /**
   * Update a user's custom spending limit
   */
  static async updateUserCustomSpendingLimit(
    adminUserId: string,
    targetUserId: string,
    customSpendingLimit: number | null
  ): Promise<UpdateSpendingLimitResponse> {
    const isAdmin = await this.isAdminUser(adminUserId)
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required')
    }

    // Validate spending limit if provided
    if (customSpendingLimit !== null) {
      if (customSpendingLimit < 0) {
        throw new Error('Spending limit cannot be negative')
      }
      if (customSpendingLimit > 10000) {
        throw new Error('Spending limit cannot exceed $10,000')
      }
    }

    try {
      const updatedSubscription = await SubscriptionUsageOperations.updateCustomSpendingLimit(
        targetUserId,
        customSpendingLimit
      )

      return {
        success: true,
        message: customSpendingLimit === null 
          ? 'Custom spending limit removed successfully'
          : `Custom spending limit set to $${customSpendingLimit}`,
        updatedLimit: updatedSubscription.custom_spending_limit_usd
      }
    } catch (error) {
      logger.error(`Failed to update user ${targetUserId} custom spending limit`, error as Error)
      throw new Error('Failed to update spending limit')
    }
  }

}