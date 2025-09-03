'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Zap, FileText, MessageSquare, Settings, ChevronDown, ChevronUp, Mic, Image } from 'lucide-react'
import { MeetingReportDialog } from '@/components/ai-services/meeting-report-dialog'
import { CustomDocumentGeneratorDialog } from '@/components/ai-services/custom-document-generator-dialog'
import { ImageCreatorDialog } from '@/components/ai-services/image-creator-dialog'
import { ClientDocuments } from '@/components/clients/client-documents'
import { ServiceStatus } from '@/lib/enums'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useTranslations } from '@/lib/translations/context'
import { UsageIndicator } from '@/components/subscription/usage-indicator'

interface AIServicesClientProps {
  clients: any[]
}

export function AIServicesClient({ clients }: AIServicesClientProps) {
  const t = useTranslations('aiServices')
  const [isMeetingReportDialogOpen, setIsMeetingReportDialogOpen] = useState(false)
  const [isCustomDocumentDialogOpen, setIsCustomDocumentDialogOpen] = useState(false)
  const [isImageCreatorDialogOpen, setIsImageCreatorDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [documentToHighlight, setDocumentToHighlight] = useState<string | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  
  // Default visibility - all services visible by default
  const defaultVisibility = {
    'meeting-report': true,
    'custom-document': true,
    'image-creator': true,
    'podcast-creator': true,
  }

  const { 
    value: visibleServices, 
    setValue: setVisibleServices 
  } = useLocalStorage('ai-services-visibility', defaultVisibility)

  // Save service visibility preferences whenever they change
  const handleServiceVisibilityChange = (serviceId: string, visible: boolean) => {
    const newVisibility = { ...visibleServices, [serviceId]: visible }
    setVisibleServices(newVisibility)
  }

  const handleDocumentCreated = (clientId: string, documentId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setSelectedClient(client)
      setDocumentToHighlight(documentId)
      setIsDocumentsOpen(true)
    }
  }

  const services = [
    {
      id: 'meeting-report',
      title: t('services.meetingReport.title'),
      description: t('services.meetingReport.description'),
      icon: <MessageSquare className="h-8 w-8" />,
      features: [
        t('services.meetingReport.features.transcription'),
        t('services.meetingReport.features.insights'),
        t('services.meetingReport.features.summaries')
      ],
      status: ServiceStatus.AVAILABLE,
      onClick: () => setIsMeetingReportDialogOpen(true),
      iconColorClass: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'custom-document',
      title: t('services.customDocument.title'),
      description: t('services.customDocument.description'),
      icon: <FileText className="h-8 w-8" />,
      features: [
        t('services.customDocument.features.prompts'),
        t('services.customDocument.features.variables'),
        t('services.customDocument.features.formatting')
      ],
      status: ServiceStatus.AVAILABLE,
      onClick: () => setIsCustomDocumentDialogOpen(true),
      iconColorClass: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'image-creator',
      title: t('services.imageCreator.title'),
      description: t('services.imageCreator.description'),
      icon: <Image className="h-8 w-8" />,
      features: [
        t('services.imageCreator.features.aiPowered'),
        t('services.imageCreator.features.promptLibrary'),
        t('services.imageCreator.features.instantDownload')
      ],
      status: ServiceStatus.AVAILABLE,
      onClick: () => setIsImageCreatorDialogOpen(true),
      iconColorClass: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
    },
    {
      id: 'podcast-creator',
      title: t('services.podcastCreator.title'),
      description: t('services.podcastCreator.description'),
      icon: <Mic className="h-8 w-8" />,
      features: [
        t('services.podcastCreator.features.veo3'),
        t('services.podcastCreator.features.automated'),
        t('services.podcastCreator.features.quality')
      ],
      status: ServiceStatus.COMING_SOON,
      onClick: undefined,
      iconColorClass: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
    }
  ]

  // Filter services based on visibility preferences
  const filteredServices = (services || []).filter(service => visibleServices[service.id as keyof typeof visibleServices])

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">{t('title')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {t('configureServices')}
                {isConfigOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg text-muted-foreground">
              {t('description')}
            </p>
            <UsageIndicator />
          </div>
        </div>

        {/* Service Configuration Panel */}
        {isConfigOpen && (
          <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('serviceVisibilitySettings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((service) => (
                  <Checkbox
                    key={service.id}
                    id={service.id}
                    checked={visibleServices[service.id as keyof typeof visibleServices]}
                    onChange={(e) => 
                      handleServiceVisibilityChange(service.id, e.target.checked)
                    }
                    label={service.title}
                    className="text-blue-900 dark:text-blue-100"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
                {t('emptyState.title')}
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-center max-w-md mb-4">
                {t('emptyState.description')}
              </p>
              <Button
                onClick={() => setIsConfigOpen(true)}
                variant="blue"
              >
                {t('configureServices')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card 
                key={service.id} 
                className={`transition-all duration-200 flex flex-col h-full ${
                  service.status === ServiceStatus.AVAILABLE 
                    ? 'hover:shadow-lg cursor-pointer border-blue-200 dark:border-blue-800' 
                    : 'opacity-75 cursor-not-allowed'
                }`}
                onClick={service.status === ServiceStatus.AVAILABLE ? service.onClick : undefined}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        service.status === ServiceStatus.AVAILABLE 
                          ? service.iconColorClass || 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {service.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">
                      {service.description}
                    </p>
                    <ul className="space-y-1">
                      {service.features.map((feature, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {service.status === ServiceStatus.AVAILABLE && (
                    <Button 
                      className={`w-full mt-4 ${
                        service.id === 'meeting-report' ? 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-500 dark:hover:bg-purple-600' :
                        service.id === 'custom-document' ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600' :
                        service.id === 'image-creator' ? 'bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600' :
                        ''
                      }`}
                      onClick={service.onClick}
                    >
                      {t('getStarted')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        {filteredServices.length > 0 && (
          <Card className="mt-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">{t('howItWorks.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">{t('howItWorks.step1.title')}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{t('howItWorks.step1.description')}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">{t('howItWorks.step2.title')}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{t('howItWorks.step2.description')}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">{t('howItWorks.step3.title')}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{t('howItWorks.step3.description')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Meeting Report Dialog */}
      <MeetingReportDialog
        open={isMeetingReportDialogOpen}
        onOpenChange={setIsMeetingReportDialogOpen}
        clients={clients}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Document Generator Dialog */}
      <CustomDocumentGeneratorDialog
        isOpen={isCustomDocumentDialogOpen}
        onClose={() => setIsCustomDocumentDialogOpen(false)}
        clients={clients}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Image Creator Dialog */}
      <ImageCreatorDialog
        open={isImageCreatorDialogOpen}
        onOpenChange={setIsImageCreatorDialogOpen}
      />

      {/* Client Documents */}
      {isDocumentsOpen && selectedClient && (
        <ClientDocuments
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          open={isDocumentsOpen}
          onOpenChange={setIsDocumentsOpen}
          documentToHighlight={documentToHighlight}
        />
      )}
    </>
  )
} 