import './globals.css'
import { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { Providers } from '@/omni'
import { AppFrame } from './AppFrame'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Omni Prototype',
  description: 'Next.js 15 App Router prototype',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  )
}

