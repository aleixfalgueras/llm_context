'use client'

import React, { useState, useEffect } from 'react'
import { Input } from './input'
import { Label } from './label'
import { cn } from '@/lib/utils'

interface DateInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

export function DateInput({ 
  id, 
  value, 
  onChange, 
  placeholder = "dd/mm/yyyy", 
  className,
  disabled,
  required
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  // Convert ISO date (yyyy-mm-dd) to display format (dd/mm/yyyy)
  const isoToDisplay = (isoDate: string) => {
    if (!isoDate) return ''
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }

  // Convert display format (dd/mm/yyyy) to ISO date (yyyy-mm-dd)
  const displayToIso = (displayDate: string) => {
    if (!displayDate) return ''
    const parts = displayDate.replace(/\D/g, '')
    if (parts.length !== 8) return ''
    
    const day = parts.slice(0, 2)
    const month = parts.slice(2, 4)
    const year = parts.slice(4, 8)
    
    // Validate the date
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (date.getFullYear() != parseInt(year) || 
        date.getMonth() != parseInt(month) - 1 || 
        date.getDate() != parseInt(day)) {
      return ''
    }
    
    return `${year}-${month}-${day}`
  }

  // Format input as user types
  const formatInput = (input: string) => {
    const numbers = input.replace(/\D/g, '')
    let formatted = ''
    
    if (numbers.length >= 2) {
      formatted += numbers.slice(0, 2)
      if (numbers.length >= 4) {
        formatted += '/' + numbers.slice(2, 4)
        if (numbers.length >= 8) {
          formatted += '/' + numbers.slice(4, 8)
        } else if (numbers.length > 4) {
          formatted += '/' + numbers.slice(4)
        }
      } else if (numbers.length > 2) {
        formatted += '/' + numbers.slice(2)
      }
    } else {
      formatted = numbers
    }
    
    return formatted
  }

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(isoToDisplay(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const formatted = formatInput(input)
    setDisplayValue(formatted)
    
    // Only call onChange if we have a complete date (dd/mm/yyyy format)
    if (formatted.length === 10) {
      const isoDate = displayToIso(formatted)
      if (isoDate) {
        onChange(isoDate)
      }
    } else if (input === '') {
      onChange('')
    }
  }

  const handleBlur = () => {
    // Validate and clean up the date on blur
    if (displayValue.length === 10) {
      const isoDate = displayToIso(displayValue)
      if (isoDate) {
        onChange(isoDate)
        setDisplayValue(isoToDisplay(isoDate))
      } else {
        // Invalid date, clear it
        setDisplayValue('')
        onChange('')
      }
    } else if (displayValue.length > 0 && displayValue.length < 10) {
      // Incomplete date, clear it
      setDisplayValue('')
      onChange('')
    }
  }

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(className)}
      disabled={disabled}
      required={required}
      maxLength={10}
    />
  )
} 