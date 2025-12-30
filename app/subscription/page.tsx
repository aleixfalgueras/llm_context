import { getResolvedPlanFeatures } from '@/lib/utils/subscription-features'
import { SubscriptionPageClient } from '@/components/subscription/subscription-page-client'

export default async function SubscriptionPage() {
  const resolvedFeatures = await getResolvedPlanFeatures()
  return <SubscriptionPageClient resolvedFeatures={resolvedFeatures} />
}
