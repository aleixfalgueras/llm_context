'use client'

import { useState, useEffect } from 'react'

export function useDocumentUIState() {
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEditPreview, setShowEditPreview] = useState(false)

  // Auto-reset delete confirmation after 3 seconds (matching chat sidebar behavior)
  useEffect(() => {
    if (showDeleteAllConfirm) {
      const timeout = setTimeout(() => {
        setShowDeleteAllConfirm(false)
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [showDeleteAllConfirm])

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