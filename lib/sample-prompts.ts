export const samplePrompts = [
  {
    id: 'sample-1',
    name: "Marketing Strategy Report",
    description: "Structured format for generating comprehensive marketing strategy reports",
    content: `Please create a comprehensive marketing strategy report for {client_name} with the following structure:

Client Information:
- Name: {client_name}
- Location: {country}

Strategy Recommendations:
Please provide detailed marketing strategy recommendations based on the client's market presence and business needs.

Implementation Plan:
Include specific next steps and timeline for executing the marketing strategy.

Success Metrics:
Define key performance indicators to measure the success of the marketing initiatives.`,
    category: "marketing",
    isActive: true,
    usageCount: 0,
    isSample: true,
  },
  {
    id: 'sample-2',
    name: "Content Calendar Template",
    description: "Template for creating detailed content calendars",
    content: `Content Calendar for {client_name}

Client Overview
- Location: {country}

Content Strategy:
1. Brand Voice & Messaging
2. Content Pillars
3. Platform Strategy
4. Engagement Tactics

Content Calendar Planning:
Please provide a detailed content calendar plan, taking into account the client's target audience and market.

Include content themes, posting schedules, and engagement strategies tailored for their market.`,
    category: "content",
    isActive: true,
    usageCount: 0,
    isSample: true,
  },

  {
    id: 'sample-4',
    name: "Performance Analysis Report",
    description: "Standard format for marketing performance tracking reports",
    content: `Marketing Performance Report - {client_name}

Report Period: [Current Month/Quarter]

Client Overview:
- Business: {client_name}
- Market: {country}

Performance Summary:
Please analyze the marketing performance based on the following areas:

1. Objective Achievement
- Primary objectives progress
- Secondary objectives performance
- Challenges encountered

2. Campaign Metrics
- Engagement rates
- Conversion metrics
- ROI analysis

3. Content Performance
- Top-performing content
- Audience engagement patterns
- Platform-specific insights

4. Recommendations
- Optimization opportunities
- Strategy adjustments
- Next period priorities

Please provide specific, data-driven insights and actionable recommendations.`,
    category: "analysis",
    isActive: true,
    usageCount: 0,
    isSample: true,
  },

]

export const getSamplePromptsByCategory = (category?: string) => {
  if (!category || category === 'all') {
    return samplePrompts
  }
  return samplePrompts.filter(prompt => prompt.category === category)
}

export const getSamplePromptById = (id: string) => {
  return samplePrompts.find(prompt => prompt.id === id)
} 