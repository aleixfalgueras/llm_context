import { Navbar } from '@/components/global/navbar'
import { DealsPageClient } from '@/components/deals/deals-page-client'
import { getPublicDeals } from '@/app/actions/deal-action'

export const dynamic = 'force-dynamic'

export default async function DealsPage() {
  const publicDeals = await getPublicDeals()

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <DealsPageClient initialPublicDeals={publicDeals} />
      </div>
    </div>
  )
}