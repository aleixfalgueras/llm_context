/**
 * Type definitions for admin dashboard functionality
 * Contains interfaces for feedback management and dashboard data structures
 */

import { Deal, SubscriptionPlan, BillingInterval } from '@prisma/client'

export interface FeedbackItem {
  id: string
  type: string
  title: string
  priority: string
  state: string
  userEmail: string | null
  userName: string | null
  description: string
  createdAt: Date
  isUpdating?: boolean // For loading states during status updates
}

export interface AdminDashboardData {
  totalUsers: number
  recentUsers: number
  allFeedback: FeedbackItem[]
  pendingDeals: Deal[]
  userSubscriptions: Array<{ plan: string; _count: number }>
  monthlySpendingHistory: Array<{ month: string; spending: number; maxPossible: number }>
  monthlySubscriptionHistory: Array<{
    month: string
    totalUsers: number
    activeUsers: number
    subscriptionBreakdown: {
      apprentice: number
      apprenticeFree: number
      knight: number
      master: number
      jedi: number
    }
  }>
}

export interface UpdateSpendingLimitResponse {
  success: boolean
  message: string
  updatedLimit?: number | null
}

export interface GrantSubscriptionResponse {
  success: boolean
  message: string
  subscription?: {
    plan: SubscriptionPlan
    billingInterval: BillingInterval
    currentPeriodStart: Date
    currentPeriodEnd: Date
    spending_limit_usd: number
  }
}
