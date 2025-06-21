interface Client {
  name?: string | null
  country?: string | null
  notes?: string | null
}

interface ContextOptions {
  includeNotes?: boolean
  contextType?: 'chat' | 'meeting'
  additionalInstructions?: string
}

/**
 * Builds a system prompt with client context for AI interactions
 */
export function buildClientContext(client: Client, options: ContextOptions = {}): string {
  const { includeNotes = true, contextType = 'chat', additionalInstructions } = options

  let systemPrompt = `You are a professional AI assistant helping a marketing service provider with their client. You have access to the following client information and should use it to provide personalized, relevant advice and responses for content creation and marketing strategies.`

  // Add client profile section
  let profileSection = ''
  if (client.country) {
    profileSection += `\nCountry: ${client.country}`
  }

  if (profileSection) {
    systemPrompt += `\n\nCLIENT PROFILE:${profileSection}`
  }

  // Add notes section (if enabled and available)
  let notesSection = ''
  if (includeNotes && client.notes) {
    notesSection = `\n\nADDITIONAL NOTES:\n${client.notes}`
  }

  // Add context-specific instructions
  const contextInstructions = contextType === 'meeting' 
    ? `\n\nINSTRUCTIONS:\n- Use this client information to personalize your responses for meeting documentation and follow-up\n- Reference their specific circumstances when relevant\n- Be professional and objective\n- Focus on actionable next steps and clear documentation\n- Maintain confidentiality and professionalism at all times`
    : `\n\nINSTRUCTIONS:\n- Use this client information to personalize your responses for content creation and marketing strategies\n- Reference their specific circumstances when relevant\n- Be professional, creative, and supportive\n- Provide actionable advice tailored to their marketing and content needs\n- Focus on content creation, social media strategies, and marketing campaigns\n- Maintain confidentiality and professionalism at all times`

  // Combine all sections
  const fullPrompt = `${systemPrompt}${notesSection}${contextInstructions}${additionalInstructions ? `\n\nADDITIONAL CONTEXT:\n${additionalInstructions}` : ''}\n\nRespond naturally and conversationally while keeping this context in mind.`

  return fullPrompt
}

/**
 * Default context options for different use cases
 */
export const defaultContextOptions = {
  general: {
    includeNotes: true
  },
  meeting: {
    includeNotes: false
  }
}

export function buildChatSystemPrompt(client: Client): string {
  return buildClientContext(client, { 
    contextType: 'chat', 
    includeNotes: true 
  })
}

 