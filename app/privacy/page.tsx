import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
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
              Your privacy is important to us. This privacy policy explains how HealthCoach AI collects, uses, and protects your information.
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
                    <li>Health and fitness goals</li>
                    <li>Medical history and health-related information</li>
                    <li>Physical measurements (height, weight, age)</li>
                    <li>Personal notes and preferences</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Usage Information</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Chat messages and interactions with our AI assistant</li>
                    <li>Documents uploaded and generated</li>
                    <li>Usage patterns and preferences</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  How We Protect Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Privacy-Safe AI Interactions</h4>
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-200 font-medium mb-2">✓ No Personal Identifiers Sent to AI</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      We never send your name, email address, or phone number to our AI models. Only anonymized health and fitness data is used to personalize your experience.
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Security</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>All data is encrypted in transit and at rest</li>
                    <li>Access controls and authentication via Clerk</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Secure cloud infrastructure with Supabase</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>To provide personalized health and fitness recommendations</li>
                  <li>To generate customized diet plans, workout routines, and health reports</li>
                  <li>To maintain your chat history and document library</li>
                  <li>To improve our AI assistant's responses and features</li>
                  <li>To send you important service updates and notifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Information Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">We Do Not Sell Your Data</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We never sell, rent, or trade your personal information to third parties for marketing purposes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Limited Sharing</h4>
                  <p className="text-muted-foreground mb-2">We may share information only in these circumstances:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>With service providers who help us operate the platform (OpenAI for AI responses, Supabase for data storage)</li>
                    <li>When required by law or to protect our legal rights</li>
                    <li>With your explicit consent</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Your Rights and Choices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">You can:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Access and update your personal information</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your data (chat history, documents)</li>
                    <li>Control email notifications and communications</li>
                    <li>Request clarification about our data practices</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">Data Retention</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    We retain your data for as long as your account is active. If you delete your account, we will remove your personal information within 30 days, except where required by law.
                  </p>
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
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> privacy@healthcoach.ai</p>
                  <p><strong>Support:</strong> <Link href="/feedback" className="text-blue-600 dark:text-blue-400 hover:underline">Submit a feature request</Link></p>
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