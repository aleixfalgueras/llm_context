import {
  AIModel,
  AVAILABLE_MODELS,
  DEFAULT_FREQUENCY_PENALTY,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_PRESENCE_PENALTY,
  DEFAULT_TEMPERATURE,
  ESSENTIAL_MODEL_IDS,
  MODEL_TIERS
} from '@/lib/models-config';
import {ModelTier, ModelTierType, SubscriptionPlanType} from "@/lib/types/subscription-types";
import {SubscriptionPlan} from "@prisma/client";

/**
 * Resolves a model ID to its display name
 * @param modelId - The model ID (e.g., "google/gemini-2.0-flash-001")
 * @returns The user-friendly display name (e.g., "Gemini 2.0") or the ID if not found
 */
export function getModelDisplayName(modelId: string | null | undefined): string {
  if (!modelId) {
    return '';
  }

  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  
  if (model) {
    return model.name;
  }

  // Fallback: return a simplified version of the ID
  // e.g., "google/gemini-2.0-flash-001" becomes "gemini-2.0-flash"
  const parts = modelId.split('/');
  if (parts.length > 1) {
    const modelName = parts[1].split('-').slice(0, -1).join('-');
    return modelName.charAt(0).toUpperCase() + modelName.slice(1);
  }

  return modelId;
}

/**
 * Get the default model, with optional environment override
 * Environment variable: OPENROUTER_DEFAULT_MODEL
 */
export function getDefaultModel(): string {
  return process.env.OPENROUTER_DEFAULT_MODEL || DEFAULT_MODEL
}

/**
 * Get the default temperature, with optional environment override
 */
export function getDefaultTemperature(): number {
  return parseFloat(process.env.OPENROUTER_TEMPERATURE || DEFAULT_TEMPERATURE.toString())
}

/**
 * Get the default max tokens - consistent limit across all AI providers
 */
export function getDefaultMaxTokens(): number {
  return DEFAULT_MAX_TOKENS
}

/**
 * Get the default presence penalty, with optional environment override
 */
export function getDefaultPresencePenalty(): number {
  return parseFloat(process.env.OPENROUTER_PRESENCE_PENALTY || DEFAULT_PRESENCE_PENALTY.toString())
}

/**
 * Get the default frequency penalty, with optional environment override
 */
export function getDefaultFrequencyPenalty(): number {
  return parseFloat(process.env.OPENROUTER_FREQUENCY_PENALTY || DEFAULT_FREQUENCY_PENALTY.toString())
}

/**
 * Get models available for a specific subscription tier
 */
export function getModelsByTier(tier: ModelTierType): AIModel[] {
  const tierModels = MODEL_TIERS[tier] || []
  return AVAILABLE_MODELS.filter(model => (tierModels as string[]).includes(model.id))
}

/**
 * Check if a model is available for a specific subscription tier
 */
export function isModelAvailableForTier(modelId: string, tier: ModelTierType): boolean {
  const tierModels = MODEL_TIERS[tier] || []
  return (tierModels as string[]).includes(modelId)
}

/**
 * Get subscription tier from plan name
 */
export function getTierFromPlan(plan: SubscriptionPlanType): ModelTierType {
  switch (plan) {
    case SubscriptionPlan.apprentice:
      return ModelTier.APPRENTICE
    case SubscriptionPlan.knight:
      return ModelTier.KNIGHT
    case SubscriptionPlan.master:
      return ModelTier.MASTER
    case SubscriptionPlan.jedi:
      return ModelTier.JEDI
    default:
      return ModelTier.APPRENTICE
  }
}

export const isEssentialModel = (modelId: string): boolean => {
  return (ESSENTIAL_MODEL_IDS as readonly string[]).includes(modelId)
}