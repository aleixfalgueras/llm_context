import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const samplePrompts = [
  {
    name: "Medical Report Format",
    description: "Structured format for generating comprehensive medical reports",
    content: `Please create a comprehensive medical report for {client_name} with the following structure:

**Patient Information:**
- Name: {client_name}
- Age: {age}
- Height: {height}
- Weight: {weight}
- Location: {country}

**Medical History:**
{medical_history}

**Current Goals:**
{goals}

**Recommendations:**
Please provide detailed recommendations based on the medical history and goals.

**Follow-up Plan:**
Include specific next steps and timeline for monitoring progress.`,
    category: "medical",
  },
  {
    name: "Fitness Assessment",
    description: "Template for creating detailed fitness assessments",
    content: `# Fitness Assessment for {client_name}

## Current Status
- Height: {height}
- Weight: {weight}
- Current Goals: {goals}

## Assessment Areas:
1. **Cardiovascular Health**
2. **Strength Assessment**
3. **Flexibility & Mobility**
4. **Body Composition**

## Medical Considerations:
{medical_history}

Please provide a detailed assessment and recommendations for each area, taking into account the client's medical history and personal goals.`,
    category: "fitness",
  },
  {
    name: "Nutrition Plan Template",
    description: "Comprehensive nutrition planning template with client context",
    content: `# Personalized Nutrition Plan for {client_name}

## Client Profile:
- Age: {age}
- Height: {height} 
- Weight: {weight}
- Location: {country}
- Goals: {goals}

## Medical Considerations:
{medical_history}

## Plan Structure:
Please create a detailed nutrition plan including:
1. Daily caloric requirements
2. Macronutrient breakdown
3. Meal timing recommendations
4. Sample meal ideas
5. Hydration guidelines
6. Supplement recommendations (if appropriate)

Ensure the plan considers the client's medical history and is suitable for their location and cultural preferences.`,
    category: "nutrition",
  },
  {
    name: "Progress Report Format",
    description: "Standard format for client progress tracking reports",
    content: `# Progress Report - {client_name}

## Report Date: [Current Date]

## Client Overview:
- Name: {client_name}
- Goals: {goals}
- Medical History: {medical_history}

## Progress Summary:
Please analyze the progress based on the following areas:

### 1. Goal Achievement
- Primary goals progress
- Secondary goals progress
- Challenges encountered

### 2. Health Metrics
- Physical measurements
- Performance improvements
- Health markers

### 3. Lifestyle Changes
- Adherence to recommendations
- Behavioral modifications
- Quality of life improvements

### 4. Next Steps
- Updated recommendations
- Goal adjustments
- Timeline for next review

Please provide specific, measurable feedback and actionable next steps.`,
    category: "analysis",
  },
  {
    name: "Professional Email Format",
    description: "Template for professional client communication",
    content: `Subject: Update on Your Health & Fitness Journey - {client_name}

Dear {client_name},

I hope this email finds you in good health and high spirits.

**Your Current Progress:**
Based on our recent consultation and your goals: {goals}

**Key Points to Address:**
Please provide professional, encouraging, and informative content that addresses the client's specific needs while maintaining a warm, supportive tone.

**Medical Considerations:**
Taking into account: {medical_history}

**Next Steps:**
Please outline clear, actionable next steps for the client.

Best regards,
[Your Name]
Health & Fitness Coach`,
    category: "formatting",
  },
  {
    name: "Motivational Coaching Style",
    description: "Motivational and encouraging coaching communication style",
    content: `Hey {client_name}! 🌟

You're doing AMAZING work on your fitness journey! 

I want to remind you of your incredible goals: {goals}

**Your Strengths:**
Let me highlight some of your biggest wins and strengths...

**Today's Focus:**
Based on your current progress and medical considerations ({medical_history}), let's focus on what will move you forward today.

**Remember:**
Every small step counts, and you're exactly where you need to be in your journey. Your commitment to your health at {age} years old is truly inspiring!

**Action Items:**
Please provide specific, achievable action items that will help the client stay motivated and make progress.

You've got this! 💪

Coach [Your Name]`,
    category: "coaching",
  }
]

async function main() {
  console.log('Seeding sample prompts...')

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

  console.log('Sample prompts ready! (Note: Actual creation requires user authentication)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 