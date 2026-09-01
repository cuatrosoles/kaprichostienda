'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { HeroView } from '@/data/catalog'

export default function HeroSlider({ hero }: { hero: HeroView }) {
  const slides = hero.slides
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length
  const duration = `${hero.durationMs}ms`

  const go = useCallback(
    (next: number) => {
      if (!count) return
      setIndex(((next % count) + count) % count)
    },
    [count],
  )

  useEffect(() => {
    if (!hero.autoplay || paused || count < 2) return
    const id = setInterval(() => go(index + 1), hero.intervalMs)
    return () => clearInterval(id)
  }, [hero.autoplay, hero.intervalMs, paused, count, go, index])

  if (!slides[0]) return null

  return (
    <section
      className="relative bg-black text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrusel"
      aria-label="Promociones de inicio"
    >
      <div className="relative h-[calc(100svh-8.75rem)] min-h-[28rem] overflow-hidden md:h-[calc(100svh-12rem)]">
        {hero.transition === 'slide' ? (
          <div
            className="flex h-full"
            style={{
              width: `${count * 100}%`,
              transform: `translateX(-${(index * 100) / count}%)`,
              transition: `transform ${duration} ease-in-out`,
            }}
          >
            {slides.map((slide, i) => (
              <div key={`${slide.image}-${i}`} className="relative h-full shrink-0" style={{ width: `${100 / count}%` }}>
                <SlideMedia slide={slide} active={i === index} zoom={false} duration={duration} />
                <SlideCopy slide={slide} />
              </div>
            ))}
          </div>
        ) : (
          slides.map((slide, i) => (
            <div
              key={`${slide.image}-${i}`}
              className="absolute inset-0"
              style={{
                opacity: i === index ? 1 : 0,
                transition: `opacity ${duration} ease-in-out`,
                zIndex: i === index ? 1 : 0,
                pointerEvents: i === index ? 'auto' : 'none',
              }}
            >
              <SlideMedia slide={slide} active={i === index} zoom={hero.transition === 'zoom'} duration={duration} />
              <SlideCopy slide={slide} />
            </div>
          ))
        )}

        {count > 1 && hero.showArrows && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/40 bg-black/40 text-xl md:flex"
              onClick={() => go(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/40 bg-black/40 text-xl md:flex"
              onClick={() => go(index + 1)}
            >
              ›
            </button>
          </>
        )}

        {count > 1 && hero.showDots && (
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la diapositiva ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function SlideMedia({
  slide,
  active,
  zoom,
  duration,
}: {
  slide: HeroView['slides'][number]
  active: boolean
  zoom: boolean
  duration: string
}) {
  return (
    <>
      <img
        src={slide.image}
        alt={slide.alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          objectPosition: slide.objectPosition,
          transform: zoom && active ? 'scale(1.08)' : 'scale(1)',
          transition: zoom ? `transform ${Number(duration.replace('ms', '')) + 4000}ms ease-out` : undefined,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/10" />
    </>
  )
}

function SlideCopy({ slide }: { slide: HeroView['slides'][number] }) {
  const hasCopy = slide.eyebrow || slide.title || slide.badges.length || (slide.ctaLabel && slide.ctaHref)
  if (!hasCopy) return null

  return (
    <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12 md:pb-16">
      {slide.eyebrow && <p className="font-script text-6xl md:text-8xl">{slide.eyebrow}</p>}
      {slide.title && (
        <h1 className="font-display text-5xl uppercase tracking-wide text-kap-tan md:text-7xl">{slide.title}</h1>
      )}
      {(slide.badges.length > 0 || (slide.ctaLabel && slide.ctaHref)) && (
        <div className="mt-8 flex flex-wrap gap-3">
          {slide.badges.map((badge) => (
            <div key={badge} className="bg-black/80 px-4 py-3 text-[11px] uppercase tracking-nav text-kap-tan">
              {badge}
            </div>
          ))}
          {slide.ctaLabel && slide.ctaHref && (
            <Link href={slide.ctaHref} className="bg-white px-4 py-3 text-[11px] uppercase tracking-nav text-black">
              {slide.ctaLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
