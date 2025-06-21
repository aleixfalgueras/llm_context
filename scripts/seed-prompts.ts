import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const samplePrompts = [
  {
    name: "Marketing Strategy Report",
    description: "Structured format for generating comprehensive marketing strategy reports",
    content: `Please create a comprehensive marketing strategy report for {client_name} with the following structure:

**Client Information:**
- Name: {client_name}
- Location: {country}

**Strategy Recommendations:**
Please provide detailed marketing strategy recommendations based on the client's market presence and business needs.

**Implementation Plan:**
Include specific next steps and timeline for executing the marketing strategy.

**Success Metrics:**
Define key performance indicators to measure the success of the marketing initiatives.`,
    category: "marketing",
  },
  {
    name: "Content Calendar Template",
    description: "Template for creating detailed content calendars",
    content: `# Content Calendar for {client_name}

## Client Overview
- Location: {country}

## Content Strategy:
1. **Brand Voice & Messaging**
2. **Content Pillars**
3. **Platform Strategy**
4. **Engagement Tactics**

## Content Calendar Planning:
Please provide a detailed content calendar plan, taking into account the client's target audience and market.

Include content themes, posting schedules, and engagement strategies tailored for their market.`,
    category: "content",
  },
  {
    name: "Social Media Campaign Proposal",
    description: "Comprehensive template for social media campaign proposals",
    content: `# Social Media Campaign Proposal for {client_name}

## Client Profile:
- Business: {client_name}
- Location: {country}

## Campaign Overview:
Please create a detailed social media campaign proposal including:
1. Campaign objectives aligned with business needs
2. Target audience analysis
3. Platform selection and rationale
4. Content strategy and creative direction
5. Budget allocation and timeline
6. Success metrics and KPIs

Ensure the campaign is tailored to their specific market and business objectives.`,
    category: "social-media",
  },
  {
    name: "Performance Analysis Report",
    description: "Standard format for marketing performance tracking reports",
    content: `# Marketing Performance Report - {client_name}

## Report Period: [Current Month/Quarter]

## Client Overview:
- Business: {client_name}
- Market: {country}

## Performance Summary:
Please analyze the marketing performance based on the following areas:

### 1. Objective Achievement
- Primary objectives progress
- Secondary objectives performance
- Challenges encountered

### 2. Campaign Metrics
- Engagement rates
- Conversion metrics
- ROI analysis

### 3. Content Performance
- Top-performing content
- Audience engagement patterns
- Platform-specific insights

### 4. Recommendations
- Optimization opportunities
- Strategy adjustments
- Next period priorities

Please provide specific, data-driven insights and actionable recommendations.`,
    category: "analysis",
  },
  {
    name: "Client Onboarding Email Template",
    description: "Template for professional client onboarding communication",
    content: `Subject: Welcome to Our Marketing Partnership - {client_name}

Dear {client_name} team,

Welcome to our marketing partnership! We're excited to help you achieve your business objectives.

**Your Partnership:**
We'll be working together to develop a comprehensive marketing strategy that aligns with your business objectives and target market in {country}.

**What to Expect:**
- Strategic planning sessions
- Regular performance reviews
- Creative campaign development
- Ongoing optimization and support

**Getting Started:**
Please provide any additional brand materials, target audience insights, or specific requirements that will help us deliver the best results.

We're committed to your success and look forward to building a strong partnership.

Best regards,
[Your Name]
Marketing Strategy Consultant`,
    category: "general",
  },
  {
    name: "Creative Campaign Brief",
    description: "Professional template for creative campaign briefs",
    content: `# Creative Campaign Brief - {client_name}

## Campaign Overview
**Client:** {client_name}
**Market:** {country}

## Creative Direction:
Please develop a comprehensive creative brief that includes:

**Brand Positioning:**
- How should the brand be positioned in the market?
- What makes {client_name} unique?

**Target Audience:**
- Primary and secondary audiences
- Demographics and psychographics
- Customer journey insights

**Creative Strategy:**
- Key messaging themes
- Visual direction and tone
- Content formats and channels

**Deliverables:**
- Campaign concepts
- Content calendar
- Asset requirements
- Timeline and milestones

Please ensure all creative elements resonate with their target market and business objectives.`,
    category: "strategy",
  }
]

async function main() {
  console.log('Seeding sample marketing prompts...')

  // Note: This would need to be run with a specific user ID in a real scenario
  // For now, this is just a template script
  
  for (const promptData of samplePrompts) {
    console.log(`Creating prompt: ${promptData.name}`)
    // In real implementation, you'd need to pass a userId
    // const prompt = await prisma.prompt.create({
    //   data: {
    //     ...promptData,
    //     userId: 'your-user-id-here',
    //   },
    // })
    // console.log(`Created prompt: ${prompt.name}`)
  }

  console.log('Sample marketing prompts ready! (Note: Actual creation requires user authentication)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 