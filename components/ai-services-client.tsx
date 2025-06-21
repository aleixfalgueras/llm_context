'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Zap, FileText, Calendar, Activity, MessageSquare, Settings, ChevronDown, ChevronUp, Edit3 } from 'lucide-react'
import { DietGeneratorDialog } from './diet-generator-dialog'
import { WorkoutGeneratorDialog } from './workout-generator-dialog'
import { BloodTestAnalysisDialog } from './blood-test-analysis-dialog'
import { MeetingReportDialog } from './meeting-report-dialog'
import { CustomDocumentGeneratorDialog } from './custom-document-generator-dialog'
import { ClientDocuments } from './client-documents'

interface AIServicesClientProps {
  clients: any[]
}

export function AIServicesClient({ clients }: AIServicesClientProps) {
  const [isDietDialogOpen, setIsDietDialogOpen] = useState(false)
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false)
  const [isBloodTestDialogOpen, setIsBloodTestDialogOpen] = useState(false)
  const [isMeetingReportDialogOpen, setIsMeetingReportDialogOpen] = useState(false)
  const [isCustomDocumentDialogOpen, setIsCustomDocumentDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [documentToHighlight, setDocumentToHighlight] = useState<string | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  // Default visibility - all services visible by default
  const defaultVisibility = {
    'diet-generator': true,
    'workout-generator': true,
    'blood-test-analysis': true,
    'meeting-report': true,
    'custom-document': true,
  }

  const [visibleServices, setVisibleServices] = useState<Record<string, boolean>>(defaultVisibility)

  // Load saved service visibility preferences on component mount
  useEffect(() => {
    const savedVisibility = localStorage.getItem('ai-services-visibility')
    
    if (savedVisibility) {
      try {
        const parsed = JSON.parse(savedVisibility)
        // Merge saved preferences with default visibility to ensure new services are visible
        const mergedVisibility = { ...defaultVisibility, ...parsed }
        setVisibleServices(mergedVisibility)
        // Update localStorage to include any new services
        localStorage.setItem('ai-services-visibility', JSON.stringify(mergedVisibility))
      } catch (error) {
        console.error('Failed to parse saved service visibility:', error)
        // Fall back to default visibility on error
        setVisibleServices(defaultVisibility)
      }
    }
  }, [])

  // Save service visibility preferences whenever they change
  const handleServiceVisibilityChange = (serviceId: string, visible: boolean) => {
    const newVisibility = { ...visibleServices, [serviceId]: visible }
    setVisibleServices(newVisibility)
    localStorage.setItem('ai-services-visibility', JSON.stringify(newVisibility))
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
      id: 'diet-generator',
      title: 'Generate Diet Plan',
      description: 'Create personalized diet plans for your clients based on their goals, medical history, and preferences.',
      icon: <FileText className="h-8 w-8" />,
      features: ['Client-specific recommendations', 'Date range planning', 'Editable before saving'],
      status: 'available',
      onClick: () => setIsDietDialogOpen(true),
      iconColorClass: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
    },
    {
      id: 'workout-generator',
      title: 'Generate Workout Plan',
      description: 'Design custom workout routines tailored to your client\'s fitness level and objectives.',
      icon: <Calendar className="h-8 w-8" />,
      features: ['Progressive overload', 'Equipment customization', 'Injury considerations'],
      status: 'available',
      onClick: () => setIsWorkoutDialogOpen(true),
      iconColorClass: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
    },
    {
      id: 'blood-test-analysis',
      title: 'Blood Test Analysis',
      description: 'Upload and analyze blood test reports to generate comprehensive health insights and recommendations.',
      icon: <Activity className="h-8 w-8" />,
      features: ['PDF upload & extraction', 'Health analysis', 'Actionable recommendations'],
      status: 'available',
      onClick: () => setIsBloodTestDialogOpen(true),
      iconColorClass: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
    },
    {
      id: 'meeting-report',
      title: 'Meeting Report',
      description: 'Generate comprehensive meeting reports with actionable steps from client meeting transcriptions.',
      icon: <MessageSquare className="h-8 w-8" />,
      features: ['Transcription analysis', 'Actionable insights', 'Professional summaries'],
      status: 'available',
      onClick: () => setIsMeetingReportDialogOpen(true),
      iconColorClass: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'custom-document',
      title: 'Custom Document Generator',
      description: 'Create personalized documents using your custom prompts with client-specific information and variables.',
      icon: <Edit3 className="h-8 w-8" />,
      features: ['Use existing prompts', 'Variable replacement', 'Professional formatting'],
      status: 'available',
      onClick: () => setIsCustomDocumentDialogOpen(true),
      iconColorClass: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
    }
  ]

  // Filter services based on visibility preferences
  const filteredServices = services.filter(service => visibleServices[service.id])

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">AI Services</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configure Services
              {isConfigOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-lg text-muted-foreground">
            Leverage AI to create personalized content for your clients
          </p>
        </div>



        {/* Service Configuration Panel */}
        {isConfigOpen && (
          <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Service Visibility Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((service) => (
                  <Checkbox
                    key={service.id}
                    id={service.id}
                    checked={visibleServices[service.id]}
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
                No services visible
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-center max-w-md mb-4">
                All AI services are currently hidden. Use the "Configure Services" button above to enable the services you want to use.
              </p>
              <Button
                onClick={() => setIsConfigOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Configure Services
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card 
                key={service.id} 
                className={`transition-all duration-200 ${
                  service.status === 'available' 
                    ? 'hover:shadow-lg cursor-pointer border-blue-200 dark:border-blue-800' 
                    : 'opacity-75 cursor-not-allowed'
                }`}
                onClick={service.status === 'available' ? service.onClick : undefined}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        service.status === 'available' 
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
                <CardContent>
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
                  {service.status === 'available' && (
                    <Button 
                      className={`w-full mt-4 ${
                        service.id === 'diet-generator' ? 'bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600' :
                        service.id === 'workout-generator' ? 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600' :
                        service.id === 'blood-test-analysis' ? 'bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600' :
                        service.id === 'meeting-report' ? 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-500 dark:hover:bg-purple-600' :
                        service.id === 'custom-document' ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600' :
                        ''
                      }`}
                      onClick={service.onClick}
                    >
                      Get Started
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
              <CardTitle className="text-blue-900 dark:text-blue-100">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Select Client</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Choose which client you want to create content for</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">AI Generation</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">AI creates personalized content using client context</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Review & Save</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Edit the content and save it to your client's documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diet Generator Dialog */}
      <DietGeneratorDialog 
        open={isDietDialogOpen}
        onOpenChange={setIsDietDialogOpen}
        clients={clients}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Workout Generator Dialog */}
      <WorkoutGeneratorDialog 
        open={isWorkoutDialogOpen}
        onOpenChange={setIsWorkoutDialogOpen}
        clients={clients}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Blood Test Analysis Dialog */}
      <BloodTestAnalysisDialog 
        open={isBloodTestDialogOpen}
        onOpenChange={setIsBloodTestDialogOpen}
        clients={clients}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Meeting Report Dialog */}
      <MeetingReportDialog 
        open={isMeetingReportDialogOpen}
        onOpenChange={setIsMeetingReportDialogOpen}
        clients={clients}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Custom Document Generator Dialog */}
      <CustomDocumentGeneratorDialog 
        isOpen={isCustomDocumentDialogOpen}
        onClose={() => setIsCustomDocumentDialogOpen(false)}
        clients={clients}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Client Documents Dialog */}
      {selectedClient && (
        <ClientDocuments
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientEmail={selectedClient.email}
          open={isDocumentsOpen}
          onOpenChange={setIsDocumentsOpen}
          documentToHighlight={documentToHighlight}
        />
      )}
    </>
  )
} 