'use client'

import { useTranslations } from '@/lib/translations/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Tag, ChevronDown, Search } from 'lucide-react'
import { Deal, SubscriptionPlan } from '@prisma/client'
import { DealCard } from './deal-card'
import { DealEmptyState } from './deal-empty-state'
import { DealFormDialog } from './deal-form-dialog'
import { DeleteDealDialog } from './delete-deal-dialog'
import { useDealManagement } from '@/hooks/use-deal-management'
import { useSubscription } from '@/hooks/subscription/use-subscription'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useState } from 'react'

interface DealsPageClientProps {
  initialPublicDeals: Deal[]
}

export function DealsPageClient({ initialPublicDeals }: DealsPageClientProps) {
  const t = useTranslations('deals')
  const { user } = useUser()

  const {
    publicDeals,
    userDeals,
    filteredPublicDeals,
    filteredUserDeals,
    loading,
    searchTerm,
    isFormDialogOpen,
    isDeleteDialogOpen,
    editingDeal,
    deletingDeal,
    isSaving,
    isDeleting,
    setSearchTerm,
    handleCreateDeal,
    handleEditDeal,
    handleDeleteDeal,
    handleSubmitDeal,
    handleConfirmDelete,
    setIsFormDialogOpen,
    setIsDeleteDialogOpen,
  } = useDealManagement({ initialPublicDeals })

  const subscription = useSubscription()

  // Check if user can create deals (knight or higher)
  const allowedPlans: SubscriptionPlan[] = [
    SubscriptionPlan.knight,
    SubscriptionPlan.master,
    SubscriptionPlan.jedi
  ]
  const canCreateDeals = allowedPlans.includes(subscription.plan)

  // State for collapsible "My Deals" section - expanded by default if user has deals
  const [isMyDealsOpen, setIsMyDealsOpen] = useState(userDeals.length > 0)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Public Deals Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t('publicDeals')}</h2>
          {filteredPublicDeals.length > 0 && (
            <span className="text-sm text-muted-foreground">({filteredPublicDeals.length})</span>
          )}
        </div>

        {filteredPublicDeals.length === 0 ? (
          <DealEmptyState isMyDeals={false} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPublicDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isOwner={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* My Deals Section */}
      {user && (
        <Collapsible
          open={isMyDealsOpen}
          onOpenChange={setIsMyDealsOpen}
          className="space-y-4 pt-8 border-t"
        >
          <div className="flex justify-between items-center">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <Tag className="h-5 w-5" />
                <h2 className="text-xl font-semibold">{t('myDeals')}</h2>
                {filteredUserDeals.length > 0 && (
                  <span className="text-sm text-muted-foreground">({filteredUserDeals.length})</span>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isMyDealsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            {canCreateDeals && (
              <Button variant="blue" onClick={handleCreateDeal}>
                <Plus className="w-4 h-4 mr-2" />
                {t('createDeal')}
              </Button>
            )}
          </div>

          <CollapsibleContent className="space-y-4">
            {/* Subscription upgrade banner */}
            {!subscription.isLoading && !canCreateDeals && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">{t('subscription.upgradeTitle')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('subscription.upgradeDescription')}
                </p>
                <Link href="/subscription">
                  <Button variant="blue">
                    {t('subscription.upgradeButton')}
                  </Button>
                </Link>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredUserDeals.length === 0 ? (
              <DealEmptyState
                isMyDeals={true}
                onCreateDeal={canCreateDeals ? handleCreateDeal : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUserDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    isOwner={true}
                    onEdit={handleEditDeal}
                    onDelete={handleDeleteDeal}
                  />
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Deal Form Dialog */}
      <DealFormDialog
        deal={editingDeal}
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSubmit={handleSubmitDeal}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDealDialog
        deal={deletingDeal}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}