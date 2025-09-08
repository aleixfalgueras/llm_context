import { getClients } from '@/app/actions/client-action'
import { ClientsPageClient } from '@/components/clients/clients-page-client'
import { Navbar } from '@/components/global/navbar'

export default async function ClientsPage() {

  const clients = await getClients({ includeDetails: true })

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <ClientsPageClient clients={clients} />
      </div>
    </div>
  )
} 