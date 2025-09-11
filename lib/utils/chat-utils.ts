import {Prisma} from "@prisma/client";
import {ImageMessageContent} from "@/lib/types/openrouter-types";

// Helper to safely parse images from Prisma JsonValue
export function parseMessageImages(images: Prisma.JsonValue | null | undefined): ImageMessageContent[] | undefined {
  if (!images) return undefined

  if (Array.isArray(images)) {
    return images as ImageMessageContent[]
  }

  return undefined

}