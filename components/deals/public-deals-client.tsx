'use client'

import { useTranslations } from '@/lib/translations/context'
import { Input } from '@/components/ui/input'
import { Search, Tag } from 'lucide-react'
import { Deal } from '@prisma/client'
import { DealCard } from './deal-card'
import { DealEmptyState } from './deal-empty-state'
import { useState, useMemo } from 'react'

interface PublicDealsClientProps {
  initialPublicDeals: Deal[]
}

export function PublicDealsClient({ initialPublicDeals }: PublicDealsClientProps): JSX.Element {
  const t = useTranslations('deals')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter deals by search term (client-side)
  const filteredDeals = useMemo(() => {
    if (!searchTerm.trim()) return initialPublicDeals

    const searchLower = searchTerm.toLowerCase()
    return initialPublicDeals.filter(deal =>
      deal.title.toLowerCase().includes(searchLower) ||
      deal.description.toLowerCase().includes(searchLower)
    )
  }, [initialPublicDeals, searchTerm])

  return (
    <div className="max-w-7xl mx-auto pt-12 px-6 pb-6 space-y-8">
      {/* Search Bar */}
      <div className="relative rounded">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800/60 border-b-cian"
        />
      </div>

      {/* Public Deals Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-white" />
          <h2 className="text-xl text-white font-semibold">{t('publicDeals')}</h2>
          {filteredDeals.length > 0 && (
            <span className="text-sm text-muted-foreground">({filteredDeals.length})</span>
          )}
        </div>

        {filteredDeals.length === 0 ? (
          <DealEmptyState isMyDeals={false} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isOwner={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
