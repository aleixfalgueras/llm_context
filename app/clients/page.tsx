import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getClients } from '@/lib/client-actions'
import { ClientsPageClient } from '@/components/clients-page-client'
import { Navbar } from '@/components/navbar'

export default async function ClientsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const clients = await getClients()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <ClientsPageClient clients={clients} />
      </div>
    </div>
  )
} 