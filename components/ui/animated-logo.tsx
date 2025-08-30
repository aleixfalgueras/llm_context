'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/general'

interface AnimatedLogoProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  duration?: number
  delay?: number
}

export function AnimatedLogo({
  src,
  alt,
  width,
  height,
  className,
  duration = 1000,
  delay = 0
}: AnimatedLogoProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={cn('relative inline-block', className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'relative z-10 transition-all duration-1000 ease-out transform-gpu',
          isVisible
            ? 'opacity-100 rotateY-0'
            : 'opacity-0 rotateY-90'
        )}
        priority
      />
    </div>
  )
}