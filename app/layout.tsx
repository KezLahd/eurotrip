import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Link from "next/link"
import { Instrument_Serif, DM_Sans, Caveat } from "next/font/google"
import { CurrentParticipantProvider } from "@/components/current-participant-context"

const serif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-serif" })
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand" })

export const metadata: Metadata = {
  title: "Eurotrip",
  description: "A private itinerary app for four mates through Europe.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${hand.variable}`}>
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
