'use client'

import { useState, useMemo } from 'react'
import { Affiliation, AffiliationStatus } from '@prisma/client'
import { ChevronDown, ChevronRight, User, Users, Copy, X, Filter, FilterX } from 'lucide-react'
import { useTranslations } from '@/lib/translations/context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils/general'
import { AffiliationStatusLabels, AffiliationWithValid } from '@/lib/types/affiliation-types'
import { unlinkChildAffiliation } from '@/app/actions/affiliation-action'

interface AffiliationTreeProps {
  userAffiliation: Affiliation
  children: AffiliationWithValid[]
}

interface TreeNodeProps {
  affiliation: Affiliation | AffiliationWithValid
  children: AffiliationWithValid[]
  allChildren?: AffiliationWithValid[] // All children for count display in root
  level: number
  isRoot?: boolean
}

function TreeNode({ affiliation, children, allChildren, level, isRoot = false }: TreeNodeProps) {
  const t = useTranslations('affiliation')
  const [isExpanded, setIsExpanded] = useState(true)
  const [isRemoving, setIsRemoving] = useState(false)
  const hasChildren = children.length > 0

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: t('tree.copySuccessTitle'),
      description: t('tree.copySuccessMessage', { code }),
    })
  }

  const handleRemove = async () => {
    if (!window.confirm(t('tree.removeConfirmation'))) {
      return
    }

    setIsRemoving(true)
    try {
      const result = await unlinkChildAffiliation(affiliation.affiliationCode)
      
      if (result.success) {
        toast({
          title: t('tree.removeSuccessTitle'),
          description: result.message,
        })
      } else {
        toast({
          title: t('tree.errorTitle'),
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: t('tree.errorTitle'),
        description: t('tree.removeErrorMessage'),
        variant: 'destructive',
      })
    } finally {
      setIsRemoving(false)
    }
  }

  // Helper function to get icon color based on subscription validity
  const getIconColor = (affiliation: Affiliation | AffiliationWithValid) => {
    if ('valid' in affiliation) {
      return affiliation.valid ? 'text-green-500' : 'text-red-500'
    }
    return 'text-yellow-500' // Fallback for items without valid property
  }

  return (
    <div className={cn("select-none", level > 0 && "ml-6")}>
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors",
        isRoot && "bg-primary/10 border border-primary/20"
      )}>
        {/* Expand/Collapse button */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {!hasChildren && (
          <div className="w-6 h-6" /> // Spacer for alignment
        )}

        {/* User Icon */}
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          isRoot ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isRoot ? (
            <User className="h-5 w-5" />
          ) : (
            <Users className={cn("h-5 w-5", getIconColor(affiliation))} />
          )}
        </div>

        {/* Affiliation Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {isRoot ? t('tree.youLabel') : (affiliation.publicName || t('tree.userLabel', { id: affiliation.id.slice(-6) }))}
            </span>
            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {affiliation.affiliationCode}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(affiliation.affiliationCode)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            {!isRoot && level === 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={handleRemove}
                disabled={isRemoving}
                title={t('tree.removeFromNetworkTooltip')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isRoot ? "default" : "secondary"} className="text-xs">
              {AffiliationStatusLabels[affiliation.status]}
            </Badge>
            {(hasChildren || (isRoot && allChildren && allChildren.length > 0)) && (
              <span className="text-xs text-muted-foreground">
                {isRoot && allChildren ? (
                  <>
                    {t('tree.referralsCount', { 
                      count: allChildren.length,
                      activeCount: allChildren.filter(child => child.valid).length 
                    })}
                    {children.length !== allChildren.length && (
                      <span className="text-blue-600 font-medium"> • {t('tree.shownCount', { count: children.length })}</span>
                    )}
                  </>
                ) : (
                  <>
                    {t('tree.referralsCountSimple', { count: children.length })}
                  </>
                )}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {t('tree.joinedDate', { date: new Date(affiliation.createdAt).toLocaleDateString() })}
            </span>
          </div>
        </div>
      </div>

      {/* Render children */}
      {isExpanded && hasChildren && (
        <div className="mt-1 relative">
          {/* Connection line */}
          {level === 0 && (
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
          )}
          
          {children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Horizontal connection line */}
              {level === 0 && (
                <div className="absolute left-6 top-6 w-6 h-px bg-border" />
              )}
              
              <TreeNode
                affiliation={child}
                children={[]} // For now, we only show direct children
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AffiliationTree({ userAffiliation, children }: AffiliationTreeProps) {
  const t = useTranslations('affiliation')
  const [validityFilter, setValidityFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [statusFilter, setStatusFilter] = useState<AffiliationStatus | 'all'>('all')

  // Filter children based on current filters
  const filteredChildren = useMemo(() => {
    return children.filter(child => {
      // Apply validity filter
      if (validityFilter === 'active' && !child.valid) return false
      if (validityFilter === 'inactive' && child.valid) return false
      
      // Apply status filter
      if (statusFilter !== 'all' && child.status !== statusFilter) return false
      
      return true
    })
  }, [children, validityFilter, statusFilter])

  // Check if any filters are active
  const hasActiveFilters = validityFilter !== 'all' || statusFilter !== 'all'

  const clearFilters = () => {
    setValidityFilter('all')
    setStatusFilter('all')
  }

  // Get all unique statuses from children for the filter dropdown
  const availableStatuses = useMemo(() => {
    const statuses = Array.from(new Set(children.map(child => child.status)))
    return statuses.sort()
  }, [children])

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      {children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm">{t('tree.filtersTitle')}</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 px-2 text-xs"
                >
                  <FilterX className="h-3 w-3 mr-1" />
                  {t('tree.clearFilters')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Subscription Validity Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('tree.subscriptionStatusLabel')}</label>
                <Select value={validityFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setValidityFilter(value)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tree.allUsersOption')}</SelectItem>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {t('tree.activeSubscriptionsOption')}
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        {t('tree.inactiveSubscriptionsOption')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('tree.affiliationStatusLabel')}</label>
                <Select value={statusFilter} onValueChange={(value: AffiliationStatus | 'all') => setStatusFilter(value)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tree.allStatusOption')}</SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {AffiliationStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
              <span>
                {t('tree.showingCount', { 
                  showing: filteredChildren.length, 
                  total: children.length 
                })}
              </span>
              {hasActiveFilters && (
                <div className="flex gap-1">
                  {validityFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {t(`tree.${validityFilter}OnlyBadge`)}
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {AffiliationStatusLabels[statusFilter as AffiliationStatus]}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tree Display */}
      <div>
        <TreeNode
          affiliation={userAffiliation}
          children={filteredChildren}
          allChildren={children}
          level={0}
          isRoot={true}
        />
      </div>
    </div>
  )
}