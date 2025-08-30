export interface ClientContextSelection {
  country: boolean
  generalContext: boolean
  specificContext1: boolean
  specificContext2: boolean
  specificContext3: boolean
}

export const DEFAULT_CLIENT_CONTEXT: ClientContextSelection = {
  country: true,
  generalContext: true,
  specificContext1: false,
  specificContext2: false,
  specificContext3: false,
}

export const CLIENT_CONTEXT_VARIABLES = {
  country: "country",
  generalContext: "general_context",
  specificContext1: "specific_context_1",
  specificContext2: "specific_context_2",
  specificContext3: "specific_context_3"
} as const
