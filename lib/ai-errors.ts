/**
 * Custom error class for AI provider issues
 * This file can be safely imported by both client and server components
 */
export class AIProviderError extends Error {
  public readonly provider: string
  public readonly type: 'timeout' | 'rate_limit' | 'service_unavailable' | 'authentication' | 'quota_exceeded' | 'insufficient_credits' | 'invalid_model' | 'unknown'
  public readonly statusCode?: number
  public readonly retryAfter?: number

  constructor(
    message: string, 
    provider: string, 
    type: AIProviderError['type'], 
    statusCode?: number,
    retryAfter?: number
  ) {
    super(message)
    this.name = 'AIProviderError'
    this.provider = provider
    this.type = type
    this.statusCode = statusCode
    this.retryAfter = retryAfter
  }
}

/**
 * Utility function to create user-friendly error messages for different AI provider errors
 */
export function getAIErrorMessage(error: AIProviderError): { title: string; description: string } {
  const providerName = error.provider === 'openai' ? 'OpenAI' : 
                      'OpenRouter'
  
  switch (error.type) {
    case 'timeout':
      return {
        title: `${providerName} Service Timeout`,
        description: `The ${providerName} service is taking longer than expected to respond. This usually resolves within a few minutes. Please try again.`
      }
    case 'rate_limit':
      return {
        title: `${providerName} Rate Limit`,
        description: `Too many requests to ${providerName}. Please wait ${error.retryAfter ? `${Math.ceil(error.retryAfter / 1000)} seconds` : 'a moment'} before trying again.`
      }
    case 'service_unavailable':
      return {
        title: `${providerName} Service Unavailable`,
        description: `The ${providerName} service is temporarily unavailable. This is usually brief - please try again in a few minutes.`
      }
    case 'authentication':
      return {
        title: `${providerName} Authentication Error`,
        description: `There's an issue with the ${providerName} API configuration. Please contact support if this persists.`
      }
    case 'quota_exceeded':
      return {
        title: `${providerName} Quota Exceeded`,
        description: `The ${providerName} usage quota has been exceeded. Please try again later or contact support.`
      }
    case 'insufficient_credits':
      return {
        title: `${providerName} Insufficient Credits`,
        description: `Your ${providerName} account has insufficient credits. Please add more credits to continue using AI services.`
      }
    case 'invalid_model':
      return {
        title: `${providerName} Invalid Model`,
        description: `The specified AI model is not available or invalid. Please try selecting a different model.`
      }
    default:
      return {
        title: `${providerName} Service Error`,
        description: `The ${providerName} service encountered an unexpected error. Please try again, and if the problem persists, try switching to a different AI model.`
      }
  }
} 