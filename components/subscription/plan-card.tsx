import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {CheckIcon, CrownIcon, Shield, StarIcon, ZapIcon} from 'lucide-react'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {
  getButtonStyles,
  getButtonText,
  getPlanIconType,
  getPlanNameColor
} from '@/lib/subscription/subscription-plan-utils'
import {SubscriptionPlan} from "@prisma/client";

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
      }`}
    >
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getPlanIcon(planId)}
        </div>
        <CardTitle className={`text-2xl font-bold ${getPlanNameColor(planId)}`}>{plan.name}</CardTitle>
        <CardDescription className="text-sm min-h-[3rem] flex items-center justify-center">{plan.description}</CardDescription>
        <div className="mt-4 pt-4 pb-2 flex items-end justify-center min-h-[4rem]">
          <span className="text-4xl font-bold leading-none">{plan.price}€</span>
          {plan.price > 0 && <span className="text-gray-500 mb-1">/month</span>}
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow">
        <ul className="space-y-3 mb-6 flex-grow">
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
          className={`w-full mt-auto ${getButtonStyles(
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