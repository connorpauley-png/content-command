import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar, MobileNav } from '@/components/layout/sidebar'
import { MigrationWrapper } from '@/components/migration-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Content Command',
  description: 'Social media content automation platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <MigrationWrapper>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              {children}
            </main>
          </div>
          <MobileNav />
        </MigrationWrapper>
      </body>
    </html>
  )
}
