import { AffiliationClient } from '@/components/affiliation/affiliation-client'
import { NavbarWrapper } from '@/components/global/navbar-wrapper'
import { getUserAffiliation, getAffiliationChildren, checkAndUpdateAffiliationStatus } from '@/app/actions/affiliation-action'

export default async function AffiliationPage() {
  // First, check and update user's affiliation status if needed
  const statusUpdate = await checkAndUpdateAffiliationStatus()
  
  // Log status updates for audit purposes
  if (statusUpdate.updated) {
    console.log(`Affiliation status updated from ${statusUpdate.oldStatus} to ${statusUpdate.newStatus}`)
  }

  // Get user's affiliation and children data (status will be current after the update above)
  const [affiliation, childrenData] = await Promise.all([
    getUserAffiliation(),
    getAffiliationChildren()
  ])

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <NavbarWrapper />
      <div className="flex-1 overflow-auto">
        <AffiliationClient 
          userAffiliation={affiliation}
          affiliationChildren={childrenData.children}
        />
      </div>
    </div>
  )
}