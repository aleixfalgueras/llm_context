import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/global/landing-page'

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    return <LandingPage />
  }

  // Redirect authenticated users to the clients page as default
  redirect('/clients')
}
