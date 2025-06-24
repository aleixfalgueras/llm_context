import { Navbar } from '@/components/global/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Cookie, BarChart3, Target, Settings, Shield, Clock, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/privacy">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Privacy Policy
              </Link>
            </Button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Cookie className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Cookie Policy</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground">
              This Cookie Policy explains how AI Marketing Assistant uses cookies and similar technologies. 
              Currently, we only use essential cookies for authentication and security.
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="w-5 h-5" />
                  What Are Cookies?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Necessary Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Always Active
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  These cookies are essential for the website to function properly and cannot be disabled.
                </p>
                
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Authentication Cookies</h4>
                    <p className="text-sm text-muted-foreground mb-2">Keep you logged in and secure your session</p>
                    <div className="text-xs text-muted-foreground">
                      <p><strong>Duration:</strong> Session / 7 days</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Security Cookies</h4>
                    <p className="text-sm text-muted-foreground mb-2">Protect against security threats</p>
                    <div className="text-xs text-muted-foreground">
                      <p><strong>Duration:</strong> Session</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us About Cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have questions about our use of cookies, please contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> falguerasaleix@gmail.com</p>
                  <p><strong>Support:</strong> <Link href="/feedback" className="text-blue-600 dark:text-blue-400 hover:underline">Provide feedback</Link></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 