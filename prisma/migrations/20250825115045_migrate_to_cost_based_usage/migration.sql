-- Migrate from token-based to cost-based usage tracking

-- UserUsage table: Replace tokens with cost
ALTER TABLE "user_usage" 
  DROP COLUMN IF EXISTS "tokensUsed",
  ADD COLUMN "cost_usd" DECIMAL(10,6) DEFAULT 0;

-- UserSubscription: Replace token limits with spending limits
ALTER TABLE "user_subscriptions" 
  DROP COLUMN IF EXISTS "tokenLimit",
  DROP COLUMN IF EXISTS "customTokenLimit",
  ADD COLUMN "spending_limit_usd" DECIMAL(10,2) DEFAULT 5.00,
  ADD COLUMN "custom_spending_limit_usd" DECIMAL(10,2);

-- Messages table: Replace token fields with cost
ALTER TABLE "messages" 
  DROP COLUMN IF EXISTS "tokensUsed",
  DROP COLUMN IF EXISTS "inputTokens",
  DROP COLUMN IF EXISTS "outputTokens",
  ADD COLUMN "cost_usd" DECIMAL(10,6) DEFAULT 0,
  ADD COLUMN "generation_id" VARCHAR(255);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "messages_generation_id_idx" ON "messages"("generation_id");
CREATE INDEX IF NOT EXISTS "user_usage_cost_usd_idx" ON "user_usage"("cost_usd");