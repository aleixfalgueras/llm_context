import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Mail, FileText, Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground">
              Your privacy is important to us. This privacy policy explains how MIA collects, uses, and protects your information.
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Name, email address, and phone number</li>
                    <li>Business or client information for marketing purposes</li>
                    <li>Country or location information</li>
                    <li>General context and preferences</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Document Generation</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Marketing documents and content generated through our AI services</li>
                    <li>Meeting reports and custom documents</li>
                    <li>Content preferences and language settings</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Usage Information</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Chat messages and interactions with our AI assistant</li>
                    <li>Documents generated and prompts used</li>
                    <li>Usage patterns and preferences</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">We Do Not Sell Your Data</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We never sell, rent, or trade your personal information to third parties for any purpose.
                  </p>
                </div>
              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Privacy-First Content Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We've designed our document generation to prioritize your privacy and security.
                </p>
                <p className="text-muted-foreground">
                  <strong>No Personal Information Sent to AI:</strong> We never send your name, email, phone number, or other identifying information to AI models. Only selected business context is used when you choose to include it.
                </p>
              </CardContent>
            </Card>




            <Card id="cookies">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="w-5 h-5" />
                  Cookie Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This section explains how MIA uses cookies and similar technologies. 
                  Currently, we only use essential cookies for authentication and security.
                </p>
                
                <div>
                  <h4 className="font-semibold mb-2">What Are Cookies?</h4>
                  <p className="text-muted-foreground">
                    Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain functionality.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Necessary Cookies</h4>
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                    <p className="text-green-800 dark:text-green-200 font-medium mb-2">✓ Always Active</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      These cookies are essential for the website to function properly and cannot be disabled.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Authentication Cookies</h5>
                      <p className="text-sm text-muted-foreground mb-2">Keep you logged in and secure your session</p>
                      <div className="text-xs text-muted-foreground">
                        <p><strong>Duration:</strong> Session / 7 days</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Security Cookies</h5>
                      <p className="text-sm text-muted-foreground mb-2">Protect against security threats</p>
                      <div className="text-xs text-muted-foreground">
                        <p><strong>Duration:</strong> Session</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>



            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-sm mb-4">
                  <p><strong>Email:</strong> falguerasaleix@gmail.com</p>
                  <p><strong>Support:</strong> <Link href="/feedback" className="text-blue-600 dark:text-blue-400 hover:underline">Provide feedback</Link></p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 font-medium mb-2">Data Breach Notification</p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    In the event of a data breach that may pose a risk to your personal data, we will notify you within 72 hours 
                    and provide details about the breach, its impact, and steps taken to address it.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Changes to This Policy</h3>
              <p className="text-sm text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our service after any changes indicates your acceptance of the new terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 