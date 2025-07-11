import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



// Capitalize each word in a name (proper case)
export function capitalizeName(name: string): string {
  if (!name) return name
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Generate chat title using client name and current date
export function generateChatTitleWithClient(clientName: string): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  return `${clientName} - ${dateStr}`
}
