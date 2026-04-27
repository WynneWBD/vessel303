'use client'

import { useState, useEffect, useRef } from 'react'
import ProtectedImage from '@/components/ProtectedImage'
import type { ShowcaseProject } from '@/data/showcaseProjects'

// ── Fade-in section wrapper ──────────────────────────────────────────────────
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
      { threshold: 0.05, rootMargin: '0px 0px -10px 0px' }
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

// ── Shared style tokens ───────────────────────────────────────────────────────
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
  divider: { height: 1, background: '#E5DED4', margin: '0 0 0' },
}

interface Props {
  project: ShowcaseProject | null
  lang: string
  onClose: () => void
}

export default function ProjectDetail({ project, lang, onClose }: Props) {
  const [currentImg, setCurrentImg] = useState(0)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const en = lang !== 'zh'

  const handleShare = async () => {
    if (!project) return
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://vessel303.com'
    const shareUrl = `${origin}/global?camp=${project.id}`
    const projectName = project.name[en ? 'en' : 'zh']
    const projectLocation = project.location[en ? 'en' : 'zh']
    const shareTitle = en
      ? `VESSEL · ${projectName}, ${projectLocation}`
      : `VESSEL 微宿 · ${projectName}(${projectLocation})`
    const shareText = en
      ? 'Explore this VESSEL prefab camp project.'
      : 'VESSEL 微宿全球营地项目'

    const nav = typeof navigator !== 'undefined' ? navigator : undefined
    if (nav && typeof nav.share === 'function') {
      try {
        await nav.share({ title: shareTitle, text: shareText, url: shareUrl })
        return
      } catch {
        // user dismissed the sheet, or share denied — fall through to clipboard
      }
    }
    try {
      await nav?.clipboard?.writeText(shareUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1800)
    } catch {
      window.prompt(en ? 'Copy the link:' : '复制链接:', shareUrl)
    }
  }

  // Carousel auto-advance
  useEffect(() => {
    if (!project) return
    const id = setInterval(() => {
      setCurrentImg(i => (i + 1) % project.images.length)
    }, 4000)
    return () => clearInterval(id)
  }, [project])

  // Reset carousel + scroll when project changes
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setCurrentImg(0)
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    })
    return () => cancelAnimationFrame(frame)
  }, [project?.id])

  if (!project) return null

  const t = en ? 'en' : 'zh'
  const name = project.name[t]
  const location = project.location[t]
  const description = project.description[t]

  return (
    <div
      ref={scrollRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        background: '#F5F2ED',
        position: 'relative',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(227,111,44,0.3) transparent',
      }}
    >

      {/* ── 1. Image Carousel ────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '50vh', minHeight: 280, overflow: 'hidden', background: '#0A0A0A', flexShrink: 0 }}>

        {/* Images */}
        {project.images.map((src, i) => (
          <div
            key={src}
            style={{
              position: 'absolute', inset: 0,
              opacity: i === currentImg ? 1 : 0,
              transition: 'opacity 0.9s ease',
            }}
          >
            <ProtectedImage
              src={src}
              alt={`${name} ${i + 1}`}
              fill
              sizes="70vw"
              style={{ objectFit: 'cover' }}
              priority={i === 0}
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.8) 100%)', pointerEvents: 'none' }} />

        {/* Share button (left of close) */}
        <button
          onClick={handleShare}
          aria-label={en ? 'Share' : '分享'}
          title={en ? 'Share this project' : '分享此项目'}
          style={{
            position: 'absolute', top: 16, right: 60, zIndex: 10,
            height: 36, padding: '0 12px',
            background: 'rgba(14,14,14,0.88)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 4, color: '#F5F2ED',
            cursor: 'pointer', fontSize: 13, lineHeight: 1,
            display: 'flex', alignItems: 'center', gap: 6,
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
          {en ? 'Share' : '分享'}
        </button>
        {shareCopied && (
          <div
            style={{
              position: 'absolute', top: 58, right: 60, zIndex: 11,
              background: 'rgba(14,14,14,0.95)',
              border: '1px solid rgba(227,111,44,0.4)',
              borderRadius: 4, color: '#E36F2C',
              fontSize: 12, padding: '6px 10px',
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              animation: 'vessel-fade-in 0.18s ease-out',
            }}
          >
            {en ? '✓ Link copied' : '✓ 链接已复制'}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            width: 36, height: 36,
            background: 'rgba(14,14,14,0.88)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 4, color: '#F5F2ED',
            cursor: 'pointer', fontSize: 20, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* Arrow buttons */}
        {(['left', 'right'] as const).map(side => (
          <button
            key={side}
            onClick={() => setCurrentImg(i =>
              side === 'left'
                ? (i - 1 + project.images.length) % project.images.length
                : (i + 1) % project.images.length
            )}
            style={{
              position: 'absolute', top: '50%', [side]: 14,
              transform: 'translateY(-50%)',
              width: 34, height: 34, zIndex: 10,
              background: 'rgba(14,14,14,0.72)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 4, color: '#F5F2ED',
              cursor: 'pointer', fontSize: 22, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {side === 'left' ? '‹' : '›'}
          </button>
        ))}

        {/* Dot indicators */}
        <div style={{
          position: 'absolute', bottom: 72, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 5, zIndex: 5,
        }}>
          {project.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImg(i)}
              style={{
                width: i === currentImg ? 18 : 6, height: 6,
                borderRadius: 3, padding: 0, border: 'none', cursor: 'pointer',
                background: i === currentImg ? '#E36F2C' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Project info overlay */}
        <div style={{ position: 'absolute', bottom: 22, left: 22, right: 60, zIndex: 5 }}>
          <div style={{ fontSize: 22, marginBottom: 5, lineHeight: 1 }}>{project.country}</div>
          <h1 style={{
            color: '#F5F2ED', fontSize: 21, fontWeight: 700,
            fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
            margin: '0 0 6px', lineHeight: 1.2,
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          }}>
            {name}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0,
            letterSpacing: '0.03em',
          }}>
            {location}
          </p>
        </div>
      </div>

      {/* ── 2. Stats Bar ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: '#FAF7F2',
        borderBottom: '1px solid #E5DED4',
      }}>
        {[
          { value: project.units !== null ? String(project.units) : '—', label: en ? 'Units' : '舱数' },
          { value: project.unitArea !== null ? `${project.unitArea}㎡` : '—', label: en ? 'Per Unit' : '每间面积' },
          { value: project.guests && project.guests !== 'TBD' ? project.guests : '—', label: en ? 'Guests' : '入住人数' },
          { value: project.openDate && project.openDate !== 'TBD' ? project.openDate : '—', label: en ? 'Opened' : '开业时间' },
        ].map(({ value, label }, i) => (
          <div key={label} style={{
            padding: '14px 10px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid #E5DED4' : 'none',
          }}>
            <div style={{
              color: '#E36F2C', fontSize: 20, fontWeight: 700,
              letterSpacing: '-0.02em',
              fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
            }}>
              {value}
            </div>
            <div style={{ color: '#8A7D74', fontSize: 10, marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Scrollable content sections ──────────────────────────────────── */}
      <div style={{ padding: '0 26px 48px' }}>

        {/* ── 3. Overview ─────────────────────────────────── */}
        <FadeSection style={{
          paddingTop: 28, paddingBottom: 26,
          borderBottom: '1px solid #E5DED4',
        }}>
          <div style={S.label}>{en ? 'Overview' : '项目概览'}</div>
          <h2 style={S.title}>{en ? 'About This Project' : '关于本项目'}</h2>
          <p style={S.body}>{description}</p>
        </FadeSection>

        {/* ── 4. Amenities ────────────────────────────────── */}
        <FadeSection style={{
          paddingTop: 26, paddingBottom: 26,
          borderBottom: '1px solid #E5DED4',
        }}>
          <div style={S.label}>{en ? 'Amenities' : '配套设施'}</div>
          <h2 style={S.title}>{en ? "What's Included" : '设施亮点'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {project.amenities.map((a, i) => (
              <div key={i} style={{
                background: '#FFFFFF',
                border: '1px solid #E5DED4',
                borderRadius: 8,
                padding: '11px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                <span style={{ color: '#5F5750', fontSize: 13, lineHeight: 1.3 }}>{a.label[t]}</span>
              </div>
            ))}
          </div>
        </FadeSection>

        {/* ── 5. Gallery ──────────────────────────────────── */}
        <FadeSection style={{
          paddingTop: 26, paddingBottom: 26,
          borderBottom: '1px solid #E5DED4',
        }}>
          <div style={S.label}>{en ? 'Gallery' : '项目图集'}</div>
          <h2 style={S.title}>{en ? 'Interior & Exterior' : '实景照片'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              project.images[1],  // interior-01
              project.images[0],  // exterior-01
              project.images[3],  // interior-02
              project.images[2],  // exterior-02
            ].filter(Boolean).map((src, i) => (
              <GalleryThumb key={src} src={src} alt={`${name} gallery ${i + 1}`} onClick={() => setLightboxSrc(src)} />
            ))}
          </div>
        </FadeSection>

        {/* ── 6. Transport & Location ─────────────────────── */}
        <FadeSection style={{
          paddingTop: 26, paddingBottom: 26,
          borderBottom: '1px solid #E5DED4',
        }}>
          <div style={S.label}>{en ? 'Getting There' : '交通指引'}</div>
          <h2 style={S.title}>{en ? 'Location & Transport' : '位置与交通'}</h2>

          <div style={{ marginBottom: 22 }}>
            {project.transport[t].map((item, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #E5DED4' : 'none',
              }}>
                <span style={{ fontSize: 17, flexShrink: 0, width: 22, textAlign: 'center', marginTop: 1 }}>{item.mode}</span>
                <span style={{ ...S.body, fontSize: 13, lineHeight: 1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <div style={{ color: '#8A7D74', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            {en ? 'Nearby Attractions' : '周边景点'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {project.nearby[t].map((n, i) => (
              <div key={i} style={{
                background: '#FFFFFF',
                border: '1px solid #E5DED4',
                borderRadius: 6,
                padding: '9px 12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: '#5F5750', fontSize: 12, lineHeight: 1.3 }}>{n.name}</span>
                <span style={{ color: '#E36F2C', fontSize: 11, flexShrink: 0 }}>{n.distance}</span>
              </div>
            ))}
          </div>
        </FadeSection>

        {/* ── 7. CTAs ─────────────────────────────────────── */}
        <FadeSection style={{ paddingTop: 26 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {project.bookingUrl && (
              <a
                href={project.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center',
                  background: '#E36F2C', color: '#FFFFFF',
                  padding: '13px 24px', textDecoration: 'none',
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
                  fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
                }}
              >
                {en ? '↗  BOOK NOW' : '↗  立即预订'}
              </a>
            )}
            <a
              href="https://en.303vessel.cn/contact.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center',
                border: '1px solid #E36F2C', color: '#E36F2C',
                padding: '12px 24px', textDecoration: 'none',
                fontSize: 13, fontWeight: 500, letterSpacing: '0.12em',
                fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
              }}
            >
              {en ? 'CONTACT VESSEL' : '联系 VESSEL'}
            </a>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none',
                color: '#8A7D74', cursor: 'pointer',
                fontSize: 13, padding: '6px 0',
                letterSpacing: '0.04em',
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              ← {en ? 'Back to Map' : '返回地图'}
            </button>
          </div>
        </FadeSection>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.93)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', width: '80vw', height: '80vh', maxWidth: 1400 }}>
            <ProtectedImage src={lightboxSrc} alt="" fill style={{ objectFit: 'contain' }} sizes="90vw" />
          </div>
          <button
            onClick={() => setLightboxSrc(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40,
              background: 'rgba(14,14,14,0.9)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 4, color: '#F5F2ED',
              cursor: 'pointer', fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

// ── Gallery thumbnail with hover scale ───────────────────────────────────────
function GalleryThumb({
  src, alt, onClick,
}: {
  src: string; alt: string; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio: '4/3',
        overflow: 'hidden',
        borderRadius: 4,
        cursor: 'zoom-in',
      }}
    >
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
    </div>
  )
}
