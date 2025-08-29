'use client'

import {useMemo, useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {AlertTriangle, Filter, Loader2, RotateCcw, TrendingUp, XCircle} from 'lucide-react'
import {BadgeVariant} from '@/lib/enums'
import {FeedbackItem} from '@/lib/types/admin-types'
import {handleClientApiError} from '@/lib/api/api-toast'
import {useTranslations} from '@/lib/translations/context'
import {FeedbackState, FeedbackType, Priority} from "@/lib/types/feedback-types"

interface AdminFeedbackTabProps {
  initialFeedback: FeedbackItem[]
}

export default function AdminFeedbackTab({ initialFeedback }: AdminFeedbackTabProps) {
  const t = useTranslations('admin')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('active') // Default to PENDING + IN_PROGRESS
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>(initialFeedback)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const clearFilters = () => {
    setTypeFilter('all')
    setPriorityFilter('all')
    setStateFilter('active')
  }

  const hasActiveFilters = typeFilter !== 'all' || priorityFilter !== 'all' || stateFilter !== 'active'

  const updateFeedbackStatus = async (feedbackId: string, newState: string) => {
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

      setFeedbackData(prev => 
        prev.map(item => 
          item.id === feedbackId 
            ? { ...item, state: newState }
            : item
        )
      )

      console.log('Status updated successfully:', result.message)

    } catch (error) {
      console.error('Error updating feedback status:', error)
      const errorMessage = error instanceof Error ? error.message : t('errors.admin.updateFeedback')
      handleClientApiError(errorMessage, t('errors.admin.updateFeedback'))
    } finally {
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

  return (
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
  )
}