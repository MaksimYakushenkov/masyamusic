import type { Metadata } from 'next'
import { Unbounded } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-unbounded',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MasyaMusic',
  description: 'Your personal music player',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={unbounded.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
