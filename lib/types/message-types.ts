import {Message} from "@prisma/client";

// Message type with optional streaming state for UI components
export type MessageWithStreaming = Message & { isStreaming?: boolean }
