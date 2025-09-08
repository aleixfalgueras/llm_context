import { AIServicesClient } from '@/components/ai-services/ai-services-client'
import { Navbar } from '@/components/global/navbar'
import { getClients } from '@/app/actions/client-action'

export default async function AIServicesPage() {

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