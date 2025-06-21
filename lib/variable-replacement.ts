interface Client {
  name?: string | null
  medicalHistory?: string | null
  goals?: string | null
  height?: number | null
  weight?: number | null
  dateOfBirth?: string | Date | null
  country?: string | null
}

/**
 * Replaces client variables in content with actual client data
 * @param content - The content containing variables like {client_name}, {goals}, etc.
 * @param client - The client data object
 * @returns Content with variables replaced by actual client data
 */
export function replaceClientVariables(content: string, client: Client): string {
  if (!client) return content

  return content
    .replace(/\{client_name\}/g, client.name || '[Client Name]')
    .replace(/\{medical_history\}/g, client.medicalHistory || '[Medical History]')
    .replace(/\{goals\}/g, client.goals || '[Goals]')
    .replace(/\{height\}/g, client.height ? `${client.height}cm` : '[Height]')
    .replace(/\{weight\}/g, client.weight ? `${client.weight}kg` : '[Weight]')
    .replace(/\{age\}/g, client.dateOfBirth ? 
      `${Math.floor((Date.now() - new Date(client.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}` : '[Age]')
    .replace(/\{country\}/g, client.country || '[Country]')
}

/**
 * Get list of available client variables for documentation/UI
 */
export const CLIENT_VARIABLES = [
  '{client_name}',
  '{medical_history}',
  '{goals}',
  '{height}',
  '{weight}',
  '{age}',
  '{country}'
] as const 