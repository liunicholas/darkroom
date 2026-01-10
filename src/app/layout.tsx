import type { Metadata } from 'next'
import { Instrument_Serif, Manrope } from 'next/font/google'
import './globals.css'

// Elegant serif for branding
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
})

// Clean, refined sans for body
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Darkroom',
  description: 'Develop your photographs',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${manrope.variable}`}>
      <body className="bg-stone-950 text-stone-100 antialiased font-body">
        {children}
      </body>
    </html>
  )
}
