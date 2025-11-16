'use client'

import {ChevronRight, ChevronLeft} from 'lucide-react'
import {Button} from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import {useTranslations} from '@/lib/translations/context'
import {useEffect, useState} from 'react'
import {useAuth} from '@clerk/nextjs'
import {useRouter} from 'next/navigation'
import {LandingNavbar} from '@/components/landing/landing-navbar'
import {LandingFooter} from '@/components/landing/landing-footer'
import {LandingBackground} from '@/components/landing/landing-background'

// Carousel cards data
const carouselCards = [
  {
    id: 1,
    titleKey: 'landing.carousel.hostingWebsite',
    image: '/landing/carrousel/pc.jpg'
  },
  {
    id: 2,
    titleKey: 'landing.carousel.aiAggregator',
    image: '/landing/carrousel/ai.jpg'
  },
  {
    id: 3,
    titleKey: 'landing.carousel.afterworkMeetup',
    image: '/landing/carrousel/people2.jpg'
  },
  {
    id: 4,
    titleKey: 'landing.carousel.cryptoDex',
    image: '/landing/carrousel/crypto.jpg'
  }
]

export function LandingPage() {
  const t = useTranslations()
  const [currentIndex, setCurrentIndex] = useState(1) // Start with second card in center (index 1)
  const {isSignedIn, isLoaded} = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/clients')
    }
  }, [isLoaded, isSignedIn, router])

  // Navigation handlers with infinite loop
  const handlePrevious = () => {
    setCurrentIndex((currentIndex - 1 + carouselCards.length) % carouselCards.length)
  }

  const handleNext = () => {
    setCurrentIndex((currentIndex + 1) % carouselCards.length)
  }

  // Determine which cards to show (previous, current, next) with wrapping
  const getVisibleCards = () => {
    const totalCards = carouselCards.length

    // Calculate indices with wrapping
    const prevIndex = (currentIndex - 1 + totalCards) % totalCards
    const nextIndex = (currentIndex + 1) % totalCards

    return [
      { ...carouselCards[prevIndex], position: 'left' },
      { ...carouselCards[currentIndex], position: 'center' },
      { ...carouselCards[nextIndex], position: 'right' }
    ]
  }

  const visibleCards = getVisibleCards()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-x-hidden">
      <LandingBackground />

      {/* Content Layer */}
      <div className="relative z-10">
      <LandingNavbar />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-10 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center min-h-[75vh]">
          {/* Left Section - 33% */}
          <div className="w-full lg:w-1/3 flex flex-col items-center justify-center text-center">
            <h1 className="text-base md:text-lg lg:text-xl font-bold text-gray-100 mb-8 leading-relaxed">
              {t('landing.hero.title')}
            </h1>
            <Button
              className="bg-logo-gradient hover:brightness-110 text-white font-semibold px-6 py-3 text-sm shadow-lg hover:shadow-2xl hover:shadow-lavanda/50 transition-all duration-300 ease-out"
              onClick={() => router.push('/ecosystem')}
            >
              {t('landing.hero.learnMore')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Right Section - 67% Carousel */}
          <div className="w-full lg:w-2/3 relative">
            {/* Carousel Cards Container */}
            <div className="flex items-center justify-center relative">
              {visibleCards.map((card, index) => {
                const isCenterCard = card.position === 'center'
                const isLeftCard = card.position === 'left'
                const isRightCard = card.position === 'right'

                return (
                  <div
                    key={`${card.id}-${index}`}
                    className={`
                      relative transition-all duration-500 ease-in-out
                      w-64 md:w-80 lg:w-96
                      ${isCenterCard
                        ? 'scale-100 opacity-100 z-20'
                        : 'scale-75 opacity-70 z-10'
                      }
                      ${isLeftCard ? '-translate-x-2.5 md:-translate-x-3.5 lg:-translate-x-[18px] -rotate-6' : ''}
                      ${isRightCard ? 'translate-x-2.5 md:translate-x-3.5 lg:translate-x-[18px] rotate-6' : ''}
                    `}
                  >
                    {/* Card Container */}
                    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                      {/* Card Image */}
                      <div className="relative h-56 md:h-72 lg:h-80 overflow-hidden">
                        <Image
                          src={card.image}
                          alt={t(card.titleKey)}
                          fill
                          className="object-cover"
                          priority={isCenterCard}
                        />
                      </div>

                      {/* Card Footer */}
                      <div className={`
                        ${isCenterCard ? 'bg-cian' : 'bg-lavanda'} p-6 text-center
                      `}>
                        <h3 className="text-white font-bold text-lg md:text-xl mb-3 line-clamp-2 min-h-[4.5rem]">
                          {t(card.titleKey)}
                        </h3>

                        {/* Read More Button - Only on center card */}
                        {isCenterCard && (
                          <Button
                            onClick={() => router.push('/ecosystem')}
                            className="bg-white/20 hover:bg-white/30 text-white border border-white/50 font-semibold"
                            size="sm"
                          >
                            {t('landing.carousel.readMore')}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Left Arrow - positioned next to center card */}
                    {isCenterCard && (
                      <Button
                        onClick={handlePrevious}
                        className="absolute -left-6 md:-left-8 lg:-left-10 top-1/2 -translate-y-1/2 z-30 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full p-2 md:p-3 shadow-xl"
                        size="icon"
                      >
                        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                      </Button>
                    )}

                    {/* Right Arrow - positioned next to center card */}
                    {isCenterCard && (
                      <Button
                        onClick={handleNext}
                        className="absolute -right-6 md:-right-8 lg:-right-10 top-1/2 -translate-y-1/2 z-30 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full p-2 md:p-3 shadow-xl"
                        size="icon"
                      >
                        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
      </div>
    </div>
  )
}