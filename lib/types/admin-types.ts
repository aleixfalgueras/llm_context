/**
 * Type definitions for admin dashboard functionality
 * Contains interfaces for feedback management and dashboard data structures
 */

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
  totalClients: number
  totalDocuments: number
  totalChats: number
  totalMessages: number
  totalPrompts: number
  totalFeedback: number
  recentUsers: number
  allFeedback: FeedbackItem[]
  userSubscriptions: Array<{ plan: string; _count: number }>
  monthlyStats: { tokens: number }
}

export interface AdminDashboardClientProps {
  data: AdminDashboardData
}
