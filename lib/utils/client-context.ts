import { ClientWithContext } from '@/lib/types/client'

type Client = ClientWithContext

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
  const shouldIncludeSpecificContext1 = selectedFields.includes('specific_context_1')
  const shouldIncludeSpecificContext2 = selectedFields.includes('specific_context_2')
  const shouldIncludeSpecificContext3 = selectedFields.includes('specific_context_3')

  // If no valid fields selected, return empty
  if (!shouldIncludeCountry && !shouldIncludeGeneralContext && !shouldIncludeSpecificContext1 && !shouldIncludeSpecificContext2 && !shouldIncludeSpecificContext3) {
    return ''
  }

  let contextSection = '\n\nCLIENT CONTEXT:'
  
  // Collect all selected context parts (excluding country)
  const contextParts = []
  
  if (shouldIncludeGeneralContext && client.generalContext) {
    contextParts.push(client.generalContext)
  }
  if (shouldIncludeSpecificContext1 && client.specificContext1) {
    contextParts.push(client.specificContext1)
  }
  if (shouldIncludeSpecificContext2 && client.specificContext2) {
    contextParts.push(client.specificContext2)
  }
  if (shouldIncludeSpecificContext3 && client.specificContext3) {
    contextParts.push(client.specificContext3)
  }
  
  // Build the context line based on whether country is selected
  if (shouldIncludeCountry && client.country) {
    // Country selected: "Country: [country] [other contexts...]"
    contextSection += `\nCountry: ${client.country}`
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
         (selectedFields.includes('country') || 
          selectedFields.includes('general_context') || 
          selectedFields.includes('specific_context_1') || 
          selectedFields.includes('specific_context_2') || 
          selectedFields.includes('specific_context_3'))
}