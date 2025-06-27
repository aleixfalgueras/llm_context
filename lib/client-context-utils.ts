interface Client {
  name?: string | null
  country?: string | null
  generalContext?: string | null
}

/**
 * Builds just the client context section for AI prompts
 * RESPECTS user privacy selections - only includes fields user explicitly chose
 * Returns empty string if no context fields are selected
 */
export function buildClientContextSection(client: Client, selectedFields: string[] = []): string {
  // Safety check - if no fields selected, return empty string
  if (selectedFields.length === 0) {
    return ''
  }

  const shouldIncludeCountry = selectedFields.includes('country')
  const shouldIncludeGeneralContext = selectedFields.includes('general_context')

  // If no valid fields selected, return empty
  if (!shouldIncludeCountry && !shouldIncludeGeneralContext) {
    return ''
  }

  let contextSection = '\n\nCLIENT CONTEXT:'
  
  // Add client profile section - ONLY if user selected country
  if (shouldIncludeCountry && client.country) {
    contextSection += `\nCountry: ${client.country}`
    
    // Add general context after country without a label - per user request
    if (shouldIncludeGeneralContext && client.generalContext) {
      contextSection += ` ${client.generalContext}`
    }
  } else if (shouldIncludeGeneralContext && client.generalContext) {
    // If only general context is selected, add it after a basic country label
    contextSection += `\nCountry: ${client.generalContext}`
  }

  return contextSection
}

/**
 * Check if any client context was selected by the user
 * Useful for conditional prompt instructions
 */
export function hasClientContext(selectedFields: string[] = []): boolean {
  return selectedFields.length > 0 && 
         (selectedFields.includes('country') || selectedFields.includes('general_context'))
}