import { AffiliationClient } from '@/components/affiliation/affiliation-client'
import { Navbar } from '@/components/global/navbar'
import { getUserAffiliation, getAffiliationChildren } from '@/app/actions/affiliation-action'

export default async function AffiliationPage() {
  // Get user's affiliation and children data
  const [affiliation, childrenData] = await Promise.all([
    getUserAffiliation(),
    getAffiliationChildren()
  ])

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <AffiliationClient 
          userAffiliation={affiliation}
          affiliationChildren={childrenData.children}
        />
      </div>
    </div>
  )
}