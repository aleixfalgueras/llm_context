#!/usr/bin/env tsx
/**
 * Seed Dynamic Texts Script
 *
 * This script extracts subscription plan feature texts from the translation files
 * and seeds them into the dynamic_texts database table.
 *
 * Usage: npx tsx resources/scripts/seed-dynamic-texts.ts
 */

import { PrismaClient, DynamicTextCategory } from '@prisma/client'

const prisma = new PrismaClient()

// Subscription plan features extracted from translation files
const SUBSCRIPTION_FEATURES = {
  en: {
    apprentice: {
      description: 'Free plan with basic features to get started',
      features: [
        '🤖 Access to MIA AI platform',
        '👥 Discount on access to local meetups about AI Education & Defi',
        '💎 Free Ruby Subscription Asset Dream & Co NFT Marketplace',
        '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)'
      ]
    },
    knight: {
      description: 'For SMEs and content creators',
      features: [
        '🤖 Access to MIA AI platform + x2.5 usage',
        '👥 Discount on access to local meetups about AI Education & Defi',
        '💎 Free Emeraud Subscription Asset Dream & Co NFT Marketplace',
        '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)'
      ]
    },
    master: {
      description: 'For startups and influencers scaling their impact',
      features: [
        '🤖 Access to MIA AI platform + x10 usage',
        '👥 Discount on access to local meetups about AI Education, Defi & Influencers',
        '💎 Free Emeraud Subscription Asset Dream & Co NFT Marketplace',
        '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
        '🎟️ 1 free entrance to XYZ Forum & Snomad Fest Entrepreneur (Snomad Pass Ticket)',
        '🌐 Free professional website hosting & showcase platform with e-commerce capabilities'
      ]
    },
    jedi: {
      description: 'For corporate leaders and CEOs driving innovation',
      features: [
        '🤖 Access to MIA AI platform + x25 usage',
        '👥 Discount on access to local meetups about AI Education, Defi & Influencers',
        '💎 Free Emeraud Subscription Asset Dream & Co NFT Marketplace',
        '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
        '🎟️ 1 free entrance to XYZ Forum & Snomad Fest Entrepreneur (Snomad Pass Ticket)',
        '🌐 Free professional website hosting & showcase platform with e-commerce capabilities',
        '📞 60 minutes private call per month to discuss personal branding and business scaling'
      ]
    }
  },
  fr: {
    apprentice: {
      description: 'Plan gratuit avec fonctionnalités de base pour commencer',
      features: [
        '🤖 Accès à la plateforme MIA AI',
        '👥 Réduction sur l\'accès aux meetups locaux sur l\'éducation AI & Defi',
        '💎 Abonnement Ruby gratuit Asset Dream & Co NFT Marketplace',
        '🎪 Événement avec réduction (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)'
      ]
    },
    knight: {
      description: 'Pour les PME et créateurs de contenu',
      features: [
        '🤖 Accès à la plateforme MIA AI + x2.5 utilisation',
        '👥 Réduction sur l\'accès aux meetups locaux sur l\'éducation AI & Defi',
        '💎 Abonnement Émeraude gratuit Asset Dream & Co NFT Marketplace',
        '🎪 Événement avec réduction (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)'
      ]
    },
    master: {
      description: 'Pour les startups et influenceurs développant leur impact',
      features: [
        '🤖 Accès à la plateforme MIA AI + x10 utilisation',
        '👥 Réduction sur l\'accès aux meetups locaux sur l\'éducation AI, Defi & Influenceurs',
        '💎 Abonnement Émeraude gratuit Asset Dream & Co NFT Marketplace',
        '🎪 Événement avec réduction (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
        '🎟️ 1 entrée gratuite au XYZ Forum & Snomad Fest Entrepreneur (Snomad Pass Ticket)',
        '🌐 Hébergement de site web professionnel gratuit & plateforme vitrine avec capacités e-commerce'
      ]
    },
    jedi: {
      description: 'Pour les dirigeants d\'entreprise et PDG moteurs de l\'innovation',
      features: [
        '🤖 Accès à la plateforme MIA AI + x25 utilisation',
        '👥 Réduction sur l\'accès aux meetups locaux sur l\'éducation AI, Defi & Influenceurs',
        '💎 Abonnement Émeraude gratuit Asset Dream & Co NFT Marketplace',
        '🎪 Événement avec réduction (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
        '🎟️ 1 entrée gratuite au XYZ Forum & Snomad Fest Entrepreneur (Snomad Pass Ticket)',
        '🌐 Hébergement de site web professionnel gratuit & plateforme vitrine avec capacités e-commerce',
        '📞 60 minutes d\'appel privé par mois pour discuter de personal branding et de développement d\'entreprise'
      ]
    }
  }
}

async function seedDynamicTexts() {
  console.log('🌱 Starting dynamic text seeding...\n')

  // Clean up old indexed feature entries (features.0, features.1, etc.)
  console.log('🧹 Cleaning up old indexed feature entries...')
  const deleteResult = await prisma.dynamicText.deleteMany({
    where: {
      key: {
        contains: '.features.'
      }
    }
  })
  console.log(`   Deleted ${deleteResult.count} old indexed entries\n`)

  const textsToSeed: Array<{
    key: string
    languageCode: string
    value: string
    category: DynamicTextCategory
  }> = []

  // Process each language
  for (const [languageCode, plans] of Object.entries(SUBSCRIPTION_FEATURES)) {
    console.log(`📝 Processing ${languageCode.toUpperCase()} translations...`)

    for (const [planName, planData] of Object.entries(plans)) {
      // Add description
      textsToSeed.push({
        key: `subscription.plans.${planName}.description`,
        languageCode,
        value: planData.description,
        category: DynamicTextCategory.subscription_features
      })

      // Add features as single newline-separated entry
      textsToSeed.push({
        key: `subscription.plans.${planName}.features`,
        languageCode,
        value: planData.features.join('\n'),
        category: DynamicTextCategory.subscription_features
      })
    }
  }

  console.log(`\n📊 Total entries to seed: ${textsToSeed.length}`)

  // Upsert all entries
  let upsertedCount = 0
  let updatedCount = 0

  for (const text of textsToSeed) {
    const existing = await prisma.dynamicText.findUnique({
      where: { key_languageCode: { key: text.key, languageCode: text.languageCode } }
    })

    await prisma.dynamicText.upsert({
      where: { key_languageCode: { key: text.key, languageCode: text.languageCode } },
      update: { value: text.value, category: text.category },
      create: text
    })

    if (existing) {
      updatedCount++
    } else {
      upsertedCount++
    }
  }

  console.log(`\n✅ Seeding completed!`)
  console.log(`   📥 New entries created: ${upsertedCount}`)
  console.log(`   🔄 Existing entries updated: ${updatedCount}`)
}

async function main() {
  try {
    await seedDynamicTexts()
  } catch (error) {
    console.error('\n❌ Error during seeding:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n✨ Done!')
  })
