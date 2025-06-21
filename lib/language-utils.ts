// Helper function to get language instruction for OpenAI
export function getLanguageInstruction(language: string): string {
  const languageMap: Record<string, string> = {
    'english': 'English',
    'spanish': 'Spanish (Español)',
    'french': 'French (Français)',
    'german': 'German (Deutsch)',
    'italian': 'Italian (Italiano)',
    'portuguese': 'Portuguese (Português)',
    'dutch': 'Dutch (Nederlands)',
    'polish': 'Polish (Polski)',
    'russian': 'Russian (Русский)',
    'catalan': 'Catalan (Català)',
  }
  
  return languageMap[language] || 'English'
}

// Helper to generate language requirement section for prompts
export function getLanguageRequirementSection(targetLanguage: string, contentType: 'meeting'): string {
  const typeSpecificGuidance = {
    'meeting': 'Use appropriate professional terminology for this language\n- Consider cultural communication styles appropriate for this language/culture\n- Maintain professional language appropriate for marketing consultation content'
  }

  return `LANGUAGE REQUIREMENT:
- Generate the entire ${contentType} report in ${targetLanguage}
- ${typeSpecificGuidance[contentType]}`
} 