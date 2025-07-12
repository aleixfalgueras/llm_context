import { getClients } from '@/lib/actions/client'
import { ClientsPageClient } from '@/components/clients/clients-page-client'
import { Navbar } from '@/components/global/navbar'

export default async function ClientsPage() {

  const clients = await getClients({ includeDetails: true })

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <ClientsPageClient clients={clients} />
      </div>
    </div>
  )
} 