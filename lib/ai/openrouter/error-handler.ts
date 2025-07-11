/**
 * OpenRouter-specific error handling
 */

import { AIProviderError } from '../errors'

/**
 * Enhanced error handling for OpenRouter API errors
 */
export function handleOpenRouterError(error: any): never {
  if (error.name === 'OpenAIError' || error.constructor?.name === 'OpenAIError') {
    // Handle OpenRouter-specific errors (they use OpenAI format)
    const status = error.status || error.statusCode
    
    if (status === 429) {
      const retryAfter = error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) * 1000 : undefined
      throw new AIProviderError(
        `Rate limit exceeded. Please wait ${retryAfter ? Math.ceil(retryAfter / 1000) + ' seconds' : 'a moment'} before trying again`,
        'openrouter',
        'rate_limit',
        status,
        retryAfter
      )
    }
    
    if (status === 401) {
      throw new AIProviderError(
        'Authentication failed - Invalid API key or expired token',
        'openrouter',
        'authentication',
        status
      )
    }
    
    if (status === 402) {
      throw new AIProviderError(
        'Insufficient quota - You have exceeded your current quota or credits',
        'openrouter',
        'quota_exceeded',
        status
      )
    }
    
    if (status === 403) {
      throw new AIProviderError(
        'Permission denied - You do not have permission to access this resource',
        'openrouter',
        'authentication',
        status
      )
    }
    
    if (status === 404) {
      throw new AIProviderError(
        'Resource not found - The requested model or endpoint was not found',
        'openrouter',
        'invalid_model',
        status
      )
    }
    
    if (status >= 500) {
      throw new AIProviderError(
        'Server error - OpenRouter is experiencing technical difficulties',
        'openrouter',
        'service_unavailable',
        status,
        5000
      )
    }
    
    // Generic OpenAI error
    throw new AIProviderError(
      error.message || 'An error occurred with the OpenRouter API',
      'openrouter',
      'unknown',
      status
    )
  }
  
  // Network or other errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    throw new AIProviderError(
      'Network error - Unable to connect to OpenRouter. Please check your internet connection.',
      'openrouter',
      'timeout'
    )
  }
  
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    throw new AIProviderError(
      'Connection timeout - The request to OpenRouter timed out. Please try again.',
      'openrouter',
      'timeout',
      undefined,
      3000
    )
  }
  
  // Unknown error
  throw new AIProviderError(
    'Unknown error - An unexpected error occurred',
    'openrouter',
    'unknown'
  )
}