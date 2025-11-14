import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "next-themes"
import { PrefetchProvider } from "@/components/prefetch-provider"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Miami.ai - AI-Powered Search Engine",
  description: "Get instant answers with real-time web research and citations",
  generator: "v0.app",
  applicationName: "Miami.ai",
  keywords: ["AI search", "search engine", "web research", "AI assistant", "real-time search"],
  authors: [{ name: "Miami.ai" }],
  creator: "Miami.ai",
  publisher: "Miami.ai",
  metadataBase: new URL("https://miami.ai"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.jpg", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.jpg", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://miami.ai",
    siteName: "Miami.ai",
    title: "Miami.ai - AI-Powered Search Engine",
    description: "Get instant answers with real-time web research and citations",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Miami.ai - AI-Powered Search Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Miami.ai - AI-Powered Search Engine",
    description: "Get instant answers with real-time web research and citations",
    images: ["/og-image.jpg"],
    creator: "@miamiAI",
  },
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
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PrefetchProvider />
          {children}
          <Toaster
            position="top-center"
            offset="24px"
            toastOptions={{
              className: "mt-20",
            }}
          />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
