'use client'

import { useEffect } from 'react'
import { migrateToMultiTenant } from '@/lib/migration'

export function MigrationWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Run migration on client-side only
    migrateToMultiTenant()
  }, [])

  return <>{children}</>
}