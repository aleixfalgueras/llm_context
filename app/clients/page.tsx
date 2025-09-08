import { getClients } from '@/app/actions/client-action'
import { ClientsPageClient } from '@/components/clients/clients-page-client'
import { NavbarWrapper } from '@/components/global/navbar-wrapper'

export default async function ClientsPage() {

  const clients = await getClients({ includeDetails: true })

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <NavbarWrapper />
      <div className="flex-1 overflow-auto">
        <ClientsPageClient clients={clients} />
      </div>
    </div>
  )
} 