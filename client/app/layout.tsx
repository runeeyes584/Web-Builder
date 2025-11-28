import { DeletedAccountCheck } from "@/components/deleted-account-check"
import { Toaster } from "@/components/ui/toaster"
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Website Builder - Drag & Drop Editor",
  description: "Professional drag-and-drop website builder with responsive design",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`font-sans ${inter.variable} antialiased`} suppressHydrationWarning>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
          <DeletedAccountCheck />
        </body>
      </html>
    </ClerkProvider>
  )
}
