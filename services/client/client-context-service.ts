import type {Client} from '@prisma/client'
import {CLIENT_CONTEXT_FIELDS, CLIENT_CONTEXT_VARIABLES, CLIENT_FIELD_LABELS} from '@/lib/types/client-types'

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
export function buildClientContextSection(client: Client, selectedFields: string[] = []): string {
  // Safety check - if no fields selected, return empty string
  if (selectedFields.length === 0) {
    return ''
  }

  // Check which context fields are selected and have data
  const validContextFields = Object.keys(CLIENT_CONTEXT_FIELDS).filter(field => 
    selectedFields.includes(field) && client[field as keyof Client]
  )
  
  // If no valid fields selected, return empty
  if (validContextFields.length === 0) {
    return ''
  }

  let contextSection = '\n\nCLIENT CONTEXT:'
  
  // Collect all selected context parts (excluding country)
  const contextParts = validContextFields
    .filter(field => field !== 'country')
    .map(field => client[field as keyof Client])
    .filter(Boolean)
  
  // Build the context line based on whether country is selected
  const hasCountry = validContextFields.includes('country')
  if (hasCountry) {
    // Country selected: "Country: [country] [other contexts...]"
    contextSection += `\n${CLIENT_FIELD_LABELS.country}: ${client.country}`
    if (contextParts.length > 0) {
      contextSection += ` ${contextParts.join(' ')}`
    }
  } else if (contextParts.length > 0) {
    // No country selected but other contexts available: just the context content
    contextSection += `\n${contextParts.join(' ')}`
  }

  return contextSection
}

/**
 * Check if any client context was selected by the user
 * Useful for conditional prompt instructions
 */
export function hasClientContext(selectedFields: string[] = []): boolean {
  return selectedFields.length > 0 && 
         selectedFields.some(field => Object.keys(CLIENT_CONTEXT_FIELDS).includes(field))
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
 * Get list of available client context variables (CLIENT_CONTEXT_VARIABLES) for display in UI
 */
export function getAvailableClientContextVariables(): string[] {
  return Object.values(CLIENT_CONTEXT_VARIABLES).map(variable => `{${variable}}`)
}