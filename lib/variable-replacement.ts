interface Client {
  name?: string | null
  country?: string | null
  notes?: string | null
}

/**
 * Replaces client variables in content with actual client data
 * @param content - The content containing variables like {client_name}, {country}, etc.
 * @param client - The client data to use for replacement
 * @returns The content with variables replaced
 */
export function replaceClientVariables(content: string, client: Client): string {
  return content
    .replace(/\{client_name\}/g, client.name || '[Client Name]')
    .replace(/\{country\}/g, client.country || '[Country]')
}

/**
 * Get list of available client variables for display in UI
 */
export function getAvailableVariables(): string[] {
  return [
    '{client_name}',
    '{country}',
  ]
} 