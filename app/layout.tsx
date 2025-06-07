import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Link from "next/link"
import { CurrentParticipantProvider } from "@/components/current-participant-context"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Image_fx (38).png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <CurrentParticipantProvider>
          {children}
        </CurrentParticipantProvider>
      </body>
    </html>
  )
}
