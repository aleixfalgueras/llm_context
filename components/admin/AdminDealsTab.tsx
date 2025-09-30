'use client'

import { useState } from 'react'
import { Deal } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Check, X } from 'lucide-react'
import { useTranslations } from '@/lib/translations/context'
import { useToast } from '@/hooks/use-toast'
import { handleClientApiError } from '@/lib/api/api-toast'
import { format } from 'date-fns'

interface AdminDealsTabProps {
  initialPendingDeals: Deal[]
}

export default function AdminDealsTab({ initialPendingDeals }: AdminDealsTabProps) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [pendingDeals, setPendingDeals] = useState<Deal[]>(initialPendingDeals)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const handleApprove = async (dealId: string) => {
    setProcessingIds(prev => new Set(prev).add(dealId))

    try {
      const response = await fetch(`/api/admin/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('dashboard.deals.errors.approve') }))
        throw new Error(errorData.error)
      }

      // Remove from pending list
      setPendingDeals(prev => prev.filter(deal => deal.id !== dealId))

      toast({
        title: t('dashboard.deals.success.approved'),
        variant: 'default'
      })
    } catch (error) {
      console.error('Error approving deal:', error)
      const errorMessage = error instanceof Error ? error.message : t('dashboard.deals.errors.approve')
      handleClientApiError(errorMessage, t('dashboard.deals.errors.approve'))
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(dealId)
        return newSet
      })
    }
  }

  const handleReject = async (dealId: string) => {
    setProcessingIds(prev => new Set(prev).add(dealId))

    try {
      const response = await fetch(`/api/admin/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('dashboard.deals.errors.reject') }))
        throw new Error(errorData.error)
      }

      // Remove from pending list
      setPendingDeals(prev => prev.filter(deal => deal.id !== dealId))

      toast({
        title: t('dashboard.deals.success.rejected'),
        variant: 'default'
      })
    } catch (error) {
      console.error('Error rejecting deal:', error)
      const errorMessage = error instanceof Error ? error.message : t('dashboard.deals.errors.reject')
      handleClientApiError(errorMessage, t('dashboard.deals.errors.reject'))
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(dealId)
        return newSet
      })
    }
  }

  const handleExternalClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('dashboard.deals.title')}</h2>
          <p className="text-muted-foreground">{t('dashboard.deals.description')}</p>
        </div>
        {pendingDeals.length > 0 && (
          <Badge variant="secondary">
            {pendingDeals.length} {t('dashboard.deals.showingCount')}
          </Badge>
        )}
      </div>

      {pendingDeals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{t('dashboard.deals.noDeals')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingDeals.map((deal) => {
            const isProcessing = processingIds.has(deal.id)

            return (
              <Card key={deal.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{deal.title}</CardTitle>
                  <CardDescription className="text-sm line-clamp-3">
                    {deal.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary" className="text-xs">
                      {deal.price}
                    </Badge>
                    {deal.isActive && (
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  {(deal.validFrom || deal.validUntil) && (
                    <div className="text-xs text-muted-foreground pt-2">
                      {deal.validFrom && (
                        <div>Valid from: {format(new Date(deal.validFrom), 'PP')}</div>
                      )}
                      {deal.validUntil && (
                        <div>Valid until: {format(new Date(deal.validUntil), 'PP')}</div>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0 mt-auto">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExternalClick(deal.externalUrl)}
                      className="w-full justify-start"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View External Link
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(deal.id)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          t('dashboard.deals.approving')
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {t('dashboard.deals.actions.approve')}
                          </>
                        )}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(deal.id)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          t('dashboard.deals.rejecting')
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            {t('dashboard.deals.actions.reject')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}