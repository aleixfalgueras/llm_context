'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseLocalStorageReturn<T> {
  // State
  value: T
  loading: boolean
  error: string | null
  
  // Actions
  setValue: (value: T | ((prev: T) => T)) => void
  clearValue: () => void
  refreshValue: () => void
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse
): UseLocalStorageReturn<T> {
  const [value, setStoredValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Read from localStorage on mount
  useEffect(() => {
    try {
      setLoading(true)
      setError(null)
      
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        const parsedValue = deserialize(item)
        setStoredValue(parsedValue)
      } else {
        setStoredValue(defaultValue)
      }
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Failed to read from localStorage')
      setStoredValue(defaultValue)
    } finally {
      setLoading(false)
    }
  }, [key])

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      setError(null)
      
      // Allow functional updates like useState
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value)
        : newValue

      setStoredValue(valueToStore)
      
      if (valueToStore === undefined || valueToStore === null) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, serialize(valueToStore))
      }
    } catch (err) {
      console.error(`Error setting localStorage key "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Failed to write to localStorage')
    }
  }, [key, serialize, value])

  const clearValue = useCallback(() => {
    try {
      setError(null)
      window.localStorage.removeItem(key)
      setStoredValue(defaultValue)
    } catch (err) {
      console.error(`Error clearing localStorage key "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Failed to clear localStorage')
    }
  }, [key, defaultValue])

  const refreshValue = useCallback(() => {
    try {
      setError(null)
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        const parsedValue = deserialize(item)
        setStoredValue(parsedValue)
      } else {
        setStoredValue(defaultValue)
      }
    } catch (err) {
      console.error(`Error refreshing localStorage key "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Failed to refresh from localStorage')
    }
  }, [key, defaultValue, deserialize])

  return {
    // State
    value,
    loading,
    error,
    
    // Actions
    setValue,
    clearValue,
    refreshValue,
  }
}