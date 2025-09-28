import type {Metadata} from "next";
import localFont from "next/font/local";
import {Poppins} from "next/font/google";
import "./globals.css";
import {ClerkProvider} from '@clerk/nextjs'
import {Toaster} from "@/components/ui/toaster"
import {ThemeProvider} from "@/components/global/theme-provider"
import {TooltipProvider} from "@/components/ui/tooltip"
import {TranslationProvider} from "@/lib/translations/context"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MIA",
  description: "MIA (Millennials Influencers Assistant) is an AI-powered content platform that helps influencers and content creators generate strategic campaigns, create engaging content, and manage client relationships efficiently.",
  keywords: ["AI content", "influencer tools", "content creation", "content assistant", "AI content generator", "campaign strategy", "social media content", "influencer content"],
  authors: [{ name: "MIA Team" }],
  creator: "MIA",
  publisher: "MIA",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://mia.community/",
    siteName: "MIA",
    title: "MIA",
    description: "Transform your content workflow with AI-powered content generation, strategic campaign planning, and intelligent client management.",
    images: [
      {
        url: "/mia_logo.svg",
        width: 1200,
        height: 630,
        alt: "MIA - Millennials Influencers Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MIA",
    description: "AI-powered content platform for influencers and content creators. Generate campaigns, create content, manage clients.",
    images: ["/mia_logo.svg"],
  },
  metadataBase: new URL("https://mia.community/",),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en-GB" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
        >
          <TranslationProvider>
            <ThemeProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </ThemeProvider>
          </TranslationProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
