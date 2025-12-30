import { getResolvedPlanFeatures } from '@/lib/utils/subscription-features'
import { MembershipPageClient } from '@/components/membership/membership-page-client'

export default async function MembershipPage() {
  const resolvedFeatures = await getResolvedPlanFeatures()
  return <MembershipPageClient resolvedFeatures={resolvedFeatures} />
}
