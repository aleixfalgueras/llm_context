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
  description: "AI-powered marketing content generation platform",
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
