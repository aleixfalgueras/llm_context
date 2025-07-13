'use client'

import {useMemo, useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {
  AlertTriangle,
  DollarSign,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  RotateCcw,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react'
import {BadgeVariant, FeedbackState, FeedbackType, Priority} from '@/types/enums'
import {AdminDashboardClientProps, FeedbackItem} from '@/types/admin-types'

export default function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('active') // Default to PENDING + IN_PROGRESS
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>(data.allFeedback)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const clearFilters = () => {
    setTypeFilter('all')
    setPriorityFilter('all')
    setStateFilter('active')
  }

  const hasActiveFilters = typeFilter !== 'all' || priorityFilter !== 'all' || stateFilter !== 'active'

  const updateFeedbackStatus = async (feedbackId: string, newState: string) => {
    // Add to updating items
    setUpdatingItems(prev => new Set(prev).add(feedbackId))

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: newState }),
      })

      if (!response.ok) {
        throw new Error('Failed to update feedback status')
      }

      const result = await response.json()

      // Update local state
      setFeedbackData(prev => 
        prev.map(item => 
          item.id === feedbackId 
            ? { ...item, state: newState }
            : item
        )
      )

      // Show success message (you could add toast here)
      console.log('Status updated successfully:', result.message)

    } catch (error) {
      console.error('Error updating feedback status:', error)
      // Handle error (you could add toast here)
    } finally {
      // Remove from updating items
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(feedbackId)
        return newSet
      })
    }
  }

  const filteredAndSortedFeedback = useMemo(() => {
    let filtered = feedbackData

    // Apply filters
    if (typeFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.type === typeFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.priority === priorityFilter)
    }

    if (stateFilter !== 'all') {
      if (stateFilter === 'active') {
        // Default filter: PENDING or IN_PROGRESS
        filtered = filtered.filter(feedback => 
          feedback.state === FeedbackState.PENDING || 
          feedback.state === FeedbackState.IN_PROGRESS
        )
      } else {
        filtered = filtered.filter(feedback => feedback.state === stateFilter)
      }
    }

    // Sort: IN_PROGRESS first, then PENDING, then others by creation date
    return filtered.sort((a, b) => {
      if (a.state === FeedbackState.IN_PROGRESS && b.state !== FeedbackState.IN_PROGRESS) return -1
      if (b.state === FeedbackState.IN_PROGRESS && a.state !== FeedbackState.IN_PROGRESS) return 1
      if (a.state === FeedbackState.PENDING && b.state !== FeedbackState.PENDING) return -1
      if (b.state === FeedbackState.PENDING && a.state !== FeedbackState.PENDING) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [feedbackData, typeFilter, priorityFilter, stateFilter])

  const getBadgeVariant = (type: string, priority: string, state: string): BadgeVariant => {
    if (type === FeedbackType.BUG) return BadgeVariant.DESTRUCTIVE
    if (priority === Priority.HIGH) return BadgeVariant.DESTRUCTIVE
    if (state === FeedbackState.COMPLETED) return BadgeVariant.SECONDARY
    if (state === FeedbackState.IN_PROGRESS) return BadgeVariant.DEFAULT
    return BadgeVariant.OUTLINE
  }

  const getStateBadgeVariant = (state: string): BadgeVariant => {
    switch (state) {
      case FeedbackState.COMPLETED: return BadgeVariant.SECONDARY
      case FeedbackState.IN_PROGRESS: return BadgeVariant.DEFAULT
      case FeedbackState.PENDING: return BadgeVariant.OUTLINE
      case FeedbackState.FALSE_ALARM: return BadgeVariant.DESTRUCTIVE
      default: return BadgeVariant.OUTLINE
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System overview and metrics for LLM Context platform
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{data.recentUsers} in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Unlimited for all plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Chat Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalChats}</div>
              <p className="text-xs text-muted-foreground">
                {data.totalMessages} messages total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Monthly Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Tokens:</span>
                  <span className="font-medium">{data.monthlyStats.tokens.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Subscription Plans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.userSubscriptions.map((sub) => (
                  <div key={sub.plan} className="flex justify-between">
                    <span className="text-sm capitalize">{sub.plan}:</span>
                    <span className="font-medium">{sub._count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Feedback & Prompts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Feedback:</span>
                  <span className="font-medium">{data.totalFeedback}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Custom Prompts:</span>
                  <span className="font-medium">{data.totalPrompts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Filter className="h-5 w-5" />
              Feedback Management
            </CardTitle>
            <CardDescription>
              Filter and manage user feedback ({filteredAndSortedFeedback.length} of {feedbackData.length} shown)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value={FeedbackState.PENDING}>Pending</SelectItem>
                  <SelectItem value={FeedbackState.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={FeedbackState.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={FeedbackState.FALSE_ALARM}>False Alarm</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={FeedbackType.FEATURE}>Feature Request</SelectItem>
                  <SelectItem value={FeedbackType.BUG}>Bug Report</SelectItem>
                  <SelectItem value={FeedbackType.COMPLAINT}>General Feedback</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value={Priority.HIGH}>High Priority</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>Medium Priority</SelectItem>
                  <SelectItem value={Priority.LOW}>Low Priority</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full sm:w-auto flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
              {filteredAndSortedFeedback.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No feedback matches the selected filters</p>
              ) : (
                filteredAndSortedFeedback.map((feedback) => (
                  <div key={feedback.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStateBadgeVariant(feedback.state)}>
                          {feedback.state.replace('_', ' ')}
                        </Badge>
                        <Badge variant={
                          feedback.type === FeedbackType.BUG ? BadgeVariant.DESTRUCTIVE : 
                          feedback.type === FeedbackType.FEATURE ? BadgeVariant.DEFAULT : BadgeVariant.SECONDARY
                        }>
                          {feedback.type}
                        </Badge>
                        <Badge variant={
                          feedback.priority === Priority.HIGH ? BadgeVariant.DESTRUCTIVE :
                          feedback.priority === Priority.MEDIUM ? BadgeVariant.DEFAULT : BadgeVariant.SECONDARY
                        }>
                          {feedback.priority}
                        </Badge>
                      </div>
                      <h4 className="font-medium mb-1">{feedback.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{feedback.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {feedback.userName || feedback.userEmail || 'Anonymous'} • {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2 min-w-[140px]">
                      <div className="flex items-center gap-1">
                        {feedback.type === FeedbackType.BUG && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {feedback.type === FeedbackType.FEATURE && <TrendingUp className="h-4 w-4 text-blue-500" />}
                        {feedback.type === FeedbackType.COMPLAINT && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                      
                      <div className="relative">
                        {updatingItems.has(feedback.id) ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 text-xs bg-muted rounded-md">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Updating...
                          </div>
                        ) : (
                          <Select 
                            value={feedback.state} 
                            onValueChange={(newState) => updateFeedbackStatus(feedback.id, newState)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={FeedbackState.PENDING}>Pending</SelectItem>
                              <SelectItem value={FeedbackState.IN_PROGRESS}>In Progress</SelectItem>
                              <SelectItem value={FeedbackState.COMPLETED}>Completed</SelectItem>
                              <SelectItem value={FeedbackState.FALSE_ALARM}>False Alarm</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  )
}