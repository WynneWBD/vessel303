'use client'

import { useEffect, useRef, useState } from 'react'
import ProtectedImage from '@/components/ProtectedImage'
import type { ShowcaseProject } from '@/data/showcaseProjects'
import { DEFAULT_CONTACT_URL } from '@/lib/site-links'
import { buildGlobalCmsLabels, type GlobalPageModuleLike } from '@/lib/global-page-cms'

function FadeSection({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.disconnect()
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -10px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(18px)',
        transition: 'opacity 0.55s ease, transform 0.55s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

const S = {
  label: {
    color: '#E36F2C',
    fontSize: 11,
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    marginBottom: 8,
    fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
  },
  title: {
    color: '#241F1B',
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
    letterSpacing: '-0.01em',
    margin: '0 0 20px',
  },
  body: {
    color: '#5F5750',
    fontSize: 15,
    lineHeight: 1.78,
    fontFamily: "var(--font-body), 'Inter', sans-serif",
  },
}

interface Props {
  project: ShowcaseProject | null
  lang: string
  pageModules?: GlobalPageModuleLike[]
  onClose: () => void
}

export default function ProjectDetail({
  project,
  lang,
  pageModules = [],
  onClose,
}: Props) {
  const [currentImg, setCurrentImg] = useState(0)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const en = lang !== 'zh'
  const t = en ? 'en' : 'zh'
  const labels = buildGlobalCmsLabels(pageModules, t)

  useEffect(() => {
    if (!project || project.images.length <= 1) return
    const id = setInterval(() => {
      setCurrentImg((index) => (index + 1) % project.images.length)
    }, 4000)
    return () => clearInterval(id)
  }, [project])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setCurrentImg(0)
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    })
    return () => cancelAnimationFrame(frame)
  }, [project?.id])

  if (!project) return null

  const name = project.name[t]
  const location = project.location[t]
  const description = project.description[t]
  const safeCurrentImg = project.images[currentImg] ? currentImg : 0
  const currentImageSrc = project.images[safeCurrentImg]
  const stats = [
    { value: project.units !== null ? String(project.units) : '-', label: labels.unitsLabel },
    { value: project.unitArea !== null ? `${project.unitArea} sqm` : '-', label: labels.perUnitLabel },
    { value: project.guests && project.guests !== 'TBD' ? project.guests : '-', label: labels.guestsLabel },
    { value: project.openDate && project.openDate !== 'TBD' ? project.openDate : '-', label: labels.openedLabel },
  ]

  const handleShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vessel303.com'
    const shareUrl = `${origin}/global?camp=${project.id}`
    const shareTitle = en
      ? `${labels.shareTitlePrefix} · ${name}, ${location}`
      : `${labels.shareTitlePrefix} · ${name} (${location})`
    const nav = typeof navigator !== 'undefined' ? navigator : undefined

    if (nav && typeof nav.share === 'function') {
      try {
        await nav.share({ title: shareTitle, text: labels.shareText, url: shareUrl })
        return
      } catch {
        // Continue to clipboard fallback.
      }
    }

    try {
      await nav?.clipboard?.writeText(shareUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1800)
    } catch {
      window.prompt(labels.copyPrompt, shareUrl)
    }
  }

  return (
    <div
      ref={scrollRef}
      data-page-module="global:detail-labels"
      data-page-key="global"
      data-module-key="detail-labels"
      style={{
        height: '100%',
        overflowY: 'auto',
        background: '#F5F2ED',
        position: 'relative',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(227,111,44,0.3) transparent',
      }}
    >
      <div style={{ position: 'relative', height: '50vh', minHeight: 280, overflow: 'hidden', background: '#0A0A0A', flexShrink: 0 }}>
        {currentImageSrc ? (
          <div
            key={currentImageSrc}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 1,
              transition: 'opacity 0.9s ease',
            }}
          >
            <ProtectedImage
              src={currentImageSrc}
              alt={`${name} ${safeCurrentImg + 1}`}
              fill
              sizes="70vw"
              style={{ objectFit: 'cover' }}
              priority={safeCurrentImg === 0}
            />
          </div>
        ) : null}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.8) 100%)', pointerEvents: 'none' }} />

        <button
          onClick={handleShare}
          aria-label={labels.shareLabel}
          title={labels.shareLabel}
          style={{
            position: 'absolute',
            top: 16,
            right: 60,
            zIndex: 10,
            height: 36,
            padding: '0 12px',
            background: 'rgba(14,14,14,0.88)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 4,
            color: '#F5F2ED',
            cursor: 'pointer',
            fontSize: 13,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {labels.shareLabel}
        </button>
        {shareCopied ? (
          <div
            style={{
              position: 'absolute',
              top: 58,
              right: 60,
              zIndex: 11,
              background: 'rgba(14,14,14,0.95)',
              border: '1px solid rgba(227,111,44,0.4)',
              borderRadius: 4,
              color: '#E36F2C',
              fontSize: 12,
              padding: '6px 10px',
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              animation: 'vessel-fade-in 0.18s ease-out',
            }}
          >
            {labels.linkCopied}
          </div>
        ) : null}

        <button
          onClick={onClose}
          aria-label={buildGlobalCmsLabels(pageModules, t).closeLabel}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            width: 36,
            height: 36,
            background: 'rgba(14,14,14,0.88)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 4,
            color: '#F5F2ED',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          x
        </button>

        {project.images.length > 1 ? (
          (['left', 'right'] as const).map((side) => (
            <button
              key={side}
              onClick={() => setCurrentImg((index) => (
                side === 'left'
                  ? (index - 1 + project.images.length) % project.images.length
                  : (index + 1) % project.images.length
              ))}
              style={{
                position: 'absolute',
                top: '50%',
                [side]: 14,
                transform: 'translateY(-50%)',
                width: 34,
                height: 34,
                zIndex: 10,
                background: 'rgba(14,14,14,0.72)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 4,
                color: '#F5F2ED',
                cursor: 'pointer',
                fontSize: 22,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {side === 'left' ? '<' : '>'}
            </button>
          ))
        ) : null}

        <div style={{ position: 'absolute', bottom: 72, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5, zIndex: 5 }}>
          {project.images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              onClick={() => setCurrentImg(index)}
              aria-label={`${labels.galleryTitle} ${index + 1}`}
              style={{
                width: index === currentImg ? 18 : 6,
                height: 6,
                borderRadius: 3,
                padding: 0,
                border: 'none',
                cursor: 'pointer',
                background: index === currentImg ? '#E36F2C' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 22, left: 22, right: 60, zIndex: 5 }}>
          <div style={{ fontSize: 22, marginBottom: 5, lineHeight: 1 }}>{project.country}</div>
          <h1 style={{
            color: '#F5F2ED',
            fontSize: 21,
            fontWeight: 700,
            fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
            margin: '0 0 6px',
            lineHeight: 1.2,
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          }}>
            {name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, letterSpacing: '0.03em' }}>
            {location}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#FAF7F2', borderBottom: '1px solid #E5DED4' }}>
        {stats.map(({ value, label }, index) => (
          <div
            key={label}
            style={{
              padding: '14px 10px',
              textAlign: 'center',
              borderRight: index < 3 ? '1px solid #E5DED4' : 'none',
            }}
          >
            <div style={{ color: '#E36F2C', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "var(--font-heading), 'DM Sans', sans-serif" }}>
              {value}
            </div>
            <div style={{ color: '#8A7D74', fontSize: 10, marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 26px 48px' }}>
        <FadeSection style={{ paddingTop: 28, paddingBottom: 26, borderBottom: '1px solid #E5DED4' }}>
          <div style={S.label}>{labels.overviewEyebrow}</div>
          <h2 style={S.title}>{labels.overviewTitle}</h2>
          <p style={S.body}>{description}</p>
        </FadeSection>

        <FadeSection style={{ paddingTop: 26, paddingBottom: 26, borderBottom: '1px solid #E5DED4' }}>
          <div style={S.label}>{labels.amenitiesEyebrow}</div>
          <h2 style={S.title}>{labels.amenitiesTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {project.amenities.map((amenity, index) => (
              <div
                key={`${amenity.label[t]}-${index}`}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5DED4',
                  borderRadius: 8,
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{amenity.icon}</span>
                <span style={{ color: '#5F5750', fontSize: 13, lineHeight: 1.3 }}>{amenity.label[t]}</span>
              </div>
            ))}
          </div>
        </FadeSection>

        <FadeSection style={{ paddingTop: 26, paddingBottom: 26, borderBottom: '1px solid #E5DED4' }}>
          <div style={S.label}>{labels.galleryEyebrow}</div>
          <h2 style={S.title}>{labels.galleryTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[project.images[1], project.images[0], project.images[3], project.images[2]]
              .filter((src): src is string => Boolean(src))
              .map((src, index) => (
                <GalleryThumb key={src} src={src} alt={`${name} ${labels.galleryTitle} ${index + 1}`} onClick={() => setLightboxSrc(src)} />
              ))}
          </div>
        </FadeSection>

        <FadeSection style={{ paddingTop: 26, paddingBottom: 26, borderBottom: '1px solid #E5DED4' }}>
          <div style={S.label}>{labels.transportEyebrow}</div>
          <h2 style={S.title}>{labels.transportTitle}</h2>

          <div style={{ marginBottom: 22 }}>
            {project.transport[t].map((item, index, arr) => (
              <div
                key={`${item.text}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: index < arr.length - 1 ? '1px solid #E5DED4' : 'none',
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0, width: 22, textAlign: 'center', marginTop: 1 }}>{item.mode}</span>
                <span style={{ ...S.body, fontSize: 13, lineHeight: 1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <div style={{ color: '#8A7D74', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            {labels.nearbyTitle}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {project.nearby[t].map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5DED4',
                  borderRadius: 6,
                  padding: '9px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: '#5F5750', fontSize: 12, lineHeight: 1.3 }}>{item.name}</span>
                <span style={{ color: '#E36F2C', fontSize: 11, flexShrink: 0 }}>{item.distance}</span>
              </div>
            ))}
          </div>
        </FadeSection>

        <FadeSection style={{ paddingTop: 26 }}>
          <div
            data-page-module="global:cta-labels"
            data-page-key="global"
            data-module-key="cta-labels"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {project.bookingUrl ? (
              <a
                href={project.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#E36F2C',
                  color: '#FFFFFF',
                  padding: '13px 24px',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
                }}
              >
                {labels.bookNowLabel}
              </a>
            ) : null}
            <a
              href={DEFAULT_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                border: '1px solid #E36F2C',
                color: '#E36F2C',
                padding: '12px 24px',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.12em',
                fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
              }}
            >
              {labels.contactLabel}
            </a>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8A7D74',
                cursor: 'pointer',
                fontSize: 13,
                padding: '6px 0',
                letterSpacing: '0.04em',
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              {labels.backToMapLabel}
            </button>
          </div>
        </FadeSection>
      </div>

      {lightboxSrc ? (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0,0,0,0.93)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', width: '80vw', height: '80vh', maxWidth: 1400 }}>
            <ProtectedImage src={lightboxSrc} alt="" fill style={{ objectFit: 'contain' }} sizes="90vw" />
          </div>
          <button
            onClick={() => setLightboxSrc(null)}
            aria-label={buildGlobalCmsLabels(pageModules, t).closeLabel}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              background: 'rgba(14,14,14,0.9)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 4,
              color: '#F5F2ED',
              cursor: 'pointer',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            x
          </button>
        </div>
      ) : null}
    </div>
  )
}

function GalleryThumb({
  src,
  alt,
  onClick,
}: {
  src: string
  alt: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setShouldLoad(true))
      return () => cancelAnimationFrame(frame)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '180px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleClick = () => {
    setShouldLoad(true)
    onClick()
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio: '4/3',
        overflow: 'hidden',
        borderRadius: 4,
        cursor: 'zoom-in',
        background: '#E5DED4',
      }}
    >
      {shouldLoad ? (
        <ProtectedImage
          src={src}
          alt={alt}
          fill
          sizes="35vw"
          style={{
            objectFit: 'cover',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.35s ease',
          }}
        />
      ) : null}
    </div>
  )
}
