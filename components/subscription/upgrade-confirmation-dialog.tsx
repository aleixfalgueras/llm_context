'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckIcon, ArrowRightIcon, CreditCardIcon, CalendarIcon } from 'lucide-react'
import { SubscriptionPlan } from '@/types/subscription-types'
import { SUBSCRIPTION_PLANS } from '@/lib/payments/subscription-utils'
import { useToast } from '@/hooks/use-toast'
import { ToastVariant } from '@/types/enums'

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
}

export function UpgradeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  targetPlan,
  isLoading = false,
  hasActiveSubscription = false,
  isDowngrade = false
}: UpgradeConfirmationDialogProps) {
  const [preview, setPreview] = useState<UpgradePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const { toast } = useToast()

  // Load pricing preview when dialog opens (only for existing subscriptions)
  React.useEffect(() => {
    if (isOpen && hasActiveSubscription && !preview) {
      loadUpgradePreview()
    }
  }, [isOpen, targetPlan, hasActiveSubscription])

  const loadUpgradePreview = async () => {
    setPreviewLoading(true)
    try {
      const response = await fetch('/api/subscription/preview-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: targetPlan })
      })

      if (!response.ok) {
        throw new Error('Failed to load upgrade preview')
      }

      const { data } = await response.json()
      setPreview(data)
    } catch (error) {
      console.error('Error loading upgrade preview:', error)
      toast({
        title: 'Error',
        description: 'Failed to load upgrade preview. Please try again.',
        variant: ToastVariant.DESTRUCTIVE
      })
      onClose()
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleClose = () => {
    setPreview(null) // Reset preview when closing
    onClose()
  }

  const currentPlanConfig = preview ? SUBSCRIPTION_PLANS[preview.currentPlan] : null
  const targetPlanConfig = SUBSCRIPTION_PLANS[targetPlan]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (amount: number, currency: string = 'eur') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            {isDowngrade ? 'Schedule Subscription Downgrade' : 'Confirm Subscription Upgrade'}
          </DialogTitle>
          <DialogDescription>
            {isDowngrade 
              ? 'Review the details of your subscription downgrade. Changes will take effect at the end of your current billing period.'
              : 'Review the details of your subscription upgrade before proceeding.'
            }
          </DialogDescription>
        </DialogHeader>

        {previewLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading upgrade preview...</span>
            </div>
          </div>
        ) : hasActiveSubscription && preview && currentPlanConfig ? (
          <div className="space-y-6">
            {/* Plan Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Current Plan</div>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="font-semibold">{currentPlanConfig.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {preview.currentPrice}€/month
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">New Plan</div>
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="font-semibold flex items-center gap-2">
                    {targetPlanConfig.name}
                    <Badge variant="secondary">Upgrade</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {preview.newPrice}€/month
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="space-y-3">
              <div className="text-sm font-medium">What you'll get with {targetPlanConfig.name}:</div>
              <div className="grid grid-cols-1 gap-2">
                {targetPlanConfig.features_list.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Simplified Billing Summary */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Billing Summary</div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">
                    {isDowngrade ? `Downgrade to ${targetPlanConfig.name}:` : `Upgrade to ${targetPlanConfig.name}:`}
                  </span>
                  <span className="font-semibold text-lg">
                    {preview.newPrice}€
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {isDowngrade 
                    ? 'You\'ll be charged the new plan price starting from your next billing cycle. You\'ll keep your current plan benefits until then.'
                    : 'You\'ll be charged the full monthly price for the new plan.'
                  }
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  <span>
                    {isDowngrade 
                      ? `Changes take effect: ${formatDate(preview.nextBillingDate)}`
                      : `Next billing: ${formatDate(preview.nextBillingDate)}`
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
                <div className="font-semibold text-lg mb-2">{targetPlanConfig.name} Plan</div>
                <div className="text-3xl font-bold mb-2">
                  {targetPlanConfig.price}€
                  <span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                <Badge variant="secondary" className="mb-4">First Subscription</Badge>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-3">
              <div className="text-sm font-medium">What you'll get with {targetPlanConfig.name}:</div>
              <div className="grid grid-cols-1 gap-2">
                {targetPlanConfig.features_list.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Simple Billing Info */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Billing Information</div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">
                    {isDowngrade ? 'New monthly charge:' : 'Monthly charge:'}
                  </span>
                  <span className="font-semibold">{targetPlanConfig.price}€</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isDowngrade 
                    ? 'Your plan will change at the end of your current billing period. No immediate payment required.'
                    : 'You\'ll be redirected to Stripe for secure payment processing.'
                  }
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={previewLoading || isLoading || (hasActiveSubscription && !preview)}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <ArrowRightIcon className="h-4 w-4" />
                {isDowngrade ? 'Schedule Downgrade' : (hasActiveSubscription ? 'Confirm Upgrade' : 'Start Subscription')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}