'use client'

import {useEffect, useMemo, useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Check, ChevronsUpDown, Edit2, Gift, Loader2, RotateCcw, Search, Settings, X} from 'lucide-react'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {BadgeVariant} from '@/lib/enums'
import {SubscriptionPlan, SubscriptionStatus, BillingInterval} from '@prisma/client'
import {useToast} from '@/hooks/use-toast'
import {handleClientApiError} from '@/lib/api/api-toast'
import {useTranslations} from '@/lib/translations/context'
import {SubscriptionWithUsage, SUBSCRIPTION_PLAN_DETAIL} from "@/lib/types/subscription-types";
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '@/components/ui/command'
import {cn} from '@/lib/utils/general'

/**
 * Check if a subscription is active (admin-specific helper)
 * Used to determine if the Stripe checkbox should be checked
 * 
 * @param subscription - The subscription object to check
 * @returns boolean - true if subscription is active and not expired
 */
function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false
  
  const now = new Date()
  const isStatusActive = subscription.status === SubscriptionStatus.active
  const isNotExpired = subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now
  
  return Boolean(isStatusActive && isNotExpired)
}

// Component to display usage with color coding
function UsageDisplay({ currentUsage, limit }: { currentUsage: number; limit: number }) {
  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0
  
  // Determine color based on usage percentage
  let colorClass = 'text-green-600 dark:text-green-400' // < 80%
  if (percentage >= 90) {
    colorClass = 'text-red-600 dark:text-red-400'
  } else if (percentage >= 80) {
    colorClass = 'text-yellow-600 dark:text-yellow-400'
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className={colorClass}>
        ${currentUsage.toFixed(2)} / ${limit.toFixed(2)}
      </span>
      <span className="text-muted-foreground">
        ({percentage.toFixed(0)}%)
      </span>
    </div>
  )
}

export default function AdminCustomizationTab() {
  const t = useTranslations('admin')
  const { toast } = useToast()
  
  const [users, setUsers] = useState<Array<SubscriptionWithUsage>>([])
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false)
  const [userSearchQuery, setUserSearchQuery] = useState<string>('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [newSpendingLimit, setNewSpendingLimit] = useState<string>('')
  const [updatingSpendingLimit, setUpdatingSpendingLimit] = useState<boolean>(false)

  // Grant subscription state
  const [grantUserId, setGrantUserId] = useState<string>('')
  const [grantPlan, setGrantPlan] = useState<SubscriptionPlan>(SubscriptionPlan.knight)
  const [grantBillingInterval, setGrantBillingInterval] = useState<BillingInterval>(BillingInterval.monthly)
  const [grantingSubscription, setGrantingSubscription] = useState<boolean>(false)
  const [grantUserOpen, setGrantUserOpen] = useState<boolean>(false)

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
          const errorData = await response.json().catch(() => ({ error: t('dashboard.customization.subscriptionUsage.errors.fetchUsers') }))
          throw new Error(errorData.error)
        }

        const result = await response.json()
        setUsers(result.users || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        const errorMessage = error instanceof Error ? error.message : t('dashboard.customization.subscriptionUsage.errors.fetchUsers')
        handleClientApiError(errorMessage, t('dashboard.customization.subscriptionUsage.errors.fetchUsers'))
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [t])

  const handleUpdateSpendingLimit = async (userId: string, removeLimit: boolean = false) => {
    setUpdatingSpendingLimit(true)
    try {
      const customSpendingLimit = removeLimit ? null : parseFloat(newSpendingLimit)
      
      if (!removeLimit && (isNaN(customSpendingLimit!) || customSpendingLimit! < 0)) {
        toast({
          title: 'Error',
          description: t('dashboard.customization.subscriptionUsage.errors.invalidAmount'),
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
        const errorData = await response.json().catch(() => ({ error: t('dashboard.customization.subscriptionUsage.errors.updateLimit') }))
        throw new Error(errorData.error)
      }

      const result = await response.json()
      
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
          ? t('dashboard.customization.subscriptionUsage.success.limitRemoved')
          : t('dashboard.customization.subscriptionUsage.success.limitUpdated')
      })

      setEditingUserId(null)
      setNewSpendingLimit('')

    } catch (error) {
      console.error('Error updating spending limit:', error)
      const errorMessage = error instanceof Error ? error.message : t('dashboard.customization.subscriptionUsage.errors.updateLimit')
      handleClientApiError(errorMessage, t('dashboard.customization.subscriptionUsage.errors.updateLimit'))
    } finally {
      setUpdatingSpendingLimit(false)
    }
  }

  const handleGrantSubscription = async () => {
    if (!grantUserId) {
      toast({
        title: 'Error',
        description: t('dashboard.customization.grantSubscription.errors.selectUser'),
        variant: 'destructive'
      })
      return
    }

    setGrantingSubscription(true)
    try {
      const response = await fetch('/api/admin/users/grant-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: grantUserId,
          plan: grantPlan,
          billingInterval: grantBillingInterval
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: t('dashboard.customization.grantSubscription.errors.grantFailed')
        }))
        throw new Error(errorData.error)
      }

      // Update local users list to reflect the change
      setUsers(prev =>
        prev.map(user =>
          user.userId === grantUserId
            ? {
                ...user,
                plan: grantPlan,
                billingInterval: grantBillingInterval,
                status: SubscriptionStatus.active,
                currentUsage: 0,
                spending_limit_usd: SUBSCRIPTION_PLAN_DETAIL[grantPlan].spending_limit_usd
              }
            : user
        )
      )

      toast({
        title: t('dashboard.customization.grantSubscription.success.title'),
        description: t('dashboard.customization.grantSubscription.success.description')
      })

      // Reset form
      setGrantUserId('')
      setGrantPlan(SubscriptionPlan.knight)
      setGrantBillingInterval(BillingInterval.monthly)

    } catch (error) {
      console.error('Error granting subscription:', error)
      const errorMessage = error instanceof Error
        ? error.message
        : t('dashboard.customization.grantSubscription.errors.grantFailed')
      handleClientApiError(errorMessage, t('dashboard.customization.grantSubscription.errors.grantFailed'))
    } finally {
      setGrantingSubscription(false)
    }
  }

  const filteredUsers = useMemo(() => {
    let result = users
    
    // Apply search filter if query exists
    if (userSearchQuery) {
      const query = userSearchQuery.toLowerCase()
      result = result.filter(user => 
        user.email?.toLowerCase().includes(query) || 
        user.userId.toLowerCase().includes(query)
      )
    }
    
    // Apply plan filter if not "all"
    if (planFilter !== 'all') {
      result = result.filter(user => user.plan === planFilter)
    }
    
    // Sort by status alphabetically, then by custom spending limit presence
    return result.sort((a, b) => {
      // First sort by status alphabetically (active will come before other statuses)
      const statusCompare = a.status.localeCompare(b.status)
      if (statusCompare !== 0) {
        return statusCompare
      }
      
      // Within same status, sort by custom spending limit presence (defined first)
      const aHasCustom = a.custom_spending_limit_usd !== null
      const bHasCustom = b.custom_spending_limit_usd !== null
      
      if (aHasCustom && !bHasCustom) return -1
      if (!aHasCustom && bHasCustom) return 1
      
      // If both have same custom limit status, maintain original order
      return 0
    })
  }, [users, userSearchQuery, planFilter])

  const clearFilters = () => {
    setUserSearchQuery('')
    setPlanFilter('all')
  }

  const hasActiveFilters = userSearchQuery.length > 0 || planFilter !== 'all'

  return (
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
        <div className="space-y-6">
          {/* Grant Subscription Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">
              {t('dashboard.customization.grantSubscription.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('dashboard.customization.grantSubscription.description')}
            </p>

            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* User Selection (Combobox) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('dashboard.customization.grantSubscription.userLabel')}
                  </label>
                  <Popover open={grantUserOpen} onOpenChange={setGrantUserOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={grantUserOpen}
                        className="w-full justify-between"
                        disabled={loadingUsers || grantingSubscription}
                      >
                        {grantUserId
                          ? users.find(u => u.userId === grantUserId)?.email || grantUserId
                          : t('dashboard.customization.grantSubscription.selectUser')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder={t('dashboard.customization.grantSubscription.searchUser')} />
                        <CommandList>
                          <CommandEmpty>{t('dashboard.customization.grantSubscription.noUserFound')}</CommandEmpty>
                          <CommandGroup>
                            {users.map((user) => (
                              <CommandItem
                                key={user.userId}
                                value={`${user.email || ''} ${user.userId}`}
                                onSelect={() => {
                                  setGrantUserId(user.userId)
                                  setGrantUserOpen(false)
                                }}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="flex-1 min-w-0">
                                    <span className="truncate">{user.email || user.userId}</span>
                                    <Badge variant={BadgeVariant.OUTLINE} className="ml-2 capitalize text-xs">
                                      {user.plan}
                                    </Badge>
                                  </div>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    grantUserId === user.userId ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Plan Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('dashboard.customization.grantSubscription.planLabel')}
                  </label>
                  <Select
                    value={grantPlan}
                    onValueChange={(value) => setGrantPlan(value as SubscriptionPlan)}
                    disabled={grantingSubscription}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SubscriptionPlan.knight}>Knight</SelectItem>
                      <SelectItem value={SubscriptionPlan.master}>Master</SelectItem>
                      <SelectItem value={SubscriptionPlan.jedi}>Jedi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing Interval Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('dashboard.customization.grantSubscription.intervalLabel')}
                  </label>
                  <Select
                    value={grantBillingInterval}
                    onValueChange={(value) => setGrantBillingInterval(value as BillingInterval)}
                    disabled={grantingSubscription}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BillingInterval.monthly}>Monthly</SelectItem>
                      <SelectItem value={BillingInterval.annual}>Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Grant Button */}
                <div className="space-y-2">
                  <label className="text-sm font-medium invisible">Action</label>
                  <Button
                    onClick={handleGrantSubscription}
                    disabled={!grantUserId || grantingSubscription}
                    className="w-full"
                  >
                    {grantingSubscription ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t('dashboard.customization.grantSubscription.granting')}
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        {t('dashboard.customization.grantSubscription.grantButton')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">{t('dashboard.customization.subscriptionUsage.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('dashboard.customization.subscriptionUsage.description')}
            </p>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('dashboard.customization.subscriptionUsage.searchPlaceholder')}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value={SubscriptionPlan.apprentice}>Apprentice</SelectItem>
                  <SelectItem value={SubscriptionPlan.knight}>Knight</SelectItem>
                  <SelectItem value={SubscriptionPlan.master}>Master</SelectItem>
                  <SelectItem value={SubscriptionPlan.jedi}>Jedi</SelectItem>
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

            {/* Users Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">{t('dashboard.customization.subscriptionUsage.userColumn')}</th>
                    <th className="text-left p-3 font-medium">{t('dashboard.customization.subscriptionUsage.planColumn')}</th>
                    <th className="text-left p-3 font-medium">{t('dashboard.customization.subscriptionUsage.statusColumn')}</th>
                    <th className="text-left p-3 font-medium">{t('dashboard.customization.subscriptionUsage.stripeColumn')}</th>
                    <th className="text-left p-3 font-medium">{t('dashboard.customization.subscriptionUsage.usageColumn')}</th>
                    <th className="text-left p-3 font-medium">{t('dashboard.customization.subscriptionUsage.defaultLimitColumn')}</th>
                    <th className="text-left p-3 font-medium">{t('dashboard.customization.subscriptionUsage.customLimitColumn')}</th>
                    <th className="text-left p-3 font-medium">{t('dashboard.customization.subscriptionUsage.actionsColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('dashboard.customization.subscriptionUsage.loadingUsers')}
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-muted-foreground">
                        {t('dashboard.customization.subscriptionUsage.noUsers')}
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
                          <div className="flex items-center justify-center">
                            {user.stripeSubscriptionId && isSubscriptionActive(user) ? (
                              <div className="h-5 w-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            ) : (
                              <div className="h-5 w-5 rounded border-2 border-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {user.currentUsage !== undefined ? (
                            <UsageDisplay 
                              currentUsage={user.currentUsage} 
                              limit={user.custom_spending_limit_usd ?? user.spending_limit_usd}
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                                placeholder={t('dashboard.customization.subscriptionUsage.newLimitPlaceholder')}
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
                                : <span className="text-muted-foreground">{t('dashboard.customization.subscriptionUsage.notSet')}</span>
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
                                  t('dashboard.customization.subscriptionUsage.confirmUpdate')
                                )}
                              </Button>
                              {user.custom_spending_limit_usd !== null && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateSpendingLimit(user.userId, true)}
                                  disabled={updatingSpendingLimit}
                                >
                                  {t('dashboard.customization.subscriptionUsage.removeLimit')}
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
                                ? t('dashboard.customization.subscriptionUsage.updateLimit')
                                : t('dashboard.customization.subscriptionUsage.setCustomLimit')
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
  )
}