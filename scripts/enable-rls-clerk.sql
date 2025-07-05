-- Enable Row Level Security for Clerk Authentication
-- This script should be run on your production database
-- Since you use Clerk (not Supabase Auth), we need different policies

-- Enable RLS on all tables
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Prisma migrations table (system table) - block all access via API
ALTER TABLE _prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Since you use Clerk + server-side Prisma (not direct Supabase client calls),
-- you have to:

-- Allow all operations for authenticated users (service role)
CREATE POLICY "Allow service role access" ON chats FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON messages FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON clients FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON documents FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON feedbacks FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON prompts FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON user_subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON user_usage FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON user_consents FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON consent_audit_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role access" ON data_export_requests FOR ALL TO service_role USING (true);

-- Block all access to prisma migrations via API
CREATE POLICY "Block all access to migrations" ON _prisma_migrations FOR ALL USING (false);

-- Block anonymous access to all tables
CREATE POLICY "Block anonymous access" ON chats FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON messages FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON clients FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON documents FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON feedbacks FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON prompts FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON user_subscriptions FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON user_usage FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON user_consents FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON consent_audit_logs FOR ALL TO anon USING (false);
CREATE POLICY "Block anonymous access" ON data_export_requests FOR ALL TO anon USING (false); 

-- verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- verify policies are created
SELECT schemaname, tablename, policyname, roles 
FROM pg_policies 
WHERE schemaname = 'public';