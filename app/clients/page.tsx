import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getClients } from '@/lib/client-actions'
import { ClientsPageClient } from '@/components/clients/clients-page-client'
import { Navbar } from '@/components/global/navbar'

export default async function ClientsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const clients = await getClients({ includeDetails: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <ClientsPageClient clients={clients} />
      </div>
    </div>
  )
} 