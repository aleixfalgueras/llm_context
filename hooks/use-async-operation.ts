/**
 * Basic async operation hooks for loading state and error handling.
 *
 * Features:
 * - Automatic loading state management
 * - Consistent error handling with toast notifications
 * - Integration with handleClientApiError for API errors
 * - Form-specific operations (save, create, delete)
 * - Success toast notifications for form operations
 */

'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { handleClientApiError } from '@/lib/api/api-toast'
import {logger} from "@/lib/logger";

/**
 * Result of an async operation
 * 
 * @template T - The type of data returned by the operation
 */
interface AsyncOperationResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Basic hook for managing async operations with loading and error states.
 * 
 * Provides a simple interface for executing async operations with automatic
 * loading state management, error handling, and toast notifications.
 * 
 * @returns Object containing state and actions for async operations
 * @returns returns.isLoading - Whether an operation is currently running
 * @returns returns.error - Current error message, null if no error
 * @returns returns.clearError - Function to clear the current error state
 * @returns returns.execute - Function to execute an async operation with options
 * 
 * @example
 * ```typescript
 * const { isLoading, error, execute, clearError } = useAsyncState()
 * 
 * // Execute an operation with success toast
 * const result = await execute(
 *   () => fetchUserData(userId),
 *   {
 *     context: 'Load User',
 *     showSuccessToast: true,
 *     successMessage: 'User loaded successfully'
 *   }
 * )
 * 
 * if (result.success) {
 *   console.log('User data:', result.data)
 * }
 * ```
 */
function useAsyncState() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Executes an async operation with automatic state management
   * 
   * @template T - The type of data returned by the operation
   * @param operation - The async function to execute
   * @param options - Configuration options for the operation
   * @param options.context - Context string for logging and toast messages (default: 'Operation')
   * @param options.showSuccessToast - Whether to show a success toast (default: false)
   * @param options.successMessage - Custom success message for the toast
   * @returns Promise resolving to AsyncOperationResult with success/error state
   */
  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      context?: string
      showSuccessToast?: boolean
      successMessage?: string
    } = {}): Promise<AsyncOperationResult<T>> => {
    const { context = 'Operation', showSuccessToast = false, successMessage } = options

    setIsLoading(true)
    setError(null)

    try {
      const result = await operation()

      if (showSuccessToast) {
        toast({
          title: 'Success',
          description: successMessage || `${context} completed successfully`
        })
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      const errorMessage = logger.handleError(error)

      handleClientApiError(errorMessage, `${context} failed`)
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }

    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    isLoading,
    error,
    clearError,
    execute
  }
}

/**
 * Specialized hook for form operations (save, create, delete)
 * 
 * Extends useAsyncState with form-specific operations that automatically
 * configure success toasts and contextual error messages. Ideal for
 * CRUD operations in forms.
 * 
 * @returns Object containing all useAsyncState properties plus form operations
 * @returns returns.isLoading - Whether an operation is currently running
 * @returns returns.error - Current error message, null if no error
 * @returns returns.clearError - Function to clear the current error state
 * @returns returns.execute - Base execute function for custom operations
 * @returns returns.save - Save operation with success toast
 * @returns returns.create - Create operation with success toast
 * @returns returns.delete - Delete operation with success toast
 * 
 * @example
 * ```typescript
 * const { isLoading, error, save, create, delete: deleteItem } = useFormOperations()
 * 
 * // Save a client
 * const handleSave = async () => {
 *   const result = await save(
 *     () => updateClient(clientId, clientData),
 *     'client'
 *   )
 *   
 *   if (result.success) {
 *     // Handle success - toast will show automatically
 *     router.push('/clients')
 *   }
 * }
 * 
 * // Create a new document
 * const handleCreate = async () => {
 *   const result = await create(
 *     () => createDocument(documentData),
 *     'document'
 *   )
 * }
 * ```
 */
export function useFormOperations() {
  const asyncState = useAsyncState()

  /**
   * Executes a save operation with automatic success toast
   * 
   * @template T - The type of data returned by the save operation
   * @param saveOperation - The async function that performs the save
   * @param entityName - Name of the entity being saved (for toast messages, default: 'item')
   * @returns Promise resolving to AsyncOperationResult
   */
  const save = useCallback(async <T>(
    saveOperation: () => Promise<T>,
    entityName: string = 'item'
  ) => {
    return asyncState.execute(saveOperation, {
      context: `Save ${entityName}`,
      showSuccessToast: false,
      successMessage: `${entityName} saved successfully`
    })
  }, [asyncState])

  /**
   * Executes a create operation with automatic success toast
   * 
   * @template T - The type of data returned by the create operation
   * @param createOperation - The async function that performs the creation
   * @param entityName - Name of the entity being created (for toast messages, default: 'item')
   * @returns Promise resolving to AsyncOperationResult
   */
  const create = useCallback(async <T>(
    createOperation: () => Promise<T>,
    entityName: string = 'item'
  ) => {
    return asyncState.execute(createOperation, {
      context: `Create ${entityName}`,
      showSuccessToast: false,
      successMessage: `${entityName} created successfully`
    })
  }, [asyncState])

  /**
   * Executes a delete operation with automatic success toast
   * 
   * @template T - The type of data returned by the delete operation
   * @param deleteOperation - The async function that performs the deletion
   * @param entityName - Name of the entity being deleted (for toast messages, default: 'item')
   * @returns Promise resolving to AsyncOperationResult
   */
  const deleteItem = useCallback(async <T>(
    deleteOperation: () => Promise<T>,
    entityName: string = 'item'
  ) => {
    return asyncState.execute(deleteOperation, {
      context: `Delete ${entityName}`,
      showSuccessToast: false,
      successMessage: `${entityName} deleted successfully`
    })
  }, [asyncState])

  return {
    ...asyncState,
    save,
    create,
    delete: deleteItem
  }
}