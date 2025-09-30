'use client'

import { useTranslations } from '@/lib/translations/context'
import { Button } from '@/components/ui/button'
import { Plus, Tag } from 'lucide-react'
import { Deal, SubscriptionPlan } from '@prisma/client'
import { DealCard } from './deal-card'
import { DealEmptyState } from './deal-empty-state'
import { DealFormDialog } from './deal-form-dialog'
import { DeleteDealDialog } from './delete-deal-dialog'
import { useDealManagement } from '@/hooks/use-deal-management'
import { useSubscription } from '@/hooks/subscription/use-subscription'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

interface DealsPageClientProps {
  initialPublicDeals: Deal[]
}

export function DealsPageClient({ initialPublicDeals }: DealsPageClientProps) {
  const t = useTranslations('deals')
  const { user } = useUser()

  const {
    publicDeals,
    userDeals,
    loading,
    isFormDialogOpen,
    isDeleteDialogOpen,
    editingDeal,
    deletingDeal,
    isSaving,
    isDeleting,
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

      {/* Public Deals Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t('publicDeals')}</h2>
          {publicDeals.length > 0 && (
            <span className="text-sm text-muted-foreground">({publicDeals.length})</span>
          )}
        </div>

        {publicDeals.length === 0 ? (
          <DealEmptyState isMyDeals={false} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicDeals.map((deal) => (
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
        <div className="space-y-4 pt-8 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{t('myDeals')}</h2>
              {userDeals.length > 0 && (
                <span className="text-sm text-muted-foreground">({userDeals.length})</span>
              )}
            </div>
            {canCreateDeals && (
              <Button variant="blue" onClick={handleCreateDeal}>
                <Plus className="w-4 h-4 mr-2" />
                {t('createDeal')}
              </Button>
            )}
          </div>

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
          ) : userDeals.length === 0 ? (
            <DealEmptyState
              isMyDeals={true}
              onCreateDeal={canCreateDeals ? handleCreateDeal : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userDeals.map((deal) => (
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
        </div>
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