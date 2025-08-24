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
import {BadgeVariant, FeedbackState, FeedbackType, Priority} from '@/lib/types/enums'
import {AdminDashboardClientProps, FeedbackItem} from '@/lib/types/admin-types'
import { useToast } from '@/hooks/use-toast'
import { handleClientApiError } from '@/lib/api/api-toast'
import {useTranslations} from '@/lib/translations/context'

export default function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('active') // Default to PENDING + IN_PROGRESS
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>(data.allFeedback)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [clearingCaches, setClearingCaches] = useState<boolean>(false)

  const clearFilters = () => {
    setTypeFilter('all')
    setPriorityFilter('all')
    setStateFilter('active')
  }

  const hasActiveFilters = typeFilter !== 'all' || priorityFilter !== 'all' || stateFilter !== 'active'

  const handleClearCaches = async () => {
    setClearingCaches(true)
    try {
      const response = await fetch('/api/admin/clear-caches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('errors.admin.clearCaches') }))
        throw new Error(errorData.error)
      }

      const result = await response.json()
      
      toast({
        title: 'Success',
        description: result.message || t('dashboard.success.cachesCleared')
      })
    } catch (error) {
      console.error('Error clearing caches:', error)
      const errorMessage = error instanceof Error ? error.message : t('errors.admin.clearCaches')
      handleClientApiError(errorMessage, t('errors.admin.clearCaches'))
    } finally {
      setClearingCaches(false)
    }
  }

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
        const errorData = await response.json().catch(() => ({ error: t('errors.admin.updateFeedback') }))
        throw new Error(errorData.error)
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
      const errorMessage = error instanceof Error ? error.message : t('errors.admin.updateFeedback')
      handleClientApiError(errorMessage, t('errors.admin.updateFeedback'))
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('dashboard.description')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleClearCaches}
            disabled={clearingCaches}
            className="flex items-center gap-2"
          >
            {clearingCaches ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('dashboard.buttons.clearingCaches')}
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                {t('dashboard.buttons.clearCaches')}
              </>
            )}
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.metrics.totalUsers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{data.recentUsers} {t('dashboard.metrics.inLast30Days')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.metrics.totalClients')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.metrics.acrossAllUsers')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.metrics.totalDocuments')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.metrics.unlimitedForAllPlans')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.metrics.chatConversations')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalChats}</div>
              <p className="text-xs text-muted-foreground">
                {data.totalMessages} {t('dashboard.metrics.messagesTotal')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.metrics.monthlyUsage')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.metrics.tokens')}</span>
                  <span className="font-medium">{data.monthlyStats.tokens.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.metrics.subscriptionPlans')}</CardTitle>
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
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.metrics.feedbackAndPrompts')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.metrics.totalFeedback')}</span>
                  <span className="font-medium">{data.totalFeedback}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.metrics.customPrompts')}</span>
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
              {t('dashboard.feedbackManagement.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.feedbackManagement.description')} ({filteredAndSortedFeedback.length} of {feedbackData.length} {t('dashboard.feedbackManagement.showingCount')})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('dashboard.filters.state')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.filters.options.allStates')}</SelectItem>
                  <SelectItem value="active">{t('dashboard.filters.options.active')}</SelectItem>
                  <SelectItem value={FeedbackState.PENDING}>{t('dashboard.filters.options.pending')}</SelectItem>
                  <SelectItem value={FeedbackState.IN_PROGRESS}>{t('dashboard.filters.options.inProgress')}</SelectItem>
                  <SelectItem value={FeedbackState.COMPLETED}>{t('dashboard.filters.options.completed')}</SelectItem>
                  <SelectItem value={FeedbackState.FALSE_ALARM}>{t('dashboard.filters.options.falseAlarm')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('dashboard.filters.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.filters.options.allTypes')}</SelectItem>
                  <SelectItem value={FeedbackType.FEATURE}>{t('dashboard.filters.options.featureRequest')}</SelectItem>
                  <SelectItem value={FeedbackType.BUG}>{t('dashboard.filters.options.bugReport')}</SelectItem>
                  <SelectItem value={FeedbackType.COMPLAINT}>{t('dashboard.filters.options.generalFeedback')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('dashboard.filters.priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.filters.options.allPriorities')}</SelectItem>
                  <SelectItem value={Priority.HIGH}>{t('dashboard.filters.options.highPriority')}</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>{t('dashboard.filters.options.mediumPriority')}</SelectItem>
                  <SelectItem value={Priority.LOW}>{t('dashboard.filters.options.lowPriority')}</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full sm:w-auto flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('dashboard.buttons.clearFilters')}
                </Button>
              )}
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
              {filteredAndSortedFeedback.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('dashboard.feedbackManagement.noMatches')}</p>
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
                        {feedback.userName || feedback.userEmail || t('dashboard.anonymous')} • {new Date(feedback.createdAt).toLocaleDateString()}
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
                            {t('dashboard.feedbackManagement.updating')}
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
                              <SelectItem value={FeedbackState.PENDING}>{t('dashboard.filters.options.pending')}</SelectItem>
                              <SelectItem value={FeedbackState.IN_PROGRESS}>{t('dashboard.filters.options.inProgress')}</SelectItem>
                              <SelectItem value={FeedbackState.COMPLETED}>{t('dashboard.filters.options.completed')}</SelectItem>
                              <SelectItem value={FeedbackState.FALSE_ALARM}>{t('dashboard.filters.options.falseAlarm')}</SelectItem>
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