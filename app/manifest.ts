import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eurotrip Travel App',
  description: 'Your personalized travel itinerary for a European adventure.',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* ✅ This tells the browser where to find the correct dynamic manifest */}
        <link rel="manifest" href="/manifest" />
        <meta name="theme-color" content="#66B2E0" />
      </head>
      <body>{children}</body>
    </html>
  )
}
