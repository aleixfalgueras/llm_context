'use client'

import { useState } from 'react'
import { useTranslations } from '@/lib/translations/context'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingBackground } from '@/components/landing/landing-background'
import { PlanCard } from '@/components/subscription/plan-card'
import { SUBSCRIPTION_PLAN_DETAIL } from '@/lib/types/subscription-types'
import { BillingInterval, SubscriptionPlan } from '@prisma/client'
import { ResolvedPlanTexts } from '@/lib/utils/subscription-features'

interface MembershipPageClientProps {
  resolvedFeatures: Record<string, ResolvedPlanTexts>
}

export function MembershipPageClient({ resolvedFeatures }: MembershipPageClientProps) {
  const tSubscription = useTranslations('subscription')
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(BillingInterval.annual)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <LandingBackground />

      {/* Content Layer */}
      <div className="relative z-10">
        <LandingNavbar />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-100">
              {tSubscription('pageTitlePart1')}
              <span className="text-lavanda">{tSubscription('pageTitlePart2')}</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mt-4">
              {tSubscription('membershipSubheader')}
            </p>
          </div>

          {/* Billing Interval Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg bg-gray-800/60 p-1">
              <button
                onClick={() => setBillingInterval(BillingInterval.monthly)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingInterval === BillingInterval.monthly
                    ? 'bg-gray-700 text-gray-100 shadow-sm'
                    : 'text-gray-400 hover:text-gray-100'
                }`}
              >
                {tSubscription('billing.monthly')}
              </button>
              <button
                onClick={() => setBillingInterval(BillingInterval.annual)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingInterval === BillingInterval.annual
                    ? 'bg-gray-700 text-gray-100 shadow-sm'
                    : 'text-gray-400 hover:text-gray-100'
                }`}
              >
                {tSubscription('billing.annual')}
                <span className="ml-1 text-xs text-green-400">-20%</span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(SUBSCRIPTION_PLAN_DETAIL).map(([planId, plan]) => (
              <PlanCard
                key={planId}
                planId={planId}
                plan={plan}
                currentPlan={SubscriptionPlan.apprentice}
                isCurrentPlan={false}
                isFreeMode={true}
                isPendingDowngrade={false}
                isPendingPlanChange={false}
                upgradeLoading={null}
                cancelDowngradeLoading={false}
                isActiveCancelled={false}
                isExpired={false}
                isPastDueOrUnpaid={false}
                onPlanAction={() => {}}
                billingInterval={billingInterval}
                showButton={false}
                className="bg-gray-800/60 border-cian hover:shadow-lg hover:shadow-lavanda/20 transition-all duration-300"
                resolvedFeatures={resolvedFeatures[planId].features}
                resolvedDescription={resolvedFeatures[planId].description}
              />
            ))}
          </div>
        </div>

        <LandingFooter />
      </div>
    </div>
  )
}
