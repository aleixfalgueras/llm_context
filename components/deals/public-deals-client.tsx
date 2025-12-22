'use client'

import { useTranslations } from '@/lib/translations/context'
import { Tag } from 'lucide-react'
import { Deal } from '@prisma/client'
import { DealCard } from './deal-card'
import { DealEmptyState } from './deal-empty-state'
import { DealFiltersBar } from './deal-filters-bar'
import { useState, useMemo } from 'react'

interface PublicDealsClientProps {
  initialPublicDeals: Deal[]
}

export function PublicDealsClient({ initialPublicDeals }: PublicDealsClientProps): JSX.Element {
  const t = useTranslations('deals')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter deals by search term and category (client-side)
  const filteredDeals = useMemo(() => {
    let filtered = initialPublicDeals

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(deal =>
        deal.title.toLowerCase().includes(searchLower) ||
        deal.description.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(deal => deal.category === selectedCategory)
    }

    return filtered
  }, [initialPublicDeals, searchTerm, selectedCategory])

  return (
    <div className="max-w-7xl mx-auto pt-12 px-6 pb-6 space-y-8">
      {/* Filters Bar */}
      <DealFiltersBar
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />

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
