import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {CheckIcon, CrownIcon, Shield, StarIcon, ZapIcon} from 'lucide-react'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {getButtonStyles, getButtonText, getPlanIconType, getPlanNameColor} from '@/lib/utils/subscription-client-utils'
import {BillingInterval, SubscriptionPlan} from "@prisma/client"
import {useTranslations} from '@/lib/translations/context'
import {getAnnualSavings} from '@/lib/types/subscription-types'

interface PlanCardProps {
  planId: string
  plan: {
    id: string
    name: string
    description: string
    price: number
    priceAnnual?: number
    features_list: readonly string[]
  }
  currentPlan: SubscriptionPlan
  currentBillingInterval?: BillingInterval | null
  isCurrentPlan: boolean
  isFreeMode: boolean
  isPendingDowngrade: boolean
  isPendingPlanChange: boolean
  upgradeLoading: string | null
  cancelDowngradeLoading: boolean
  isActiveCancelled: boolean
  isExpired: boolean
  isPastDueOrUnpaid: boolean
  onPlanAction: (planId: string) => void
  billingInterval?: BillingInterval
  showButton?: boolean
  className?: string
}

export function PlanCard({
  planId,
  plan,
  currentPlan,
  currentBillingInterval,
  isCurrentPlan,
  isFreeMode,
  isPendingDowngrade,
  isPendingPlanChange,
  upgradeLoading,
  cancelDowngradeLoading,
  isActiveCancelled,
  isExpired,
  isPastDueOrUnpaid,
  onPlanAction,
  billingInterval = BillingInterval.monthly,
  showButton = true,
  className
}: PlanCardProps) {
  const t = useTranslations()
  const tSubscription = useTranslations('subscription')
  
  // Check if billing interval is changing
  const isBillingIntervalChanging = currentBillingInterval && 
    currentBillingInterval !== billingInterval && 
    !isFreeMode
  
  const getPlanIcon = (planId: string) => {
    const iconType = getPlanIconType(planId)
    switch (iconType) {
      case 'ZapIcon': return <ZapIcon className="h-6 w-6" />
      case 'ShieldIcon': return <Shield className="h-6 w-6" />
      case 'StarIcon': return <StarIcon className="h-6 w-6" />
      case 'CrownIcon': return <CrownIcon className="h-6 w-6" />
      default: return <ZapIcon className="h-6 w-6" />
    }
  }

  return (
    <Card
      className={`relative h-full flex flex-col ${
        isCurrentPlan
          ? 'border-2 border-green-500 shadow-lg bg-green-50 dark:bg-green-900/20'
          : ''
      } ${className || ''}`}
    >
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getPlanIcon(planId)}
        </div>
        <CardTitle className={`text-2xl font-bold ${getPlanNameColor(planId)}`}>{plan.name}</CardTitle>
        <CardDescription className="text-sm min-h-[3rem] flex items-center justify-center">{t(plan.description)}</CardDescription>
        <div className="mt-4 pt-4 pb-2 flex flex-col items-center justify-center min-h-[4rem]">
          <div className="flex items-end">
            {plan.price === 0 ? (
              <span className="text-4xl font-bold leading-none text-green-600 dark:text-green-400">
                {tSubscription('planCard.free')}
              </span>
            ) : (
              <>
                <span className="text-4xl font-bold leading-none">
                  {billingInterval === BillingInterval.annual && plan.priceAnnual
                    ? plan.priceAnnual
                    : plan.price}€
                </span>
                <span className="text-gray-500 mb-1">
                  {billingInterval === BillingInterval.annual
                    ? tSubscription('planCard.perYear')
                    : tSubscription('planCard.perMonth')}
                </span>
              </>
            )}
          </div>
          {billingInterval === BillingInterval.annual && plan.price > 0 && (
            <div className="mt-1 text-sm text-green-600 dark:text-green-400">
              {tSubscription('planCard.savings')} {getAnnualSavings(planId as SubscriptionPlan)}€
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow">
        <ul className="space-y-3 mb-6 flex-grow">
          {plan.features_list.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-sm">{t(feature)}</span>
            </li>
          ))}
        </ul>
        
        {showButton && (
          <>
            {isBillingIntervalChanging && (
              <div className="mb-3 p-2 text-xs text-muted-foreground bg-muted rounded-md text-center">
                {tSubscription('planCard.intervalChangeRestricted')}
              </div>
            )}

            <Button
              onClick={() => onPlanAction(plan.id)}
              disabled={isBillingIntervalChanging || upgradeLoading === plan.id || cancelDowngradeLoading || isCurrentPlan || (isPendingDowngrade && !isPendingPlanChange) || (isActiveCancelled && !isExpired) || isPastDueOrUnpaid}
              className={`w-full mt-auto ${getButtonStyles(
                isCurrentPlan,
                isPendingDowngrade,
                isPendingPlanChange
              )}`}
              title={isBillingIntervalChanging ? tSubscription('planCard.intervalChangeTooltip') : undefined}
            >
              {upgradeLoading === plan.id ? (
                <LoadingSpinner text={tSubscription('planCard.processing')} />
              ) : cancelDowngradeLoading && isPendingDowngrade && isPendingPlanChange ? (
                <LoadingSpinner text={tSubscription('planCard.canceling')} />
              ) : isBillingIntervalChanging ? (
                tSubscription('planCard.unavailable')
              ) : (
                getButtonText(planId, currentPlan, isFreeMode, isPendingDowngrade, isPendingPlanChange, isCurrentPlan, isExpired, tSubscription)
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}