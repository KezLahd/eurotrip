import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Link from "next/link"
import { CurrentParticipantProvider } from "@/components/current-participant-context"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <CurrentParticipantProvider>
          {children}
        </CurrentParticipantProvider>
      </body>
    </html>
  )
}
