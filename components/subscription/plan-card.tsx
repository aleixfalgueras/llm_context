import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {CheckIcon, ZapIcon, StarIcon, CrownIcon} from 'lucide-react'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {getPlanNameColor, getPlanIconType, getButtonStyles, getButtonText, shouldShowPlanBadge} from '@/lib/subscription/subscription-plan-utils'
import {SubscriptionPlan} from '@/types/subscription-types'

interface PlanCardProps {
  planId: string
  plan: {
    id: string
    name: string
    description: string
    price: number
    features_list: readonly string[]
  }
  currentPlan: SubscriptionPlan
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
}

export function PlanCard({
  planId,
  plan,
  currentPlan,
  isCurrentPlan,
  isFreeMode,
  isPendingDowngrade,
  isPendingPlanChange,
  upgradeLoading,
  cancelDowngradeLoading,
  isActiveCancelled,
  isExpired,
  isPastDueOrUnpaid,
  onPlanAction
}: PlanCardProps) {
  const getPlanIcon = (planId: string) => {
    const iconType = getPlanIconType(planId)
    switch (iconType) {
      case 'ZapIcon': return <ZapIcon className="h-6 w-6" />
      case 'StarIcon': return <StarIcon className="h-6 w-6" />
      case 'CrownIcon': return <CrownIcon className="h-6 w-6" />
      default: return <ZapIcon className="h-6 w-6" />
    }
  }

  return (
    <Card 
      className={`relative ${
        isCurrentPlan 
          ? 'border-green-500 shadow-lg scale-105 bg-green-50 dark:bg-green-900/20' 
          : ''
      }`}
    >
      <CardHeader className="text-center">
        {shouldShowPlanBadge(isFreeMode, isCurrentPlan) && (
          <Badge className="bg-green-500">Current Plan</Badge>
        )}
        <div className="flex justify-center mb-4">
          {getPlanIcon(planId)}
        </div>
        <CardTitle className={`text-2xl font-bold ${getPlanNameColor(planId)}`}>{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{plan.price}€</span>
          {plan.price > 0 && <span className="text-gray-500">/month</span>}
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-6">
          {plan.features_list.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          onClick={() => onPlanAction(plan.id)}
          disabled={upgradeLoading === plan.id || cancelDowngradeLoading || isCurrentPlan || (isPendingDowngrade && !isPendingPlanChange) || (isActiveCancelled && !isExpired) || isPastDueOrUnpaid}
          className={`w-full ${getButtonStyles(
            isCurrentPlan,
            isPendingDowngrade,
            isPendingPlanChange
          )}`}
        >
          {upgradeLoading === plan.id ? (
            <LoadingSpinner text="Processing..." />
          ) : cancelDowngradeLoading && isPendingDowngrade && isPendingPlanChange ? (
            <LoadingSpinner text="Canceling..." />
          ) : (
            getButtonText(planId, currentPlan, isFreeMode, isPendingDowngrade, isPendingPlanChange, isCurrentPlan, isExpired)
          )}
        </Button>
      </CardContent>
    </Card>
  )
}