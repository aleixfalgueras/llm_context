/**
 * Centralized loading state management hook to eliminate duplicate async operation patterns.
 * Provides consistent loading states, error handling, and operation management.
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { handleClientApiError } from '@/lib/utils/toast'

/**
 * Configuration for async operations
 */
interface AsyncOperationConfig {
  /** Context string for error logging and toasts */
  context?: string
  /** Whether to show toast notifications for errors (default: true) */
  showErrorToast?: boolean
  /** Whether to show toast notifications for success (default: false) */
  showSuccessToast?: boolean
  /** Custom success message for toast */
  successMessage?: string
  /** Whether to log errors to console (default: true) */
  logErrors?: boolean
  /** Timeout in milliseconds for the operation */
  timeout?: number
}

/**
 * Result of an async operation
 */
interface AsyncOperationResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * State for async operations
 */
interface AsyncOperationState {
  isLoading: boolean
  error: string | null
  lastOperation: string | null
}

/**
 * Return type for the useAsyncOperation hook
 */
interface UseAsyncOperationReturn {
  /** Current loading state */
  isLoading: boolean
  /** Current error state */
  error: string | null
  /** Name of the last operation performed */
  lastOperation: string | null
  /** Execute an async operation with automatic state management */
  execute: <T>(
    operation: () => Promise<T>,
    config?: AsyncOperationConfig
  ) => Promise<AsyncOperationResult<T>>
  /** Execute multiple operations in sequence */
  executeSequence: <T>(
    operations: Array<{
      operation: () => Promise<T>
      config?: AsyncOperationConfig
    }>
  ) => Promise<AsyncOperationResult<T[]>>
  /** Execute multiple operations in parallel */
  executeParallel: <T>(
    operations: Array<{
      operation: () => Promise<T>
      config?: AsyncOperationConfig
    }>
  ) => Promise<AsyncOperationResult<T[]>>
  /** Clear error state */
  clearError: () => void
  /** Reset all state */
  reset: () => void
  /** Check if a specific operation is running */
  isOperationRunning: (operationName: string) => boolean
}

/**
 * Hook for managing async operations with consistent loading states and error handling.
 * Eliminates duplicate loading state patterns across components.
 * 
 * @example
 * ```typescript
 * const { isLoading, error, execute } = useAsyncOperation()
 * 
 * const handleSave = async () => {
 *   const result = await execute(
 *     () => saveDocument(documentData),
 *     { 
 *       context: 'Save Document',
 *       showSuccessToast: true,
 *       successMessage: 'Document saved successfully'
 *     }
 *   )
 *   
 *   if (result.success) {
 *     // Handle success
 *   }
 * }
 * ```
 */
export function useAsyncOperation(): UseAsyncOperationReturn {
  const { toast } = useToast()
  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
    lastOperation: null
  })
  
  // Track running operations for concurrent operation management
  const runningOperations = useRef<Set<string>>(new Set())

  const setLoading = useCallback((loading: boolean, operation?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      lastOperation: operation || prev.lastOperation
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastOperation: null
    })
    runningOperations.current.clear()
  }, [])

  const isOperationRunning = useCallback((operationName: string) => {
    return runningOperations.current.has(operationName)
  }, [])

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    config: AsyncOperationConfig = {}
  ): Promise<AsyncOperationResult<T>> => {
    const {
      context = 'Operation',
      showErrorToast = true,
      showSuccessToast = false,
      successMessage,
      logErrors = true,
      timeout
    } = config

    // Clear previous errors
    clearError()
    setLoading(true, context)
    
    // Track this operation
    runningOperations.current.add(context)

    try {
      let operationPromise = operation()

      // Apply timeout if specified
      if (timeout) {
        operationPromise = Promise.race([
          operationPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeout)
          )
        ])
      }

      const result = await operationPromise

      // Show success toast if requested
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
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      // Log error if requested
      if (logErrors) {
        console.error(`Error in ${context}:`, error)
      }

      // Set error state
      setError(errorMessage)

      // Show error toast if requested
      if (showErrorToast) {
        // Check if this is a Response object from fetch
        if (error && typeof error === 'object' && 'status' in error) {
          // Handle fetch response errors
          if (error.status === 402 || error.status === 429 || error.status === 403) {
            // Let the API error handler deal with subscription/usage errors
            handleClientApiError(error, `${context} failed`)
          } else {
            // Handle other HTTP errors normally
            toast({
              title: `${context} Failed`,
              description: errorMessage,
              variant: 'destructive'
            })
          }
        } else if (error && typeof error === 'object' && 'code' in error) {
          // Handle server action errors with codes
          handleClientApiError(error, `${context} failed`)
        } else {
          // Handle non-HTTP errors normally
          toast({
            title: `${context} Failed`,
            description: errorMessage,
            variant: 'destructive'
          })
        }
      }

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
      runningOperations.current.delete(context)
    }
  }, [clearError, setLoading, setError, toast])

  const executeSequence = useCallback(async <T>(
    operations: Array<{
      operation: () => Promise<T>
      config?: AsyncOperationConfig
    }>
  ): Promise<AsyncOperationResult<T[]>> => {
    const results: T[] = []
    
    for (const { operation, config } of operations) {
      const result = await execute(operation, config)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }
      
      results.push(result.data!)
    }

    return {
      success: true,
      data: results
    }
  }, [execute])

  const executeParallel = useCallback(async <T>(
    operations: Array<{
      operation: () => Promise<T>
      config?: AsyncOperationConfig
    }>
  ): Promise<AsyncOperationResult<T[]>> => {
    try {
      const promises = operations.map(({ operation, config }) => 
        execute(operation, config)
      )
      
      const results = await Promise.all(promises)
      
      // Check if any operation failed
      const failedResult = results.find(result => !result.success)
      if (failedResult) {
        return {
          success: false,
          error: failedResult.error
        }
      }

      return {
        success: true,
        data: results.map(result => result.data!)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parallel operations failed'
      }
    }
  }, [execute])

  return {
    isLoading: state.isLoading,
    error: state.error,
    lastOperation: state.lastOperation,
    execute,
    executeSequence,
    executeParallel,
    clearError,
    reset,
    isOperationRunning
  }
}

/**
 * Specialized hook for form operations (save, delete, etc.)
 */
export function useFormOperations() {
  const asyncOp = useAsyncOperation()

  const save = useCallback(async <T>(
    saveOperation: () => Promise<T>,
    entityName: string = 'item'
  ) => {
    return asyncOp.execute(saveOperation, {
      context: `Save ${entityName}`,
      showSuccessToast: true,
      successMessage: `${entityName} saved successfully`
    })
  }, [asyncOp])

  const deleteItem = useCallback(async <T>(
    deleteOperation: () => Promise<T>,
    entityName: string = 'item'
  ) => {
    return asyncOp.execute(deleteOperation, {
      context: `Delete ${entityName}`,
      showSuccessToast: true,
      successMessage: `${entityName} deleted successfully`
    })
  }, [asyncOp])

  const create = useCallback(async <T>(
    createOperation: () => Promise<T>,
    entityName: string = 'item'
  ) => {
    return asyncOp.execute(createOperation, {
      context: `Create ${entityName}`,
      showSuccessToast: true,
      successMessage: `${entityName} created successfully`
    })
  }, [asyncOp])

  return {
    ...asyncOp,
    save,
    delete: deleteItem,
    create
  }
}

/**
 * Specialized hook for data fetching operations
 */
export function useDataFetching() {
  const asyncOp = useAsyncOperation()

  const fetch = useCallback(async <T>(
    fetchOperation: () => Promise<T>,
    resourceName: string = 'data'
  ) => {
    return asyncOp.execute(fetchOperation, {
      context: `Fetch ${resourceName}`,
      showErrorToast: true,
      showSuccessToast: false
    })
  }, [asyncOp])

  const refresh = useCallback(async <T>(
    refreshOperation: () => Promise<T>,
    resourceName: string = 'data'
  ) => {
    return asyncOp.execute(refreshOperation, {
      context: `Refresh ${resourceName}`,
      showErrorToast: true,
      showSuccessToast: false
    })
  }, [asyncOp])

  return {
    ...asyncOp,
    fetch,
    refresh
  }
}