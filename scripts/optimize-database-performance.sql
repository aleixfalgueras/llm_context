-- =============================================
-- DATABASE PERFORMANCE OPTIMIZATION SCRIPT
-- =============================================
-- This script creates essential indexes to optimize database performance
-- for the LLM Context application. All indexes are created with proper
-- error handling and can be run multiple times safely.

-- 1. USER-BASED FILTERING INDEXES
-- Most queries filter by userId, so these are critical

-- Chats: userId + createdAt (for recent chats)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_userid_createdat 
ON chats ("userId", "createdAt" DESC);

-- Messages: chatId + createdAt (for message ordering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chatid_createdat 
ON messages ("chatId", "createdAt" ASC);

-- Clients: userId + updatedAt (for recent clients)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_userid_updatedat 
ON clients ("userId", "updatedAt" DESC);

-- Documents: userId + createdAt (for recent documents)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_userid_createdat 
ON documents ("userId", "createdAt" DESC);

-- Documents: clientId + documentType (for client-specific documents)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_clientid_type 
ON documents ("clientId", "documentType");

-- Feedback: userId + createdAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_userid_createdat 
ON feedbacks ("userId", "createdAt" DESC);

-- Prompts: userId + category + isActive
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_userid_category_active 
ON prompts ("userId", "category", "isActive");

-- Prompts: userId + usageCount (for popular prompts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_userid_usagecount 
ON prompts ("userId", "usageCount" DESC);

-- 2. SUBSCRIPTION & USAGE TRACKING INDEXES
-- Critical for billing and plan enforcement

-- User Subscriptions: plan + status (for admin queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_plan_status 
ON user_subscriptions (plan, status);

-- User Subscriptions: currentPeriodEnd (for renewal processing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_period_end 
ON user_subscriptions ("currentPeriodEnd");

-- User Usage: userId + year + month (unique constraint already exists, but good for lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_usage_userid_year_month 
ON user_usage ("userId", year, month);

-- User Usage: year + month (for analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_usage_year_month 
ON user_usage (year, month);

-- User Usage: documentsGenerated (for analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_usage_documents_generated 
ON user_usage ("documentsGenerated" DESC);

-- User Usage: estimatedCost (for cost analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_usage_estimated_cost 
ON user_usage ("estimatedCost" DESC);

-- 3. CONSENT & COMPLIANCE INDEXES
-- For GDPR compliance and audit trails

-- User Consents: userId (already unique, but helps with lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_consents_userid 
ON user_consents ("userId");

-- User Consents: consentGivenAt (for audit reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_consents_given_at 
ON user_consents ("consentGivenAt" DESC);

-- Consent Audit Logs: userId + createdAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_audit_userid_createdat 
ON consent_audit_logs ("userId", "createdAt" DESC);

-- Consent Audit Logs: action + consentType (for compliance reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_audit_action_type 
ON consent_audit_logs (action, "consentType");

-- 4. ADMIN & ANALYTICS INDEXES
-- For dashboard and reporting queries

-- Feedbacks: type + priority (for admin dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_type_priority 
ON feedbacks (type, priority);

-- User Subscriptions: Stripe IDs (for webhook processing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_stripe_customer 
ON user_subscriptions ("stripeCustomerId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_stripe_subscription 
ON user_subscriptions ("stripeSubscriptionId");

-- 5. FOREIGN KEY OPTIMIZATION
-- Ensure all foreign key relationships are optimized

-- Messages: chatId (foreign key)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chatid 
ON messages ("chatId");

-- Chats: clientId (foreign key)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_clientid 
ON chats ("clientId");

-- Documents: clientId (foreign key)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_clientid 
ON documents ("clientId");

-- 6. PARTIAL INDEXES FOR COMMON FILTERS
-- These indexes only include rows that match common filter conditions

-- Active prompts only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_active_userid_category 
ON prompts ("userId", category) WHERE "isActive" = true;

-- Active subscriptions only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_active_userid 
ON user_subscriptions ("userId") WHERE status = 'active';

-- Non-withdrawn consents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_consents_active_userid 
ON user_consents ("userId") WHERE "withdrawnAt" IS NULL;

-- =============================================
-- END OF OPTIMIZATION SCRIPT
-- =============================================

-- ===================================================================
-- PERFORMANCE VERIFICATION QUERIES
-- ===================================================================
-- Run these queries after creating indexes to verify performance improvements
-- Use EXPLAIN ANALYZE to see execution plans

/*
-- Test key queries:

-- 1. User's active prompts ordered by usage
EXPLAIN ANALYZE 
SELECT * FROM prompts 
WHERE userId = 'user_xxx' AND isActive = true 
ORDER BY usageCount DESC, updatedAt DESC;

-- 2. Monthly usage lookup
EXPLAIN ANALYZE 
SELECT * FROM user_usage 
WHERE userId = 'user_xxx' AND year = 2024 AND month = 12;

-- 3. Client documents
EXPLAIN ANALYZE 
SELECT * FROM documents 
WHERE userId = 'user_xxx' AND clientId = 'client_xxx' 
ORDER BY createdAt DESC;

-- 4. Chat messages
EXPLAIN ANALYZE 
SELECT * FROM messages 
WHERE chatId = 'chat_xxx' 
ORDER BY createdAt ASC;

-- 5. Recent feedback
EXPLAIN ANALYZE 
SELECT * FROM feedbacks 
WHERE userId = 'user_xxx' 
ORDER BY createdAt DESC;

-- 6. Pending deletion requests
EXPLAIN ANALYZE 
SELECT * FROM data_export_requests 
WHERE userId = 'user_xxx' AND requestType = 'account_deletion' AND status = 'pending';
*/

-- ===================================================================
-- INDEX MAINTENANCE RECOMMENDATIONS
-- ===================================================================

-- 1. Monitor index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes ORDER BY idx_scan;

-- 2. Check for unused indexes:
-- SELECT schemaname, tablename, indexname, idx_scan 
-- FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- 3. Monitor table and index sizes:
-- SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
-- FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- ===================================================================
-- ADDITIONAL PERFORMANCE RECOMMENDATIONS
-- ===================================================================

-- 1. Connection Pooling: Ensure you're using connection pooling (PgBouncer recommended)
-- 2. Query Analysis: Regularly run EXPLAIN ANALYZE on slow queries
-- 3. VACUUM: Set up automatic VACUUM and ANALYZE on high-write tables
-- 4. Statistics: Ensure PostgreSQL statistics are up to date for query optimization
-- 5. Monitoring: Set up query performance monitoring (pg_stat_statements extension)

-- ===================================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- ===================================================================
-- To remove all indexes created by this script:

/*
DROP INDEX CONCURRENTLY IF EXISTS idx_clients_userid_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_documents_userid_clientid;
DROP INDEX CONCURRENTLY IF EXISTS idx_documents_userid_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_chats_userid_updatedat;
DROP INDEX CONCURRENTLY IF EXISTS idx_chats_userid_clientid;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_chatid_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_prompts_userid_active_usage;
DROP INDEX CONCURRENTLY IF EXISTS idx_prompts_userid_category_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_feedback_userid_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_usersubscriptions_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_usersubscriptions_plan;
DROP INDEX CONCURRENTLY IF EXISTS idx_userusage_year_month;
DROP INDEX CONCURRENTLY IF EXISTS idx_userusage_documentsgenerated;
DROP INDEX CONCURRENTLY IF EXISTS idx_userusage_estimatedcost;
DROP INDEX CONCURRENTLY IF EXISTS idx_consentaudit_userid_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_dataexport_userid_type_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_dataexport_status_expires;
DROP INDEX CONCURRENTLY IF EXISTS idx_dataexport_userid_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_usersubscriptions_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_feedback_type_priority_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_documents_documenttype_createdat;
DROP INDEX CONCURRENTLY IF EXISTS idx_chats_clientid;
DROP INDEX CONCURRENTLY IF EXISTS idx_documents_clientid;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_chatid;
DROP INDEX CONCURRENTLY IF EXISTS idx_prompts_active_userid_usage;
DROP INDEX CONCURRENTLY IF EXISTS idx_dataexport_pending_expires;
DROP INDEX CONCURRENTLY IF EXISTS idx_usersubscriptions_active_plan;
*/ 