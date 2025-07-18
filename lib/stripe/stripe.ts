import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable')
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')))
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
})