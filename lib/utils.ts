import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to generate a title from a user prompt
export function generateChatTitle(prompt: string): string {
  // Clean the prompt and truncate it for a title
  const cleaned = prompt.trim()
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
  
  // Truncate to reasonable title length (max 50 characters)
  if (cleaned.length <= 50) {
    return cleaned
  }
  
  // Find the last complete word within the limit
  const truncated = cleaned.substring(0, 47)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  if (lastSpaceIndex > 20) { // Ensure we don't make it too short
    return truncated.substring(0, lastSpaceIndex) + '...'
  }
  
  return truncated + '...'
}
