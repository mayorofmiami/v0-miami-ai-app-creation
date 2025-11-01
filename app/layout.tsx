import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "next-themes"
import { OnboardingModal } from "@/components/onboarding-modal"
import { PrefetchProvider } from "@/components/prefetch-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Miami.ai - AI-Powered Search Engine",
  description: "Get instant answers with real-time web research and citations",
  generator: "v0.app",
  applicationName: "Miami.ai",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Miami.ai",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PrefetchProvider />
          <OnboardingModal />
          {children}
          <Toaster
            position="top-center"
            offset="24px"
            toastOptions={{
              className: "mt-20",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
