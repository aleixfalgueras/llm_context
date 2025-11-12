import Image from 'next/image'

export function LandingBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Image
        src="/landing/home_background.png"
        alt="Background"
        fill
        className="object-cover opacity-15"
        priority
      />
      {/* Lavender overlay
      <div className="absolute inset-0 bg-lavanda opacity-[0.04]" />
      */}
    </div>
  )
}
