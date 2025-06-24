'use client'

import { useState } from 'react'

export function useDocumentUIState() {
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEditPreview, setShowEditPreview] = useState(false)

  const resetUIState = () => {
    setShowDeleteAllConfirm(false)
    setShowPreview(false)
    setShowEditPreview(false)
  }

  return {
    showDeleteAllConfirm,
    setShowDeleteAllConfirm,
    showPreview,
    setShowPreview,
    showEditPreview,
    setShowEditPreview,
    resetUIState,
  }
} 