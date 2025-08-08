import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, FileText, Scale, AlertTriangle, Shield, Users, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
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
                <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground">
              These Terms of Service govern your use of MIA. By using our service, you agree to be bound by these terms.
            </p>
            
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-800 dark:text-orange-200 font-medium mb-2">⚠️ BETA SERVICE NOTICE</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    This is a beta/MVP service. Terms, features, and pricing may change as we develop and improve the platform. 
                    By using this service, you acknowledge it's in active development and your feedback helps us improve.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  By accessing or using MIA ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you disagree with any part of these terms, you may not access the Service.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">✓ Legal Agreement</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    These Terms constitute a legally binding agreement between you and MIA. 
                    Please read them carefully before using our Service.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Service Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">MIA provides:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>AI-powered content generation for marketing materials</li>
                    <li>Client management and document organisation tools</li>
                    <li>Custom document creation and export functionality</li>
                    <li>Chat-based AI assistant for marketing advice</li>
                    <li>Secure cloud storage for generated content</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200 font-medium mb-2">Service Availability</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. 
                    Scheduled maintenance will be announced in advance.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  User Accounts and Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Account Registration</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>You must provide accurate and complete information</li>
                    <li>You are responsible for maintaining account security</li>
                    <li>You must be at least 18 years old to use the Service</li>
                    <li>One person may not maintain multiple accounts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Acceptable Use</h4>
                  <p className="text-muted-foreground mb-2">You agree not to:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Use the Service for illegal activities or spam</li>
                    <li>Attempt to hack, reverse engineer, or compromise the Service</li>
                    <li>Generate content that violates third-party rights or is defamatory</li>
                    <li>Share your account credentials with others</li>
                    <li>Use automated tools to access the Service without permission</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Intellectual Property Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Your Content</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>You retain ownership of content you create and upload</li>
                    <li>You grant us license to process and store your content to provide the Service</li>
                    <li>You are responsible for ensuring you have rights to any content you upload</li>
                    <li>Generated content using our AI is owned by you</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Our Intellectual Property</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>The Service, software, and underlying technology remain our property</li>
                    <li>You may not copy, modify, or distribute our proprietary code or content</li>
                    <li>Our trademarks and branding may not be used without permission</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">AI-Generated Content</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    While you own AI-generated content, please verify its accuracy and ensure compliance with applicable laws before commercial use.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Subscription Plans</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Subscription fees are billed in advance on a recurring basis</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>Price changes will be communicated 30 days in advance</li>
                    <li>You may cancel your subscription at any time</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Free Month Promotion</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Basic plan includes first month free promotion</li>
                    <li>Free month is subject to Basic plan usage limitations</li>
                    <li>Credit card required for account activation</li>
                    <li>Cancel before second month to avoid charges</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Disclaimers and Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 font-medium mb-2">Service "As Is"</p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    The Service is provided "as is" without warranties of any kind. We do not guarantee that AI-generated content will be error-free or suitable for your specific purposes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Limitation of Liability</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Our liability is limited to the amount you paid for the Service in the past 12 months</li>
                    <li>We are not liable for indirect, incidental, or consequential damages</li>
                    <li>You use AI-generated content at your own risk and discretion</li>
                    <li>We are not responsible for third-party integrations or services</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Account Termination</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>You may terminate your account at any time through your account settings</li>
                    <li>We may terminate accounts that violate these Terms</li>
                    <li>Upon termination, you have 30 days to export your data</li>
                    <li>Some provisions of these Terms survive termination</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">Data Retention</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    After account termination, we will delete your personal data within 30 days, except where required by law to retain it longer.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Governing Law and Disputes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Jurisdiction</h4>
                  <p className="text-muted-foreground mb-2">
                    These Terms are governed by the laws of Spain. Any disputes will be resolved through:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>First, good faith negotiation between the parties</li>
                    <li>If unsuccessful, binding arbitration or competent courts</li>
                    <li>Class action lawsuits are waived where legally permissible</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  For questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> falguerasaleix@gmail.com</p>
                  <p><strong>Support:</strong> <Link href="/feedback" className="text-blue-600 dark:text-blue-400 hover:underline">Provide feedback</Link></p>
                  <p><strong>Privacy:</strong> <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link></p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Changes to Terms</h3>
              <p className="text-sm text-muted-foreground">
                We may update these Terms from time to time. Material changes will be communicated via email or through the Service. 
                Continued use after changes constitutes acceptance of the new terms. We recommend reviewing these Terms periodically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 