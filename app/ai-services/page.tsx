import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AIServicesClient } from '@/components/ai-services/ai-services-client'
import { Navbar } from '@/components/global/navbar'
import { getClients } from '@/lib/client-actions'

export default async function AIServicesPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get user's clients
  const clients = await getClients({ includeDetails: true })

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <AIServicesClient clients={clients} />
      </div>
    </div>
  )
} 