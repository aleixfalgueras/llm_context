'use client'

import { useState, useEffect, useMemo } from 'react'
import { Deal } from '@prisma/client'
import { DealFormData } from '@/lib/types/deal-types'
import { createDeal, updateDeal, deleteDeal, getUserDeals } from '@/app/actions/deal-action'
import { toast } from '@/hooks/use-toast'
import { useTranslations } from '@/lib/translations/context'

interface UseDealManagementProps {
  initialPublicDeals: Deal[]
}

export function useDealManagement({ initialPublicDeals }: UseDealManagementProps) {
  const t = useTranslations('deals')

  // State for deals
  const [publicDeals, setPublicDeals] = useState<Deal[]>(initialPublicDeals)
  const [userDeals, setUserDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null)

  // Operation states
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter deals by search term
  const filteredPublicDeals = useMemo(() => {
    if (!searchTerm.trim()) return publicDeals

    const searchLower = searchTerm.toLowerCase()
    return publicDeals.filter(deal =>
      deal.title.toLowerCase().includes(searchLower) ||
      deal.description.toLowerCase().includes(searchLower)
    )
  }, [publicDeals, searchTerm])

  const filteredUserDeals = useMemo(() => {
    if (!searchTerm.trim()) return userDeals

    const searchLower = searchTerm.toLowerCase()
    return userDeals.filter(deal =>
      deal.title.toLowerCase().includes(searchLower) ||
      deal.description.toLowerCase().includes(searchLower)
    )
  }, [userDeals, searchTerm])

  // Fetch user deals
  const fetchUserDeals = async () => {
    try {
      setLoading(true)
      const deals = await getUserDeals()
      setUserDeals(deals)
    } catch (error) {
      console.error('Error fetching user deals:', error)
      toast({
        title: t('messages.loadError'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch of user deals
  useEffect(() => {
    fetchUserDeals()
  }, [])

  // Handle create new deal
  const handleCreateDeal = () => {
    setEditingDeal(null)
    setIsFormDialogOpen(true)
  }

  // Handle edit deal
  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal)
    setIsFormDialogOpen(true)
  }

  // Handle delete deal
  const handleDeleteDeal = (deal: Deal) => {
    setDeletingDeal(deal)
    setIsDeleteDialogOpen(true)
  }

  // Submit form (create or update)
  const handleSubmitDeal = async (data: DealFormData) => {
    try {
      setIsSaving(true)

      if (editingDeal) {
        // Update existing deal
        await updateDeal(editingDeal.id, data)
        toast({
          title: t('messages.updateSuccess'),
          variant: 'default'
        })
      } else {
        // Create new deal
        await createDeal(data)
        toast({
          title: t('messages.createSuccess'),
          variant: 'default'
        })
      }

      // Refresh deals
      await fetchUserDeals()
      setIsFormDialogOpen(false)
      setEditingDeal(null)
    } catch (error) {
      console.error('Error saving deal:', error)
      toast({
        title: editingDeal ? t('messages.updateError') : t('messages.createError'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingDeal) return

    try {
      setIsDeleting(true)
      await deleteDeal(deletingDeal.id)

      toast({
        title: t('messages.deleteSuccess'),
        variant: 'default'
      })

      // Refresh deals
      await fetchUserDeals()
      setIsDeleteDialogOpen(false)
      setDeletingDeal(null)
    } catch (error) {
      console.error('Error deleting deal:', error)
      toast({
        title: t('messages.deleteError'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    // Data
    publicDeals,
    userDeals,
    filteredPublicDeals,
    filteredUserDeals,
    loading,
    searchTerm,

    // Dialog states
    isFormDialogOpen,
    isDeleteDialogOpen,
    editingDeal,
    deletingDeal,

    // Operation states
    isSaving,
    isDeleting,

    // Actions
    setSearchTerm,
    handleCreateDeal,
    handleEditDeal,
    handleDeleteDeal,
    handleSubmitDeal,
    handleConfirmDelete,
    setIsFormDialogOpen,
    setIsDeleteDialogOpen,
    fetchUserDeals
  }
}