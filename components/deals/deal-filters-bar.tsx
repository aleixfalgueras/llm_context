'use client'

import { useTranslations } from '@/lib/translations/context'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { getDealCategoriesWithLabels } from '@/lib/types/deal-types'

interface DealFiltersBarProps {
  searchTerm: string
  selectedCategory: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  className?: string
}

export function DealFiltersBar({
  searchTerm,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  className = ''
}: DealFiltersBarProps) {
  const t = useTranslations('deals')

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      {/* Search Input */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getDealCategoriesWithLabels(t, true).map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
