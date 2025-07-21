# LLM Context

A production-ready AI-powered marketing assistant platform built with Next.js 14, React 18, and OpenRouter AI integration. Designed for marketing professionals and content creators to streamline client management, generate personalized marketing content, and scale their business operations efficiently with enterprise-grade privacy compliance and modular architecture.

## ✨ Key Features

- **AI-Powered Assistant**: Chat interface with Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano via OpenRouter
- **Client Management**: Store client profiles with business context for personalized content generation
- **Prompt Library**: Create and organize reusable AI templates with variable replacement
- **Document Generation**: Meeting reports and custom documents with automatic storage
- **Multi-language Support**: Generate content in 10 languages
- **Privacy & Compliance**: GDPR-compliant with consent management and data export
- **Subscription Management**: Usage tracking with Stripe integration
- **Admin Dashboard**: System analytics and user management


## 🏗️ Tech Stack

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui

**Backend:** Supabase (PostgreSQL), Prisma ORM, API Routes, Server Actions

**AI Integration:** OpenRouter (Google Gemini 2.0 Flash, OpenAI GPT-4.1 Nano)

**Authentication:** Clerk

**Payments:** Stripe

**File Storage:** Supabase Storage

**Architecture:** Modular design with separated database, OpenRouter, and document management modules

## 💰 Pricing

- **Basic ($10/month)**: 5M tokens, client profiles, 50MB storage
- **Pro ($25/month)**: 15M tokens, client profiles, 200MB storage  
- **Business ($50/month)**: 40M tokens, client profiles, 2GB storage

All plans include access to both Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano models.


## 📂 Project Structure

```
├── app/                    # Next.js App Router pages and API routes
├── components/             # React components organized by feature
├── lib/                   # Core utilities and modules
│   ├── database/          # Database operations
│   ├── openrouter/        # AI integration
│   └── documents/         # Document management
├── prisma/               # Database schema and migrations
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── scripts/              # Utility scripts
```


## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- OpenRouter API key
- Clerk account
- Stripe account (for payments)

### Installation

1. **Clone and install:**
```bash
git clone <repo-url>
npm install --legacy-peer-deps
```

2. **Set up environment variables in `.env.local`:**
```env
DATABASE_URL="your_supabase_database_url"
OPENROUTER_API_KEY="your_openrouter_api_key"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_key"
CLERK_SECRET_KEY="your_clerk_secret"
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_key"
STRIPE_SECRET_KEY="your_stripe_key"
```

3. **Set up database:**
```bash
npx prisma generate
npx prisma db push
```

4. **Start development:**
```bash
npm run dev
```

## 📋 Usage

1. **Sign up** and complete consent process
2. **Create client profiles** with business context
3. **Build prompt library** with reusable templates
4. **Chat with AI** using client context
5. **Generate documents** (meetings, custom content)
6. **Export and manage** all generated content

## 🔧 Development

```bash
npm run dev              # Start development
npm run build           # Build for production
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema changes
npx prisma studio       # Database GUI
```

## 🚀 Deployment

Deploy to Vercel with these environment variables:
- All `.env.local` variables
- Set build command: `npm run vercel-build`
- Run `npx prisma migrate deploy` after deployment

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for marketing professionals**
