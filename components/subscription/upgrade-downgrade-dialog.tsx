'use client'

import React, {useState} from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {ArrowRightIcon, CalendarIcon, CheckIcon, CreditCardIcon} from 'lucide-react'
import {SUBSCRIPTION_PLAN_DETAIL} from '@/lib/types/subscription-types'
import {useToast} from '@/hooks/use-toast'
import {BillingInterval, SubscriptionPlan} from "@prisma/client";
import {handleClientApiError} from '@/lib/api/api-toast'
import {useTranslations} from '@/lib/translations/context'

interface UpgradePreview {
  currentPlan: SubscriptionPlan
  targetPlan: SubscriptionPlan
  currentPrice: number
  newPrice: number
  nextBillingDate: string
  currency: string
}

interface UpgradeConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  targetPlan: SubscriptionPlan
  isLoading?: boolean
  hasActiveSubscription?: boolean // Whether user has a paid Stripe subscription
  isDowngrade?: boolean // Whether this is a downgrade (scheduled for end of period)
  billingInterval?: BillingInterval // The billing interval for the upgrade/downgrade
}

export function UpgradeDowngradeDialog({
  isOpen,
  onClose,
  onConfirm,
  targetPlan,
  isLoading = false,
  hasActiveSubscription = false,
  isDowngrade = false,
  billingInterval = BillingInterval.monthly
}: UpgradeConfirmationDialogProps) {
  const [preview, setPreview] = useState<UpgradePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const { toast } = useToast()
  const t = useTranslations('subscription')

  // Load pricing preview when dialog opens (only for existing subscriptions)
  React.useEffect(() => {
    if (isOpen && hasActiveSubscription && !preview) {
      loadUpgradePreview()
    }
  }, [isOpen, targetPlan, hasActiveSubscription, billingInterval])

  const loadUpgradePreview = async () => {
    setPreviewLoading(true)
    try {
      const response = await fetch('/api/subscription/preview-upgrade-downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: targetPlan, billingInterval })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('upgradeDialog.errors.loadPreviewFailed') }))
        throw new Error(errorData.error)
      }

      const { data } = await response.json()
      setPreview(data)
    } catch (error) {
      console.error('Error loading upgrade preview:', error)
      const errorMessage = error instanceof Error ? error.message : t('upgradeDialog.errors.loadPreviewFailed')
      handleClientApiError(errorMessage, t('upgradeDialog.errors.loadPreviewFailed'))
      onClose()
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleClose = () => {
    setPreview(null) // Reset preview when closing
    onClose()
  }

  const currentPlanConfig = preview ? SUBSCRIPTION_PLAN_DETAIL[preview.currentPlan] : null
  const targetPlanConfig = SUBSCRIPTION_PLAN_DETAIL[targetPlan]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            {isDowngrade ? t('upgradeDialog.title.scheduleDowngrade') : t('upgradeDialog.title.confirmUpgrade')}
          </DialogTitle>
          <DialogDescription>
            {isDowngrade 
              ? t('upgradeDialog.description.downgrade')
              : t('upgradeDialog.description.upgrade')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-2">
        {previewLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{t('upgradeDialog.loading.preview')}</span>
            </div>
          </div>
        ) : hasActiveSubscription && preview && currentPlanConfig ? (
          <div className="space-y-6">
            {/* Plan Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">{t('upgradeDialog.planComparison.currentPlan')}</div>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="font-semibold">{currentPlanConfig.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('upgradeDialog.planComparison.pricePerMonth', { price: preview.currentPrice })}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">{t('upgradeDialog.planComparison.newPlan')}</div>
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="font-semibold flex items-center gap-2">
                    {targetPlanConfig.name}
                    <Badge variant="secondary">{isDowngrade ? t('upgradeDialog.badges.downgrade') : t('upgradeDialog.badges.upgrade')}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('upgradeDialog.planComparison.pricePerMonth', { price: preview.newPrice })}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="space-y-3">
              <div className="text-sm font-medium">{t('upgradeDialog.features.whatYouGetWith', { planName: targetPlanConfig.name })}</div>
              <div className="grid grid-cols-1 gap-2">
                {targetPlanConfig.features_list.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-600" />
                    <span>{t(feature)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Simplified Billing Summary */}
            <div className="space-y-3">
              <div className="text-sm font-medium">{t('upgradeDialog.billing.title')}</div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">
                    {isDowngrade 
                      ? t('upgradeDialog.billing.downgradeTo', { planName: targetPlanConfig.name })
                      : t('upgradeDialog.billing.upgradeTo', { planName: targetPlanConfig.name })
                    }
                  </span>
                  <span className="font-semibold text-lg">
                    {preview.newPrice}€
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {isDowngrade 
                    ? t('upgradeDialog.billing.downgradeNote')
                    : t('upgradeDialog.billing.upgradeNote')
                  }
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  <span>
                    {isDowngrade 
                      ? t('upgradeDialog.billing.changesEffective', { date: formatDate(preview.nextBillingDate) })
                      : t('upgradeDialog.billing.nextBilling', { date: formatDate(preview.nextBillingDate) })
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : !hasActiveSubscription ? (
          <div className="space-y-6">
            {/* First Subscription - Simple Confirmation */}
            <div className="text-center">
              <div className="p-6 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="font-semibold text-lg mb-2">{t('upgradeDialog.firstSubscription.planTitle', { planName: targetPlanConfig.name })}</div>
                <div className="text-3xl font-bold mb-2">
                  {targetPlanConfig.price}€
                  <span className="text-lg font-normal text-muted-foreground">{t('upgradeDialog.firstSubscription.perMonth')}</span>
                </div>
                <Badge variant="secondary" className="mb-4">{t('upgradeDialog.badges.firstSubscription')}</Badge>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-3">
              <div className="text-sm font-medium">{t('upgradeDialog.features.whatYouGetWith', { planName: targetPlanConfig.name })}</div>
              <div className="grid grid-cols-1 gap-2">
                {targetPlanConfig.features_list.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-600" />
                    <span>{t(feature)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Simple Billing Info */}
            <div className="space-y-3">
              <div className="text-sm font-medium">{t('upgradeDialog.billing.information')}</div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">
                    {isDowngrade ? t('upgradeDialog.billing.newMonthlyCharge') : t('upgradeDialog.billing.monthlyCharge')}
                  </span>
                  <span className="font-semibold">{targetPlanConfig.price}€</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isDowngrade 
                    ? t('upgradeDialog.billing.planChangeNote')
                    : t('upgradeDialog.billing.stripeRedirectNote')
                  }
                </div>
              </div>
            </div>
          </div>
        ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t('upgradeDialog.buttons.cancel')}
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={previewLoading || isLoading || (hasActiveSubscription && !preview)}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('upgradeDialog.loading.processing')}
              </>
            ) : (
              <>
                <ArrowRightIcon className="h-4 w-4" />
                {isDowngrade 
                  ? t('upgradeDialog.buttons.scheduleDowngrade')
                  : (hasActiveSubscription 
                      ? t('upgradeDialog.buttons.confirmUpgrade') 
                      : t('upgradeDialog.buttons.startSubscription')
                    )
                }
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}