import { TranslationFunction } from '@/lib/translations'
import { CLIENT_CONTEXT_VARIABLES } from '@/lib/types/client-types'

/**
 * Client Context Utility Functions
 * 
 * Note: These functions accept a TranslationFunction parameter instead of calling
 * getTranslations directly because they are used in both:
 * - Client components (using useTranslations hook - synchronous)
 * - Server services (using getTranslations - asynchronous)
 * 
 * This design allows the utilities to work in both contexts without forcing
 * everything to be async, which would break client-side usage.
 */

/**
 * Get all client context fields with translated labels
 */
export function getClientContextFields(t: TranslationFunction): Record<string, string> {
  return {
    country: t('clientContext.fields.country'),
    generalContext: t('clientContext.fields.generalContext'),
    specificContext1: t('clientContext.fields.specificContext1'),
    specificContext2: t('clientContext.fields.specificContext2'),
    specificContext3: t('clientContext.fields.specificContext3')
  }
}

/**
 * Get all available client context variables with translated descriptions
 */
export function getAvailableContextVariables(t: TranslationFunction): Array<{
  variable: string
  description: string
}> {
  return Object.entries(CLIENT_CONTEXT_VARIABLES).map(([field, variable]) => ({
    variable: `{${variable}}`,
    description: t(`clientContext.descriptions.${field}`)
  }))
}