/**
 * Utility functions for formatting and displaying costs
 */

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
  if (percentage >= 90) return 'text-red-600 dark:text-red-400';
  if (percentage >= 75) return 'text-orange-600 dark:text-orange-400';
  if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
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
    color: getUsageStatusColor(getUsagePercentage(used, limit))
  };
}