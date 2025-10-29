import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "next-themes"
import { OnboardingModal } from "@/components/onboarding-modal"

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <OnboardingModal />
          {children}
          <Toaster
            position="bottom-right"
            offset="100px"
            toastOptions={{
              className: "mb-20",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
