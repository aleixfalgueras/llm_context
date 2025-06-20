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
export function getLanguageRequirementSection(targetLanguage: string, contentType: 'diet' | 'workout' | 'blood-test' | 'meeting'): string {
  const typeSpecificGuidance = {
    'diet': 'Use appropriate nutritional terminology for this language\n- Consider cultural food preferences and dietary habits appropriate for this language/culture\n- Maintain professional language appropriate for health and nutrition content',
    'workout': 'Use appropriate fitness and exercise terminology for this language\n- Consider cultural fitness preferences and exercise traditions appropriate for this language/culture\n- Maintain professional language appropriate for fitness and health content',
    'blood-test': 'Use appropriate medical terminology for this language\n- Consider cultural health perspectives appropriate for this language/culture\n- Maintain professional medical language appropriate for health analysis content',
    'meeting': 'Use appropriate professional terminology for this language\n- Consider cultural communication styles appropriate for this language/culture\n- Maintain professional language appropriate for coaching and consultation content'
  }

  return `LANGUAGE REQUIREMENT:
- Generate the entire ${contentType === 'blood-test' ? 'blood test analysis report' : `${contentType} ${contentType === 'meeting' ? 'report' : 'plan'}`} in ${targetLanguage}
- ${typeSpecificGuidance[contentType]}`
} 