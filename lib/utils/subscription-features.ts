import { DynamicTextService } from '@/services/dynamic-text-service'
import { getLocaleFromCookies } from '@/lib/utils/locale-cookie-server'
import { SUBSCRIPTION_PLAN_DETAIL } from '@/lib/types/subscription-types'

export interface ResolvedPlanTexts {
  features: string[]
  description: string
}

/**
 * Server-side helper to get resolved plan texts from the database
 * Returns a Record mapping planId to resolved features and description
 *
 * This function should be called from server components/pages and the
 * result passed as props to client components that render plan cards.
 */
export async function getResolvedPlanFeatures(): Promise<Record<string, ResolvedPlanTexts>> {
  const locale = await getLocaleFromCookies()
  const textsMap = await DynamicTextService.getSubscriptionFeatures(locale)

  // Build resolved texts for each plan
  const resolved: Record<string, ResolvedPlanTexts> = {}

  for (const [planId, planConfig] of Object.entries(SUBSCRIPTION_PLAN_DETAIL)) {
    const featuresValue = textsMap.get(planConfig.features_key) || ''
    resolved[planId] = {
      features: featuresValue.split('\n').filter(f => f.trim()),
      description: textsMap.get(planConfig.description) || planConfig.description
    }
  }

  return resolved
}
