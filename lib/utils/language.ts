import { Language, LANGUAGE_INFO } from '@/types/enums'

// Helper function to get language instruction for AI providers
export function getLanguageInstruction(language: string): string {
  const langKey = language as Language
  return LANGUAGE_INFO[langKey]?.label || 'English'
}

// Helper to generate language requirement section for prompts
export function getLanguageRequirementSection(targetLanguage: string, contentType: 'meeting' | 'custom-document'): string {
  const typeSpecificGuidance = {
    'meeting': 'Use appropriate professional terminology for this language\n- Consider cultural communication styles appropriate for this language/culture\n- Maintain professional language appropriate for marketing consultation content',
    'custom-document': 'Use appropriate professional terminology for this language\n- Consider cultural communication styles appropriate for this language/culture\n- Maintain professional language suitable for business documents\n- Adapt formatting and structure conventions appropriate for this language/culture'
  }

  const contentLabel = contentType === 'meeting' ? 'meeting report' : 'document'

  return `LANGUAGE REQUIREMENT:
- Generate the entire ${contentLabel} in ${targetLanguage}
- ${typeSpecificGuidance[contentType]}`
} 