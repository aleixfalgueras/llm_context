/**
 * Utility functions for formatting and displaying costs
 */


// Colors

const red = "red-600"
const red_dark = "red-400"
const orange = "orange-600"
const orange_dark = "orange-400"
const yellow = "yellow-600"
const yellow_dark = "yellow-400"
const green = "green-600"
const green_dark = "green-400"

/**
 * Format cost in USD with appropriate precision
 * @param costUsd - The cost in USD
 * @returns Formatted cost string with currency symbol
 */
export function formatCost(costUsd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(costUsd);
}

/**
 * Calculate remaining budget
 * @param used - Amount already used
 * @param limit - Total limit
 * @returns Remaining budget as formatted string
 */
export function getRemainingBudget(used: number, limit: number): string {
  const remaining = Math.max(0, limit - used);
  return formatCost(remaining);
}

/**
 * Calculate usage percentage
 * @param used - Amount already used
 * @param limit - Total limit
 * @returns Percentage as number (0-100)
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Get usage status color based on percentage
 * @param percentage - Usage percentage (0-100)
 * @returns Tailwind color class
 */
export function getUsageStatusColor(percentage: number): string {
  if (percentage >= 90) return `text-${red} dark:text-${red_dark}`;
  if (percentage >= 80) return `text-${orange} dark:text-${orange_dark}`;
  if (percentage >= 70) return `text-${yellow} dark:text-${yellow_dark}`;
  return `text-${green} dark:text-${green_dark}`;
}

/**
 * Get usage status background color based on percentage
 * @param percentage - Usage percentage (0-100)
 * @returns Tailwind color class
 */
export function getUsageStatusBgColor(percentage: number): string {
  if (percentage >= 90) return `bg-${red} dark:bg-${red_dark}`;
  if (percentage >= 80) return `bg-${orange} dark:bg-${orange_dark}`;
  if (percentage >= 70) return `bg-${yellow} dark:bg-${yellow_dark}`;
  return `bg-${green} dark:bg-${green_dark}`;
}

/**
 * Format usage display with cost and limit
 * @param used - Amount already used
 * @param limit - Total limit
 * @returns Object with formatted values
 */
export function formatUsageDisplay(used: number, limit: number) {
  return {
    used: formatCost(used),
    limit: formatCost(limit),
    remaining: getRemainingBudget(used, limit),
    percentage: getUsagePercentage(used, limit),
    color: getUsageStatusColor(getUsagePercentage(used, limit)),
    bgColor: getUsageStatusBgColor(getUsagePercentage(used, limit))
  };
}