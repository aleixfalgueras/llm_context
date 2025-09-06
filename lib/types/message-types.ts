import {Message, Prisma} from "@prisma/client";
import {ImageMessageContent} from "./openrouter-types";

// Message type with optional streaming state and properly typed images
export type MessageWithStreaming = Omit<Message, 'images'> & { 
  isStreaming?: boolean
  images?: ImageMessageContent[] | Prisma.JsonValue | null // Override Prisma's JsonValue type with our specific type
}

