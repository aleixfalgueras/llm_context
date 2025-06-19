export interface ClientData {
  id: string
  name: string
  dateOfBirth?: string | Date | null
  height?: number | null
  weight?: number | null
  country?: string | null
  goals?: string | null
  medicalHistory?: string | null
  notes?: string | null
}

export interface ClientContextOptions {
  includeGoals?: boolean
  contextType?: 'chat' | 'diet' | 'workout' | 'blood-test'
  additionalInstructions?: string
}

export function buildClientContext(
  client: ClientData,
  options: ClientContextOptions = {}
): string {
  const { includeGoals = true, contextType = 'chat', additionalInstructions } = options

  // Calculate age if date of birth is available
  const clientAge = client.dateOfBirth 
    ? Math.floor((new Date().getTime() - new Date(client.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null

  // Build the base context based on type
  let basePrompt = ''
  
  switch (contextType) {
    case 'chat':
      basePrompt = 'You are a professional AI assistant helping a coach/consultant with their client. You have access to the following client information and should use it to provide personalized, relevant advice and responses.'
      break
    case 'diet':
    case 'workout':
      basePrompt = 'You are a professional AI assistant helping a coach/consultant with their client. You have access to the following client information and should use it to provide personalized, relevant advice and responses.'
      break
    case 'blood-test':
      basePrompt = 'You are a professional health analyst helping a coach/consultant analyze their client\'s blood test results. You have access to the following client information and extracted blood test data.'
      break
  }

  // Build client profile section
  let clientProfile = 'CLIENT PROFILE:'
  
  if (clientAge) {
    clientProfile += `\nAge: ${clientAge} years old`
  }
  
  if (client.height) {
    clientProfile += `\nHeight: ${client.height}cm`
  }
  
  if (client.weight) {
    clientProfile += `\nWeight: ${client.weight}kg`
  }
  
  if (client.country) {
    clientProfile += `\nCountry: ${client.country}`
  }

  // Add goals section (if enabled and available)
  let goalsSection = ''
  if (includeGoals && client.goals) {
    goalsSection = `\n\nGOALS:\n${client.goals}`
  }

  // Add medical history section
  let medicalSection = ''
  if (client.medicalHistory) {
    medicalSection = `\n\nMEDICAL HISTORY:\n${client.medicalHistory}`
  }

  // Add notes section
  let notesSection = ''
  if (client.notes) {
    notesSection = `\n\nADDITIONAL NOTES:\n${client.notes}`
  }

  // Build instructions section based on context type
  let instructions = ''
  
  switch (contextType) {
    case 'chat':
      instructions = `
INSTRUCTIONS:
- Use this client information to personalize your responses
- Reference their specific goals and circumstances when relevant
- Be professional, empathetic, and supportive
- Provide actionable advice tailored to their profile
- If medical advice is requested, remind them to consult with healthcare professionals
- Maintain confidentiality and professionalism at all times
- Never reference the client by name or any personally identifiable information

Respond naturally and conversationally while keeping this context in mind.`
      break
      
    case 'diet':
    case 'workout':
      instructions = `
INSTRUCTIONS:
- Create a comprehensive, personalized ${contextType} plan for this client
- Use the client's profile information to tailor recommendations
- Structure the ${contextType} plan in a clear, professional format
- Consider their${includeGoals && client.goals ? ' goals,' : ''} medical history, and personal circumstances
- Provide the response in markdown format for easy reading
- DO NOT include any suggestions about consulting healthcare professionals
- DO NOT include any disclaimers or OpenAI-related content
- Provide ONLY the ${contextType} plan content in a delivery-ready format
- Make it actionable and specific to this client's needs`
      break
      
    case 'blood-test':
      instructions = `
INSTRUCTIONS:
Create a comprehensive blood test analysis report that includes:

1. **Executive Summary**: Overall health status and key findings
2. **Parameter Analysis**: Detailed analysis of each parameter, especially those outside normal ranges
3. **Health Insights**: What the results indicate about the client's health
4. **Risk Assessment**: Any potential health risks or concerns identified
5. **Recommendations**: 
   - Lifestyle modifications
   - Dietary suggestions
   - Exercise recommendations
   - Follow-up testing if needed
6. **Action Plan**: Specific, actionable steps the client should take

IMPORTANT GUIDELINES:
- Use the client's profile information to personalize recommendations
- Consider their medical history and current health status
- Focus on practical, actionable advice
- Highlight any abnormal values and explain their significance
- Provide context for why certain parameters matter
- Structure the report in a clear, professional format using markdown
- DO NOT provide medical diagnoses or treatment recommendations
- DO NOT suggest specific medications
- Always recommend consulting healthcare professionals for medical concerns
- Make recommendations appropriate for a fitness/wellness coaching context
- Base recommendations purely on health optimization, not specific fitness goals

Provide the response in markdown format for easy reading and professional presentation.`
      break
  }

  // Combine all sections
  const fullContext = [
    basePrompt,
    clientProfile,
    goalsSection,
    medicalSection,
    notesSection,
    instructions,
    additionalInstructions || ''
  ].filter(section => section.trim()).join('')

  return fullContext
}

export function buildChatSystemPrompt(client: ClientData): string {
  return buildClientContext(client, { 
    contextType: 'chat', 
    includeGoals: true 
  })
}

export function buildDietGenerationPrompt(
  client: ClientData, 
  includeGoals: boolean = true,
  additionalInfo?: string
): string {
  return buildClientContext(client, { 
    contextType: 'diet', 
    includeGoals,
    additionalInstructions: additionalInfo 
  })
}

export function buildWorkoutGenerationPrompt(
  client: ClientData, 
  includeGoals: boolean = true,
  additionalInfo?: string
): string {
  return buildClientContext(client, { 
    contextType: 'workout', 
    includeGoals,
    additionalInstructions: additionalInfo 
  })
}

export function buildBloodTestAnalysisPrompt(
  client: ClientData,
  additionalInfo?: string
): string {
  return buildClientContext(client, { 
    contextType: 'blood-test', 
    includeGoals: false, // Blood test analysis never includes goals for medical objectivity
    additionalInstructions: additionalInfo 
  })
} 