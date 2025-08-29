'use client'

import {useEffect, useMemo, useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Input} from '@/components/ui/input'
import {
  AlertTriangle,
  BarChart3,
  Edit2,
  Filter,
  Loader2,
  MessageSquare,
  RotateCcw,
  Search,
  Settings,
  TrendingUp,
  Users,
  X,
  XCircle
} from 'lucide-react'
import {BadgeVariant} from '@/lib/enums'
import {AdminDashboardData, FeedbackItem} from '@/lib/types/admin-types'
import {UserSubscription} from '@prisma/client'
import {useToast} from '@/hooks/use-toast'
import {handleClientApiError} from '@/lib/api/api-toast'
import {useTranslations} from '@/lib/translations/context'
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'
import {FeedbackState, FeedbackType, Priority} from "@/lib/types/feedback-types";

interface AdminDashboardClientProps {
  data: AdminDashboardData
}

export default function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('active') // Default to PENDING + IN_PROGRESS
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>(data.allFeedback)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [clearingCaches, setClearingCaches] = useState<boolean>(false)
  
  // Customization tab state
  const [users, setUsers] = useState<UserSubscription[]>([])
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false)
  const [userSearchQuery, setUserSearchQuery] = useState<string>('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [newSpendingLimit, setNewSpendingLimit] = useState<string>('')
  const [updatingSpendingLimit, setUpdatingSpendingLimit] = useState<boolean>(false)

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

  const getStateBadgeVariant = (state: string): BadgeVariant => {
    switch (state) {
      case FeedbackState.COMPLETED: return BadgeVariant.SECONDARY
      case FeedbackState.IN_PROGRESS: return BadgeVariant.DEFAULT
      case FeedbackState.PENDING: return BadgeVariant.OUTLINE
      case FeedbackState.FALSE_ALARM: return BadgeVariant.DESTRUCTIVE
      default: return BadgeVariant.OUTLINE
    }
  }

  // Fetch users when Customization tab is selected
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const response = await fetch('/api/admin/users/spending-limit', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: t('dashboard.customization.spendingLimits.errors.fetchUsers') }))
          throw new Error(errorData.error)
        }

        const result = await response.json()
        setUsers(result.users || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        const errorMessage = error instanceof Error ? error.message : t('dashboard.customization.spendingLimits.errors.fetchUsers')
        handleClientApiError(errorMessage, t('dashboard.customization.spendingLimits.errors.fetchUsers'))
      } finally {
        setLoadingUsers(false)
      }
    }

    // Only fetch when we have an active tab (optional - you could trigger on tab change)
    fetchUsers()
  }, [])

  const handleUpdateSpendingLimit = async (userId: string, removeLimit: boolean = false) => {
    setUpdatingSpendingLimit(true)
    try {
      const customSpendingLimit = removeLimit ? null : parseFloat(newSpendingLimit)
      
      if (!removeLimit && (isNaN(customSpendingLimit!) || customSpendingLimit! < 0)) {
        toast({
          title: 'Error',
          description: t('dashboard.customization.spendingLimits.errors.invalidAmount'),
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('/api/admin/users/spending-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: userId,
          customSpendingLimit: removeLimit ? null : customSpendingLimit
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('dashboard.customization.spendingLimits.errors.updateLimit') }))
        throw new Error(errorData.error)
      }

      const result = await response.json()
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.userId === userId 
            ? { ...user, custom_spending_limit_usd: result.updatedLimit }
            : user
        )
      )

      toast({
        title: 'Success',
        description: removeLimit 
          ? t('dashboard.customization.spendingLimits.success.limitRemoved')
          : t('dashboard.customization.spendingLimits.success.limitUpdated')
      })

      // Reset editing state
      setEditingUserId(null)
      setNewSpendingLimit('')

    } catch (error) {
      console.error('Error updating spending limit:', error)
      const errorMessage = error instanceof Error ? error.message : t('dashboard.customization.spendingLimits.errors.updateLimit')
      handleClientApiError(errorMessage, t('dashboard.customization.spendingLimits.errors.updateLimit'))
    } finally {
      setUpdatingSpendingLimit(false)
    }
  }

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users
    
    const query = userSearchQuery.toLowerCase()
    return users.filter(user => 
      user.email?.toLowerCase().includes(query) || 
      user.userId.toLowerCase().includes(query)
    )
  }, [users, userSearchQuery])

  return (
    <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="stats" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid max-w-md grid-cols-3">
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t('admin.dashboard.tabs.stats')}
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('admin.dashboard.tabs.feedback')}
              </TabsTrigger>
              <TabsTrigger value="customization" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('admin.dashboard.tabs.customization')}
              </TabsTrigger>
            </TabsList>
            
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

          <TabsContent value="stats" className="mt-6">


            {/* Monthly Spending Graph */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
              {t('dashboard.metrics.monthlyUsage')}
            </CardTitle>
            <CardDescription>
              {t('admin.dashboard.descriptions.monthlyUsageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.monthlySpendingHistory}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `$${value.toFixed(2)}`, 
                      name === 'spending' ? t('admin.dashboard.spending.tooltip.actualSpending') : t('admin.dashboard.spending.tooltip.maxCapacity')
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spending" 
                    stroke="hsl(217, 91%, 60%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="spending"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="maxPossible" 
                    stroke="hsl(142, 71%, 45%)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                    name="maxPossible"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-8 bg-blue-500 rounded" />
                <span className="text-sm text-muted-foreground">{t('admin.dashboard.spending.legend.actualSpending')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-8 bg-green-600 rounded border-2 border-dashed border-green-600 bg-opacity-50" />
                <span className="text-sm text-muted-foreground">{t('admin.dashboard.spending.legend.maximumCapacity')}</span>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Monthly Subscription History Graph */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
                {t('dashboard.metrics.monthlySubscriptions')}
              </CardTitle>
              <CardDescription>
                {t('admin.dashboard.descriptions.monthlySubscriptionsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.monthlySubscriptionHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickFormatter={(value) => value.toString()}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataPoint = data.monthlySubscriptionHistory.find(d => d.month === label)
                          if (!dataPoint) return null
                          
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium mb-2">{label}</p>
                              <div className="space-y-1 text-sm">
                                <p className="flex justify-between gap-4">
                                  <span>{t('admin.dashboard.tooltip.users')}</span>
                                  <span className="font-medium">{dataPoint.totalUsers}</span>
                                </p>
                                <p className="flex justify-between gap-4">
                                  <span>{t('admin.dashboard.tooltip.activeUsers')}</span>
                                  <span className="font-medium">{dataPoint.activeUsers}</span>
                                </p>
                                {dataPoint.activeUsers > 0 && (
                                  <>
                                    <div className="border-t pt-1 mt-1">
                                      <p className="text-xs text-muted-foreground mb-1">{t('admin.dashboard.tooltip.activeSubscriptions')}</p>
                                      <p className="flex justify-between gap-4">
                                        <span className="text-xs">{t('admin.dashboard.plans.apprentice')}</span>
                                        <span className="font-medium text-xs">{dataPoint.subscriptionBreakdown.apprentice}</span>
                                      </p>
                                      <p className="flex justify-between gap-4">
                                        <span className="text-xs">{t('admin.dashboard.plans.knight')}</span>
                                        <span className="font-medium text-xs">{dataPoint.subscriptionBreakdown.knight}</span>
                                      </p>
                                      <p className="flex justify-between gap-4">
                                        <span className="text-xs">{t('admin.dashboard.plans.master')}</span>
                                        <span className="font-medium text-xs">{dataPoint.subscriptionBreakdown.master}</span>
                                      </p>
                                      <p className="flex justify-between gap-4">
                                        <span className="text-xs">{t('admin.dashboard.plans.jedi')}</span>
                                        <span className="font-medium text-xs">{dataPoint.subscriptionBreakdown.jedi}</span>
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalUsers" 
                      stroke="hsl(217, 91%, 60%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="totalUsers"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke="hsl(142, 71%, 45%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="activeUsers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 bg-blue-500 rounded" />
                  <span className="text-sm text-muted-foreground">{t('admin.dashboard.legend.totalUsers')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 bg-green-600 rounded" />
                  <span className="text-sm text-muted-foreground">{t('admin.dashboard.legend.activeUsers')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
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
                  <SelectItem value={FeedbackType.feature}>{t('dashboard.filters.options.featureRequest')}</SelectItem>
                  <SelectItem value={FeedbackType.bug}>{t('dashboard.filters.options.bugReport')}</SelectItem>
                  <SelectItem value={FeedbackType.complaint}>{t('dashboard.filters.options.generalFeedback')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('dashboard.filters.priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.filters.options.allPriorities')}</SelectItem>
                  <SelectItem value={Priority.high}>{t('dashboard.filters.options.highPriority')}</SelectItem>
                  <SelectItem value={Priority.medium}>{t('dashboard.filters.options.mediumPriority')}</SelectItem>
                  <SelectItem value={Priority.low}>{t('dashboard.filters.options.lowPriority')}</SelectItem>
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
                          feedback.type === FeedbackType.bug ? BadgeVariant.DESTRUCTIVE : 
                          feedback.type === FeedbackType.feature ? BadgeVariant.DEFAULT : BadgeVariant.SECONDARY
                        }>
                          {feedback.type}
                        </Badge>
                        <Badge variant={
                          feedback.priority === Priority.high ? BadgeVariant.DESTRUCTIVE :
                          feedback.priority === Priority.medium ? BadgeVariant.DEFAULT : BadgeVariant.SECONDARY
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
                        {feedback.type === FeedbackType.bug && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {feedback.type === FeedbackType.feature && <TrendingUp className="h-4 w-4 text-blue-500" />}
                        {feedback.type === FeedbackType.complaint && <XCircle className="h-4 w-4 text-red-500" />}
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
          </TabsContent>

          <TabsContent value="customization" className="mt-6">
            {/* User Customization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Settings className="h-5 w-5" />
                  {t('dashboard.customization.title')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.customization.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Spending Limits Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t('dashboard.customization.spendingLimits.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('dashboard.customization.spendingLimits.description')}
                    </p>
                    
                    {/* Search Bar */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={t('dashboard.customization.spendingLimits.searchPlaceholder')}
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Users Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">{t('dashboard.customization.spendingLimits.userColumn')}</th>
                            <th className="text-left p-3 font-medium">{t('dashboard.customization.spendingLimits.planColumn')}</th>
                            <th className="text-left p-3 font-medium">{t('dashboard.customization.spendingLimits.statusColumn')}</th>
                            <th className="text-left p-3 font-medium">{t('dashboard.customization.spendingLimits.defaultLimitColumn')}</th>
                            <th className="text-left p-3 font-medium">{t('dashboard.customization.spendingLimits.customLimitColumn')}</th>
                            <th className="text-left p-3 font-medium">{t('dashboard.customization.spendingLimits.actionsColumn')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingUsers ? (
                            <tr>
                              <td colSpan={6} className="text-center p-8">
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  {t('dashboard.customization.spendingLimits.loadingUsers')}
                                </div>
                              </td>
                            </tr>
                          ) : filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center p-8 text-muted-foreground">
                                {t('dashboard.customization.spendingLimits.noUsers')}
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((user) => (
                              <tr key={user.userId} className="border-t">
                                <td className="p-3">
                                  <div>
                                    <div className="font-medium">{user.email || user.userId}</div>
                                    {user.email && (
                                      <div className="text-xs text-muted-foreground">{user.userId}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Badge variant={BadgeVariant.OUTLINE} className="capitalize">
                                    {user.plan}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  <Badge variant={user.status === 'active' ? BadgeVariant.DEFAULT : BadgeVariant.SECONDARY}>
                                    {user.status}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  ${user.spending_limit_usd.toFixed(2)}
                                </td>
                                <td className="p-3">
                                  {editingUserId === user.userId ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        value={newSpendingLimit}
                                        onChange={(e) => setNewSpendingLimit(e.target.value)}
                                        placeholder={t('dashboard.customization.spendingLimits.newLimitPlaceholder')}
                                        className="w-32"
                                        step="0.01"
                                        min="0"
                                        disabled={updatingSpendingLimit}
                                      />
                                    </div>
                                  ) : (
                                    <div className="font-medium">
                                      {user.custom_spending_limit_usd !== null 
                                        ? `$${user.custom_spending_limit_usd.toFixed(2)}`
                                        : <span className="text-muted-foreground">{t('dashboard.customization.spendingLimits.notSet')}</span>
                                      }
                                    </div>
                                  )}
                                </td>
                                <td className="p-3">
                                  {editingUserId === user.userId ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateSpendingLimit(user.userId)}
                                        disabled={updatingSpendingLimit}
                                      >
                                        {updatingSpendingLimit ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          t('dashboard.customization.spendingLimits.confirmUpdate')
                                        )}
                                      </Button>
                                      {user.custom_spending_limit_usd !== null && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleUpdateSpendingLimit(user.userId, true)}
                                          disabled={updatingSpendingLimit}
                                        >
                                          {t('dashboard.customization.spendingLimits.removeLimit')}
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingUserId(null)
                                          setNewSpendingLimit('')
                                        }}
                                        disabled={updatingSpendingLimit}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingUserId(user.userId)
                                        setNewSpendingLimit(user.custom_spending_limit_usd?.toString() || user.spending_limit_usd.toString())
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 mr-1" />
                                      {user.custom_spending_limit_usd !== null 
                                        ? t('dashboard.customization.spendingLimits.updateLimit')
                                        : t('dashboard.customization.spendingLimits.setCustomLimit')
                                      }
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}