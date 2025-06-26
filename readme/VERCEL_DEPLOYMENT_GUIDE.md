# 🚀 Vercel Deployment Guide

This guide covers everything you need to do before deploying your LLM Context application to Vercel.

## 📋 Pre-Deployment Checklist

### 🔐 1. Environment Variables Setup

Configure these environment variables in your Vercel project dashboard:

#### **Database Configuration**
```env
DATABASE_URL="your_production_supabase_database_url"
DIRECT_URL="your_supabase_direct_connection_url"
```

#### **Supabase Storage**
```env
SUPABASE_URL="your_supabase_project_url"
SUPABASE_KEY="your_supabase_service_role_key"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_KEY="your_supabase_anon_key"
SUPABASE_DOCUMENTS_BUCKET="documents"  # Optional, defaults to 'documents'
```

#### **Authentication (Clerk)**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
```

#### **OpenAI Configuration**
```env
OPENAI_API_KEY="your_openai_api_key"
```

#### **Optional OpenAI Overrides**
```env
# Optional - Override default model (defaults to 'gpt-4o-mini')
OPENAI_API_DEFAULT_MODEL="gpt-4o-mini"

# Optional - Override generation parameters
OPENAI_TEMPERATURE="0.7"
OPENAI_MAX_TOKENS="1000"
OPENAI_PRESENCE_PENALTY="0.1"
OPENAI_FREQUENCY_PENALTY="0.1"
```

### 🗄️ 2. Database Setup

#### **Production Database**
1. **Set up production PostgreSQL database** (Supabase recommended)
2. **Configure connection pooling** for better performance
3. **Database migrations** will be handled automatically by the `vercel-build` script

#### **Prisma Configuration**
✅ **Already optimized for Vercel:**
- Connection pooling enabled with `pgbouncer=true&connection_limit=1`
- Proper environment variable usage
- Automatic migration deployment

### 📁 3. Supabase Storage Setup

**After deployment, run the storage setup script:**
```bash
# For production environment
node scripts/setup-supabase-storage.js .env.production

# For development environment  
node scripts/setup-supabase-storage.js .env.development
```

**This script will:**
- Create the `documents` storage bucket

### ⚙️ 4. Build Configuration

✅ **Already configured correctly:**

#### **package.json scripts:**
```json
{
  "scripts": {
    "vercel-build": "npx prisma migrate deploy && npx prisma generate && next build"
  }
}
```

#### **next.config.mjs optimizations:**
- `output: 'standalone'` for Vercel optimization
- Server actions with 8MB body size limit
- Image optimization configured
- Production optimizations enabled

#### **vercel.json configuration:**
- Function timeouts set appropriately
- Regional deployment configured
- Framework detection enabled

### 🔒 5. Security & Authentication

#### **Clerk Setup**
1. **Configure Clerk application** for production environment
2. **Update allowed domains/URLs** in Clerk dashboard
3. **Set up proper redirects** for sign-in/sign-up flows
4. **Configure webhook endpoints** if using Clerk webhooks

#### **Middleware Configuration**
✅ **Already configured:**
- Authentication protection for protected routes
- Public routes properly defined
- Error handling and logging implemented

### 📊 6. Monitoring & Analytics (Optional)

Consider adding these for production monitoring:

```env
# Error Tracking
SENTRY_DSN="your_sentry_dsn"

# Analytics
NEXT_PUBLIC_GA_ID="your_google_analytics_id"

# Uptime Monitoring
UPTIMEROBOT_API_KEY="your_uptimerobot_key"
```

## 🚀 Deployment Steps

### Step 1: Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel
1. **Sign in to Vercel dashboard**
2. **Import your repository**
3. **Select your Git provider** (GitHub, GitLab, Bitbucket)
4. **Choose the repository**

### Step 3: Configure Project Settings
1. **Framework Preset:** Next.js (auto-detected)
2. **Build Command:** `npm run vercel-build` (auto-configured)
3. **Output Directory:** `.next` (auto-configured)
4. **Install Command:** `npm install` (auto-configured)

### Step 4: Set Environment Variables
Copy all environment variables from your local `.env.local` to Vercel:

1. **Go to Project Settings → Environment Variables**
2. **Add each variable** from the list above
3. **Set appropriate environments** (Production, Preview, Development)

### Step 5: Deploy
1. **Click "Deploy"**
2. **Monitor build logs** for any issues
3. **Wait for deployment completion**

### Step 6: Post-Deployment Setup
```bash
# If needed, run storage setup script
# (Can be done via Vercel CLI or directly on your production database)
node scripts/setup-supabase-storage.js .env.production
```

## ✅ Post-Deployment Testing

Test these critical features after deployment:

### Authentication
- [ ] User sign-up flow
- [ ] User sign-in flow
- [ ] Protected route access
- [ ] Sign-out functionality

### Core Functionality
- [ ] Client creation and management
- [ ] Document generation and storage
- [ ] Chat functionality with OpenAI
- [ ] File upload and download
- [ ] Document preview and editing

### Usage Tracking
- [ ] Subscription limits enforcement
- [ ] Usage tracking accuracy
- [ ] Cost calculation
- [ ] Upgrade prompts

### Storage & Database
- [ ] Document storage in Supabase
- [ ] Database operations
- [ ] File permissions and access control

## 🛠️ Troubleshooting

### Common Issues

#### **Database Connection Issues**
```bash
# Check if migrations ran successfully
npx prisma migrate status

# If migrations failed, run manually
npx prisma migrate deploy
```

#### **Environment Variables**
- Ensure all required variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Verify API keys are valid and have proper permissions

#### **OpenAI API Issues**
- Verify API key has sufficient credits
- Check rate limits and usage quotas
- Monitor OpenAI API status

#### **Supabase Storage Issues**
```bash
# Re-run storage setup if needed
node scripts/setup-supabase-storage.js .env.production
```

#### **Build Failures**
- Check build logs in Vercel dashboard
- Ensure all dependencies are properly installed
- Verify TypeScript compilation passes

### Debug Commands
```bash
# Check Prisma client generation
npx prisma generate

# Validate schema
npx prisma validate

# Check database connection
npx prisma db pull --preview-feature
```

## 🔍 Monitoring & Maintenance

### Performance Monitoring
- Monitor Vercel function execution times
- Track OpenAI API response times
- Monitor database query performance

### Cost Monitoring
- Set up OpenAI usage alerts
- Monitor Vercel function usage
- Track Supabase storage and bandwidth

### Security Monitoring
- Regular security audits
- Monitor authentication logs
- Check for unusual usage patterns

## 📈 Scaling Considerations

### Database Optimization
- Implement database indexes for common queries
- Consider read replicas for high traffic
- Monitor connection pool usage

### CDN & Caching
- Utilize Vercel's Edge Network
- Implement proper caching headers
- Consider static asset optimization

### API Rate Limiting
- Implement API rate limiting
- Monitor and adjust OpenAI usage
- Consider implementing request queuing

## 🎯 Production Best Practices

### Security
- Enable HTTPS only
- Implement proper CORS policies
- Regular security updates
- Monitor for vulnerabilities

### Performance
- Optimize images and assets
- Minimize bundle size
- Implement lazy loading
- Use proper caching strategies

### Reliability
- Implement proper error handling
- Set up health check endpoints
- Monitor application uptime
- Have rollback procedures ready

## 🆘 Support & Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

### Community
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma Community](https://www.prisma.io/community)

### Emergency Contacts
- Monitor application health dashboards
- Set up alerting for critical failures
- Have rollback procedures documented

---

**🎉 Your application is now ready for production deployment on Vercel!**

Remember to test thoroughly in a staging environment before deploying to production, and always have a rollback plan ready. 