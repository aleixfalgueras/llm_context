import type {Client} from '@prisma/client'
import {CLIENT_CONTEXT_VARIABLES} from '@/lib/types/client-types'
import {TranslationFunction} from '@/lib/translations'
import {getClientContextFields} from '@/lib/utils/client-context-utils'

/**
 * Check if any client context was selected by the user
 * Useful for conditional prompt instructions
 */
export function hasClientContext(selectedFields: string[] = [], t: TranslationFunction): boolean {
  const contextFields = getClientContextFields(t)
  return selectedFields.length > 0 &&
    selectedFields.some(field => Object.keys(contextFields).includes(field))
}

/**
 * Replaces client context variables (CLIENT_CONTEXT_VARIABLES) in content with actual client data
 */
export function replaceClientContextVariables(content: string, client: Client): string {
  let result = content

  // Iterate through all context variables and replace them
  Object.entries(CLIENT_CONTEXT_VARIABLES).forEach(([field, variable]) => {
    const variablePattern = new RegExp(`\\{${variable}\\}`, 'g')
    const fieldValue = client[field as keyof Client]
    const defaultValue = `[${variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}]`

    result = result.replace(variablePattern, (fieldValue as string) || defaultValue)
  })

  return result
}

/**
 * Builds just the client context section for AI prompts
 * RESPECTS user privacy selections - only includes fields user explicitly chose
 * Returns empty string if no context fields are selected
 * 
 * SPECIAL HANDLING:
 * - Country field gets formatted with label: "Country: [value]"  
 * - Other context fields (generalContext, specificContext1-3) are concatenated as raw values
 * - Output with country: "Country: USA This is context"
 * - Output without country: "This is context"
 */
export function buildClientContextSection(
  client: Client, 
  selectedFields: string[] = [],
  t: TranslationFunction
): string {
  // Safety check - if no fields selected, return empty string
  if (selectedFields.length === 0) {
    return ''
  }

  // Check which context fields are selected and have data
  const contextFields = getClientContextFields(t)
  const validContextFields = Object.keys(contextFields).filter(field => 
    selectedFields.includes(field) && client[field as keyof Client]
  )
  
  // If no valid fields selected, return empty
  if (validContextFields.length === 0) {
    return ''
  }

  let contextSection = `${t('clientContext.header')}`
  
  // Collect all selected context parts (excluding country)
  const contextParts = validContextFields
    .filter(field => field !== 'country')
    .map(field => client[field as keyof Client])
    .filter(Boolean)
  
  // Build the context line based on whether country is selected
  const hasCountry = validContextFields.includes('country')
  if (hasCountry) {
    // Country selected: "Country: [country] [other contexts...]"
    contextSection += `\n${contextFields.country}: ${client.country}`
    if (contextParts.length > 0) {
      contextSection += ` ${contextParts.join(' ')}`
    }
  } else if (contextParts.length > 0) {
    // No country selected but other contexts available: just the context content
    contextSection += `\n${contextParts.join(' ')}`
  }

  return contextSection
}

