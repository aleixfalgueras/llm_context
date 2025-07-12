export const samplePrompts = [
  {
    id: 'sample-1',
    name: "Marketing Strategy Report",
    description: "Comprehensive marketing strategy with full client context integration",
    content: `Please create a comprehensive marketing strategy report with the following structure:

Client Information:
- Location: {country}
- Business Context: {general_context}
- Key Focus Area: {specific_context_1}
- Additional Considerations: {specific_context_2}

Strategy Recommendations:
Based on the client's location and business context, provide detailed marketing strategy recommendations that address their specific focus areas and considerations.

Implementation Plan:
Include specific next steps and timeline for executing the marketing strategy, taking into account their unique business circumstances and market positioning.

Success Metrics:
Define key performance indicators that align with their specific business objectives and market requirements.`,
    category: "marketing",
    isActive: true,
    usageCount: 0,
    isSample: true,
  },
  {
    id: 'sample-2',
    name: "Content Calendar Template",
    description: "Detailed content calendar with client-specific customization",
    content: `Content Calendar Template

Client Overview:
- Market Location: {country}
- Business Context: {general_context}
- Primary Focus: {specific_context_1}
- Secondary Objectives: {specific_context_2}

Content Strategy Framework:
1. Brand Voice & Messaging (tailored to market and business context)
2. Content Pillars (aligned with primary focus areas)
3. Platform Strategy (optimized for target market)
4. Engagement Tactics (considering specific objectives)

Monthly Content Planning:
Please provide a detailed content calendar that incorporates the client's specific context and objectives. Include content themes, posting schedules, and engagement strategies that resonate with their target audience and market dynamics.

Content should address their primary focus while supporting secondary objectives throughout the calendar.`,
    category: "content",
    isActive: true,
    usageCount: 0,
    isSample: true,
  },
  {
    id: 'sample-3',
    name: "Client Onboarding Document",
    description: "Personalized client welcome and onboarding materials",
    content: `Client Onboarding & Welcome Package

Welcome Message:
Create a personalized welcome message for our new client, considering their location in {country} and their business context: {general_context}

Service Overview:
Provide a customized overview of our services that specifically addresses:
- Primary Needs: {specific_context_1}
- Secondary Requirements: {specific_context_2}
- Additional Considerations: {specific_context_3}

Next Steps & Timeline:
Outline a clear onboarding process tailored to their specific requirements and market context.

Contact Information:
Include relevant team members and communication preferences optimized for their location and business needs.

This onboarding document should make the client feel understood and confident in our ability to address their unique business requirements.`,
    category: "general",
    isActive: true,
    usageCount: 0,
    isSample: true,
  },
  {
    id: 'sample-4',
    name: "Performance Analysis Report",
    description: "Comprehensive performance tracking with contextual insights",
    content: `Marketing Performance Report

Report Period: [Current Month/Quarter]

Client Overview:
- Market: {country}
- Business Context: {general_context}
- Key Performance Area: {specific_context_1}
- Secondary Focus: {specific_context_2}

Performance Summary:
Analyze marketing performance considering the client's specific business context and focus areas:

1. Primary Objective Achievement
- Progress toward main goals related to: {specific_context_1}
- Market-specific performance indicators
- Context-driven success metrics

2. Secondary Objective Performance  
- Results in: {specific_context_2}
- Supporting initiative outcomes
- Cross-objective synergies

3. Market Context Analysis
- Location-specific performance trends
- Regional market dynamics impact
- Cultural/geographic considerations

4. Strategic Recommendations
- Optimization opportunities aligned with business context
- Market-specific strategy adjustments
- Prioritized next steps considering all context factors

Please provide data-driven insights that connect performance metrics to the client's specific business context and objectives.`,
    category: "analysis",
    isActive: true,
    usageCount: 0,
    isSample: true,
  },
  {
    id: 'sample-5',
    name: "Competitive Analysis Brief",
    description: "Market analysis incorporating client-specific positioning",
    content: `Competitive Analysis Report

Client Context:
- Market Location: {country}
- Business Overview: {general_context}
- Competitive Focus: {specific_context_1}
- Differentiation Strategy: {specific_context_2}
- Market Positioning: {specific_context_3}

Competitive Landscape Analysis:
Provide a comprehensive competitive analysis that considers the client's specific market position and strategic focus areas.

1. Direct Competitors
- Identify main competitors in {country} market
- Analyze how they position against client's focus on: {specific_context_1}

2. Competitive Advantages
- Highlight client's unique positioning in: {specific_context_2}
- Market opportunities based on: {specific_context_3}

3. Market Gaps & Opportunities
- Unmet needs in the target market
- Strategic opportunities aligned with client context

4. Recommendations
- Positioning strategies that leverage client's specific strengths
- Market entry or expansion tactics
- Competitive response strategies

This analysis should provide actionable insights for strengthening market position.`,
    category: "analysis",
    isActive: true,
    usageCount: 0,
    isSample: true,
  },
  {
    id: 'sample-6',
    name: "Social Media Campaign Proposal",
    description: "Targeted social media strategy with full context integration",
    content: `Social Media Campaign Proposal

Client Background:
- Target Market: {country}
- Business Context: {general_context}
- Campaign Objective: {specific_context_1}
- Brand Focus: {specific_context_2}
- Special Considerations: {specific_context_3}

Campaign Strategy:
Develop a social media campaign that leverages the client's unique positioning and addresses their specific objectives.

1. Platform Selection
- Optimal platforms for {country} market
- Alignment with campaign objective: {specific_context_1}

2. Content Strategy
- Messaging that reflects: {general_context}
- Content themes highlighting: {specific_context_2}
- Special considerations for: {specific_context_3}

3. Engagement Tactics
- Market-appropriate engagement methods
- Community building strategies
- User-generated content opportunities

4. Campaign Timeline & Metrics
- Phased rollout plan
- Success metrics aligned with objectives
- Performance monitoring framework

This campaign should authentically represent the client's brand while achieving their specific marketing objectives.`,
    category: "marketing",
    isActive: true,
    usageCount: 0,
    isSample: true,
  }
]

export const getSamplePromptsByCategory = (category?: string) => {
  if (!category || category === 'all') {
    return samplePrompts
  }
  return samplePrompts.filter(prompt => prompt.category === category)
}
