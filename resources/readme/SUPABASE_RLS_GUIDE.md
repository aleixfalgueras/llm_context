# Row Level Security (RLS) Setup Guide

## Your Architecture & Security Model

Based on your codebase analysis:

### Current Setup ✅
- **Authentication**: Clerk (not Supabase Auth)
- **Database Access**: Server-side Prisma with service role key
- **API Security**: Application-level authentication via Clerk middleware
- **Data Storage**: Supabase PostgreSQL + Storage
- **Client Architecture**: No client-side Supabase calls (everything server-side)

### Security Layers
1. **Application Layer**: Clerk authentication + middleware
2. **API Layer**: Server-side validation in route handlers
3. **Database Layer**: ⚠️ **Missing RLS policies** (this is what needs fixing)

## The Solution

Since you use **Clerk + server-side Prisma** (not direct Supabase client calls), you need RLS policies that work with this architecture.

### Step 1: Run the RLS Setup Script

Execute the SQL script `scripts/enable-rls-clerk.sql` for all  your databases, this script will:
1. **Enable RLS on all tables** (including `_prisma_migrations`)
2. **Allow service role access** (for your Prisma server-side calls)
3. **Block anonymous access** (prevent unauthorized API calls)
4. **Secure the migrations table** (system table should not be accessible)

### Step 2: Apply the Script

You can apply this script through:

1. Go to your production project in Supabase Dashboard
2. Navigate to **SQL Editor**
3. Paste the contents of `scripts/enable-rls-clerk.sql`
4. Execute the script

## Security Model Explanation

### Why This Approach Works

1. **Service Role Access**: Your Prisma client uses the service role key, which bypasses RLS for server-side operations
2. **Anonymous Blocking**: Prevents direct API access without authentication
3. **Application-Level Security**: Your Clerk middleware still enforces user-specific access
4. **Defense in Depth**: Adds database-level security as a backup
5. **No Client-Side Exposure**: Since you removed the anon key, there's no way for client-side code to access the database directly

### Benefits of Removing the Anon Key

1. **Reduced Attack Surface**: No way for malicious client-side code to attempt database access
2. **Cleaner Architecture**: Clearly separates client and server responsibilities  
3. **Simpler Security Model**: All database access goes through authenticated server routes
4. **Better Performance**: No unnecessary client creation

## Troubleshooting

### If your app breaks after enabling RLS:

1. **Check your service role key** is correctly configured in `SUPABASE_KEY`
2. **Verify policies are applied** using the SQL queries above
3. **Review error logs** for permission denied errors

## Maintenance

- **New tables**: Remember to enable RLS and create policies
- **Schema changes**: Update policies if you change table structure
- **Regular audits**: Periodically review your RLS policies

## Security Best Practices

1. ✅ **Enable RLS on all public tables**
2. ✅ **Use service role for server-side operations only**
3. ✅ **Block anonymous access by default**
4. ✅ **Remove unused client-side database access**
5. ✅ **Implement application-level authentication**
6. ✅ **Regular security audits**
7. ✅ **Monitor for unauthorized access attempts** 