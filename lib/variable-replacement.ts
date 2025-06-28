import { ClientWithContext } from '@/types/client'

type Client = ClientWithContext

/**
 * Replaces client variables in content with actual client data
 * @param content - The content containing variables like {country}, {general_context}, {specific_context_1}, etc.
 * @param client - The client data to use for replacement
 * @returns The content with variables replaced
 */
export function replaceClientVariables(content: string, client: Client): string {
  return content
    .replace(/\{country\}/g, client.country || '[Country]')
    .replace(/\{general_context\}/g, client.generalContext || '[General Context]')
    .replace(/\{specific_context_1\}/g, client.specifiContext1 || '[Specific Context 1]')
    .replace(/\{specific_context_2\}/g, client.specifiContext2 || '[Specific Context 2]')
    .replace(/\{specific_context_3\}/g, client.specifiContext3 || '[Specific Context 3]')
}

/**
 * Get list of available client variables for display in UI
 */
export function getAvailableVariables(): string[] {
  return [
    '{country}',
    '{general_context}',
    '{specific_context_1}',
    '{specific_context_2}',
    '{specific_context_3}',
  ]
} 