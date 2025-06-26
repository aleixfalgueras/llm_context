interface Client {
  name?: string | null
  country?: string | null
  notes?: string | null
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
  const shouldIncludeNotes = selectedFields.includes('notes')

  // If no valid fields selected, return empty
  if (!shouldIncludeCountry && !shouldIncludeNotes) {
    return ''
  }

  let contextSection = '\n\nCLIENT CONTEXT:'
  
  // Add client profile section - ONLY if user selected country
  if (shouldIncludeCountry && client.country) {
    contextSection += `\nCountry: ${client.country}`
  }

  // Add notes section - ONLY if user selected notes
  if (shouldIncludeNotes && client.notes) {
    contextSection += `\n\nAdditional Notes:\n${client.notes}`
  }

  return contextSection
}

/**
 * Check if any client context was selected by the user
 * Useful for conditional prompt instructions
 */
export function hasClientContext(selectedFields: string[] = []): boolean {
  return selectedFields.length > 0 && 
         (selectedFields.includes('country') || selectedFields.includes('notes'))
}