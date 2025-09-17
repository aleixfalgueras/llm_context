-- Fix spending limits for annual subscriptions
-- Annual subscriptions should have 12x the monthly spending limit

-- Update spending limits for annual subscriptions
-- Multiply the current spending_limit_usd by 12 for all annual subscriptions
-- that don't have a custom_spending_limit_usd set
UPDATE "user_subscriptions"
SET "spending_limit_usd" = "spending_limit_usd" * 12
WHERE "billingInterval" = 'annual'
  AND "custom_spending_limit_usd" IS NULL;