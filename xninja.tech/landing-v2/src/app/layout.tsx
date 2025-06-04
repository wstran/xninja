import { VT323, Source_Sans_3 } from 'next/font/google'
import clsx from 'clsx'

import '@/styles/tailwind.css'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s - XNinja',
    default: 'XNinja - the first X-SocialFi game built on Injective',
  },
  description:
    'XNinja - the first X-SocialFi game built on Injective',
}

const sans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const vt323 = VT323({
  weight: "400",
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-vt323',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={clsx(
        'h-full scroll-smooth bg-gray-300 antialiased',
        vt323.variable,
        sans.variable,
      )}
    >
      <body className="flex h-full flex-col">{children}</body>
    </html>
  )
}
