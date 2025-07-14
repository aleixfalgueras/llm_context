import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Mail, FileText, Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              Your privacy is important to us. This privacy policy explains how SpeedBrand collects, uses, and protects your information.
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">🔒 Privacy-First Content Generation</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    We've designed our document generation to prioritize your privacy and security.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How We Handle Your Marketing Content:</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Secure Generation:</strong> All content is generated using secure, encrypted connections and processed in memory only.</li>
                    <li><strong>User Control:</strong> You have full control over what information is shared with AI during content generation.</li>
                    <li><strong>No Unauthorized Access:</strong> Your generated content is only accessible to you and cannot be accessed by other users.</li>
                    <li><strong>Data Minimization:</strong> We only use the minimum necessary information to generate your requested content.</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200 font-medium mb-2">✓ What We Share vs. Keep Private</p>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
                    <p><strong>Shared with AI:</strong> Only selected client context (country, general context) when explicitly chosen</p>
                    <p><strong>Never Shared:</strong> Names, email addresses, phone numbers, or other identifying information</p>
                  </div>
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
                      We never send your name, email address, phone number, or other identifying information to our AI models. Only selected client context (country, general context) is used when you explicitly choose to include it.
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Content Generation Security</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>All content generation occurs through secure, encrypted connections</li>
                    <li>Personal identifiers are never included in AI requests</li>
                    <li>Only anonymized business context is used for personalization</li>
                    <li>User-controlled context selection for all AI interactions</li>
                  </ul>
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
                  <li>To provide personalized marketing content and recommendations</li>
                  <li>To generate custom documents, meeting reports, and marketing materials</li>
                  <li>To manage your client information and business context</li>
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
                    We never sell, rent, or trade your personal information to third parties for any purpose.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Limited Sharing</h4>
                  <p className="text-muted-foreground mb-2">We may share information only in these circumstances:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>With service providers who help us operate the platform (OpenAI for AI responses - only anonymized context, Supabase for data storage)</li>
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
                    <li>Control what client context is shared with AI during content generation</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your data (chat history, documents)</li>
                    <li>Control email notifications and communications</li>
                    <li>Request clarification about our data practices</li>
                  </ul>
                  <div className="mt-4">
                    <Link href="/privacy/settings" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      → Manage Your Privacy Settings
                    </Link>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">Data Retention</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    We retain your data for as long as your account is active. If you delete your account, we will remove your personal information within 30 days, except where required by law.
                  </p>
                </div>
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
                  This section explains how SpeedBrand uses cookies and similar technologies. 
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
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information & Legal Entity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">Data Controller Information</p>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <p><strong>Individual:</strong> <a href="https://www.linkedin.com/in/aleix-falgueras-casals-066076186/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Aleix Falgueras Casals</a></p>
                      <p><strong>Address:</strong> Carrer d'Antonio de Solis, 27 Bis, 08301, Marato, España</p>
                      <p><strong>Registration:</strong> Sole Proprietorship</p>
                      <p><strong>VAT ID:</strong> Not applicable</p>
                    </div>
                  </div>
                                  <div>
                    <h4 className="font-semibold mb-2">Privacy Contacts</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Privacy Officer:</strong> falguerasaleix@gmail.com</p>
                      <p><strong>Data Protection Officer:</strong> falguerasaleix@gmail.com</p>
                      <p><strong>General Support:</strong> falguerasaleix@gmail.com</p>
                      <p><strong>Legal Department:</strong> falguerasaleix@gmail.com</p>
                    </div>
                  </div>
                <div>
                  <h4 className="font-semibold mb-2">Supervisory Authority</h4>
                  <p className="text-sm text-muted-foreground">
                    If you are not satisfied with our response to your privacy concerns, you have the right to lodge a complaint with your local data protection authority. 
                    For EU residents, you can find your supervisory authority at: https://edpb.europa.eu/about-edpb/board/members_en
                  </p>
                </div>
                                  <div>
                    <h4 className="font-semibold mb-2">Governing Law & Jurisdiction</h4>
                    <p className="text-sm text-muted-foreground">
                      This Privacy Policy and any privacy-related disputes are governed by Spanish law. 
                      Any legal proceedings must be brought in the courts of Spain.
                    </p>
                  </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Data Retention & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Data Retention Periods</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li><strong>Account Data:</strong> Retained while account is active + 30 days after deletion</li>
                    <li><strong>Chat Messages:</strong> Retained while account is active + 90 days for security</li>
                    <li><strong>Generated Documents:</strong> Retained while account is active</li>
                    <li><strong>Consent Records:</strong> Retained for 7 years for legal compliance</li>
                    <li><strong>Audit Logs:</strong> Retained for 7 years for security and compliance</li>
                    <li><strong>Marketing Communications:</strong> Until unsubscribed + 12 months</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Security Measures</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>End-to-end encryption for data in transit and at rest</li>
                    <li>Multi-factor authentication for administrative access</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Employee background checks and privacy training</li>
                    <li>Incident response and breach notification procedures</li>
                    <li>Regular backup and disaster recovery testing</li>
                  </ul>
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

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> falguerasaleix@gmail.com</p>
                  <p><strong>Support:</strong> <Link href="/feedback" className="text-blue-600 dark:text-blue-400 hover:underline">Provide feedback</Link></p>
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