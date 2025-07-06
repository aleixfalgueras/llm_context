/**
 * Type definitions for admin dashboard functionality
 * Contains interfaces for feedback management and dashboard data structures
 */

// =============================================================================
// FEEDBACK TYPES
// =============================================================================

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
}

// =============================================================================
// DASHBOARD DATA TYPES
// =============================================================================

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

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

export interface AdminDashboardClientProps {
  data: AdminDashboardData
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface FeedbackFilters {
  type: string
  priority: string
  state: string
}

export interface FeedbackFilterHandlers {
  onTypeChange: (type: string) => void
  onPriorityChange: (priority: string) => void
  onStateChange: (state: string) => void
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type FeedbackSortOrder = 'newest' | 'oldest' | 'priority' | 'state'

export interface FeedbackDisplayOptions {
  sortOrder: FeedbackSortOrder
  showDescription: boolean
  itemsPerPage: number
}