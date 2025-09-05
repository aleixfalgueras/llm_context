import {Prisma} from "@prisma/client";
import {LlmMessageImage} from "@/lib/types/openrouter-types";

// Helper to safely parse images from Prisma JsonValue
export function parseMessageImages(images: Prisma.JsonValue | null | undefined): LlmMessageImage[] | undefined {
  if (!images) return undefined

  if (Array.isArray(images)) {
    return images as LlmMessageImage[]
  }

  return undefined

}