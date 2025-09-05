import {Message, Prisma} from "@prisma/client";
import {LlmMessageImage} from "./openrouter-types";

// Message type with optional streaming state and properly typed images
export type MessageWithStreaming = Omit<Message, 'images'> & { 
  isStreaming?: boolean

  // Override Prisma's JsonValue type with our specific type
  images?: LlmMessageImage[] | Prisma.JsonValue | null
}

