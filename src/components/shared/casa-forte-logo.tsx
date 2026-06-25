'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const SIZES = {
  sidebar: 'h-7 w-auto',
  login: 'h-12 w-auto',
  header: 'h-8 w-auto',
} as const

export function CasaForteLogo({
  variant = 'header',
  fallbackClassName,
  className,
}: {
  variant?: keyof typeof SIZES
  fallbackClassName?: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className={cn('font-heading text-lg font-bold tracking-tight', fallbackClassName)}>
        Casa Forte
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-casa-forte.png"
      alt="Casa Forte"
      className={cn(SIZES[variant], 'object-contain', className)}
      onError={() => setFailed(true)}
    />
  )
}
