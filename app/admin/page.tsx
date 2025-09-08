import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { NavbarWrapper } from '@/components/global/navbar-wrapper'
import AdminDashboardClient from '@/components/admin/admin-dashboard-client'
import { AdminService } from '@/services/admin-service'

export default async function AdminDashboard() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user is admin
  const isAdmin = await AdminService.isAdminUser(userId)
  if (!isAdmin) {
    notFound()
  }

  const data = await AdminService.getAdminDashboardData()

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <NavbarWrapper />
      <div className="flex-1 overflow-auto">
        <AdminDashboardClient data={data} />
      </div>
    </div>
  )
} 