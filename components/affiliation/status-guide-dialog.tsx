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
import { useTranslations } from '@/lib/translations/context'

interface StatusGuideDialogProps {
  currentStatus: AffiliationStatus
}

export function StatusGuideDialog({ currentStatus }: StatusGuideDialogProps) {
  const t = useTranslations('affiliation')
  const allStatuses = Object.values(AffiliationStatus)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          {t('statusGuide.buttonLabel')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('statusGuide.title')}</DialogTitle>
          <DialogDescription>
            {t('statusGuide.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">{t('statusGuide.status')}</th>
                  <th className="text-left p-4 font-semibold">{t('statusGuide.requirements')}</th>
                  <th className="text-left p-4 font-semibold">{t('statusGuide.benefitsCommissions')}</th>
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
                          <span className="text-xs text-primary font-medium">{t('statusGuide.current')}</span>
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
                    <span className="text-xs text-primary font-medium">{t('statusGuide.current')}</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{t('statusGuide.requirementsLabel')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {AffiliationStatusConditions[status]}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{t('statusGuide.benefitsCommissionsLabel')}</h4>
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
            <strong>{t('statusGuide.noteLabel')}</strong> {t('statusGuide.noteText')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}