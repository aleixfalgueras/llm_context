/**
 * Shared interface for client context selection across AI services
 * Allows users to choose which client information to include in AI generation
 */
export interface ClientContextSelection {
  age: boolean
  height: boolean
  weight: boolean
  country: boolean
  goals: boolean
  medicalHistory: boolean
  notes: boolean
}

/**
 * Default client context selections for different service types
 */
export const defaultClientContextSelections = {
  // For fitness-related services (diet, workout)
  fitness: {
    age: true,
    height: true,
    weight: true,
    country: true,
    goals: true,
    medicalHistory: true,
    notes: true
  } as ClientContextSelection,

  // For medical analysis (blood test, medical history)
  medical: {
    age: true,
    height: true,
    weight: true,
    country: true,
    goals: false, // Typically excluded for medical objectivity
    medicalHistory: true,
    notes: true
  } as ClientContextSelection,

  // For general services (meeting reports, etc.)
  general: {
    age: true,
    height: true,
    weight: true,
    country: true,
    goals: true,
    medicalHistory: true,
    notes: true
  } as ClientContextSelection
} 