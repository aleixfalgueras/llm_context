'use client'

import { AffiliationStatus } from '@prisma/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { 
  AffiliationStatusEmoji, 
  AffiliationStatusConditions, 
  AffiliationStatusComissions 
} from '@/lib/types/affiliation-types'

interface StatusGuideDialogProps {
  currentStatus: AffiliationStatus
}

export function StatusGuideDialog({ currentStatus }: StatusGuideDialogProps) {
  const allStatuses = Object.values(AffiliationStatus)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          Status Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Affiliation Status Guide</DialogTitle>
          <DialogDescription>
            Complete overview of all affiliation statuses, their requirements, and benefits
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Requirements</th>
                  <th className="text-left p-4 font-semibold">Benefits & Commissions</th>
                </tr>
              </thead>
              <tbody>
                {allStatuses.map((status) => (
                  <tr 
                    key={status}
                    className={`border-b hover:bg-muted/50 transition-colors ${
                      status === currentStatus ? 'bg-primary/10 border-primary/20' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={status === currentStatus ? "default" : "secondary"}
                          className="text-sm whitespace-nowrap"
                        >
                          {AffiliationStatusEmoji[status]}
                        </Badge>
                        {status === currentStatus && (
                          <span className="text-xs text-primary font-medium">(Current)</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {AffiliationStatusConditions[status]}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {AffiliationStatusComissions[status]}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {allStatuses.map((status) => (
              <div 
                key={status}
                className={`p-4 border rounded-lg ${
                  status === currentStatus ? 'bg-primary/10 border-primary/20' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge 
                    variant={status === currentStatus ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {AffiliationStatusEmoji[status]}
                  </Badge>
                  {status === currentStatus && (
                    <span className="text-xs text-primary font-medium">(Current)</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Requirements:</h4>
                    <p className="text-sm text-muted-foreground">
                      {AffiliationStatusConditions[status]}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Benefits & Commissions:</h4>
                    <p className="text-sm text-muted-foreground">
                      {AffiliationStatusComissions[status]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Status upgrades are automatic based on your network size and referral achievements. 
            Your current status is highlighted above.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}