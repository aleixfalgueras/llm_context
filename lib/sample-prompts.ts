import {getTranslations, type Locale} from '@/lib/translations'
import {SamplePrompt} from "@/lib/types/prompt-types";
import {PromptCategory} from '@prisma/client';

export async function getSamplePrompts(locale?: Locale): Promise<SamplePrompt[]> {
  const t = await getTranslations('prompts', locale)
  
  return [
    {
      id: 'sample-1',
      name: t('samplePrompts.1.name'),
      description: t('samplePrompts.1.description'),
      content: t('samplePrompts.1.content'),
      category: PromptCategory.marketing,
      isActive: true,
      usageCount: 0,
      isSample: true,
    },
    {
      id: 'sample-2',
      name: t('samplePrompts.2.name'),
      description: t('samplePrompts.2.description'),
      content: t('samplePrompts.2.content'),
      category: PromptCategory.content,
      isActive: true,
      usageCount: 0,
      isSample: true,
    },
    {
      id: 'sample-3',
      name: t('samplePrompts.3.name'),
      description: t('samplePrompts.3.description'),
      content: t('samplePrompts.3.content'),
      category: PromptCategory.general,
      isActive: true,
      usageCount: 0,
      isSample: true,
    },
    {
      id: 'sample-4',
      name: t('samplePrompts.4.name'),
      description: t('samplePrompts.4.description'),
      content: t('samplePrompts.4.content'),
      category: PromptCategory.analysis,
      isActive: true,
      usageCount: 0,
      isSample: true,
    },
    {
      id: 'sample-5',
      name: t('samplePrompts.5.name'),
      description: t('samplePrompts.5.description'),
      content: t('samplePrompts.5.content'),
      category: PromptCategory.analysis,
      isActive: true,
      usageCount: 0,
      isSample: true,
    },
    {
      id: 'sample-6',
      name: t('samplePrompts.6.name'),
      description: t('samplePrompts.6.description'),
      content: t('samplePrompts.6.content'),
      category: PromptCategory.marketing,
      isActive: true,
      usageCount: 0,
      isSample: true,
    }
  ]
}

// Legacy export for backward compatibility - uses English by default
export const samplePrompts: SamplePrompt[] = []

export async function getSamplePromptsByCategory(category?: string, locale?: Locale): Promise<SamplePrompt[]> {
  const prompts = await getSamplePrompts(locale)
  
  if (!category || category === 'all') {
    return prompts
  }
  return prompts.filter(prompt => prompt.category === category)
}
