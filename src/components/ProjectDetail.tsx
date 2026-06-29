'use client'

import { useEffect, useRef, useState } from 'react'
import ProtectedImage from '@/components/ProtectedImage'
import type { ShowcaseProject, ShowcaseProjectImageSource } from '@/data/showcaseProjects'
import { DEFAULT_CONTACT_URL } from '@/lib/site-links'
import {
  buildGlobalCmsLabels,
  globalItemAttrs,
  globalModuleAttrs,
  type GlobalCmsLang,
  type GlobalPageModuleLike,
} from '@/lib/global-page-cms'

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

type GlobalProjectEditInput = 'text' | 'textarea' | 'image' | 'number'

type GlobalProjectEditOptions = {
  patchKey: string
  section?: 'basic' | 'media' | 'content' | 'params' | 'publish-check' | 'global'
  input?: GlobalProjectEditInput
  arrayIndex?: number
  objectPath?: string
  maxLength?: number
  required?: boolean
  nullable?: boolean
  value?: string | number | null
  displaySuffix?: string
}

function globalProjectCmsEditAttrs(
  projectId: string,
  editable: boolean,
  field: string,
  targetId: string,
  options: GlobalProjectEditOptions,
) {
  if (!editable) return {}

  const attrs: Record<string, string> = {
    'data-cms-edit-kind': 'project',
    'data-cms-edit-title': 'Global 项目',
    'data-cms-edit-field': field,
    'data-cms-edit-url': `/admin/content/projects/${encodeURIComponent(projectId)}/edit#${options.section ?? 'global'}`,
    'data-cms-edit-id': `global-project-${projectId}-${targetId}`,
    'data-cms-edit-api-url': `/api/admin/projects/${encodeURIComponent(projectId)}`,
    'data-cms-edit-patch-key': options.patchKey,
    'data-cms-edit-input': options.input ?? 'text',
  }

  if (options.arrayIndex != null) attrs['data-cms-edit-array-index'] = String(options.arrayIndex)
  if (options.objectPath) attrs['data-cms-edit-object-path'] = options.objectPath
  if (options.maxLength != null) attrs['data-cms-edit-max-length'] = String(options.maxLength)
  if (options.required) attrs['data-cms-edit-required'] = '1'
  if (options.nullable) attrs['data-cms-edit-nullable'] = '1'
  if (options.displaySuffix) attrs['data-cms-edit-display-suffix'] = options.displaySuffix
  if (options.value != null) attrs['data-cms-edit-value'] = String(options.value)

  return attrs
}

function globalProjectImageEditAttrs(
  projectId: string,
  editable: boolean,
  source: ShowcaseProjectImageSource | undefined,
  targetId: string,
  value: string | undefined,
) {
  if (!source) return {}
  return globalProjectCmsEditAttrs(projectId, editable, '项目图片', targetId, {
    section: 'media',
    patchKey: source.patchKey,
    input: 'image',
    arrayIndex: source.arrayIndex,
    maxLength: 500,
    nullable: source.patchKey === 'cover_image_url',
    required: source.patchKey === 'images',
    value: value ?? '',
  })
}

interface Props {
  project: ShowcaseProject | null
  lang: string
  editable?: boolean
  pageModules?: GlobalPageModuleLike[]
  onClose: () => void
}

export default function ProjectDetail({
  project,
  lang,
  editable = false,
  pageModules = [],
  onClose,
}: Props) {
  const [currentImg, setCurrentImg] = useState(0)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const en = lang !== 'zh'
  const t: GlobalCmsLang = en ? 'en' : 'zh'
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
  const namePatchKey = t === 'zh' ? 'name_zh' : 'name_en'
  const locationPatchKey = t === 'zh' ? 'location_zh' : 'location_en'
  const descriptionPatchKey = t === 'zh' ? 'description_zh' : 'description_en'
  const transportPatchKey = t === 'zh' ? 'global_transport_zh' : 'global_transport_en'
  const nearbyPatchKey = t === 'zh' ? 'global_nearby_zh' : 'global_nearby_en'
  const hasEditableTransport = Boolean(project.cmsGlobalSources?.transport?.[t])
  const hasEditableNearby = Boolean(project.cmsGlobalSources?.nearby?.[t])
  const hasEditableAmenities = Boolean(project.cmsGlobalSources?.amenities)
  const currentImageEditAttrs = globalProjectImageEditAttrs(
    project.id,
    editable,
    project.cmsImageSources?.[safeCurrentImg],
    `hero-image-${safeCurrentImg}`,
    currentImageSrc,
  )
  const galleryImages = [1, 0, 3, 2].flatMap((imageIndex) => {
    const src = project.images[imageIndex]
    return src ? [{ src, imageIndex }] : []
  })
  const stats = [
    {
      value: project.units !== null ? String(project.units) : '-',
      rawValue: project.units,
      label: labels.unitsLabel,
      labelItemId: 'units',
      editField: '房间/舱体数量',
      patchKey: 'global_units',
      input: 'number' as const,
    },
    {
      value: project.unitArea !== null ? `${project.unitArea} sqm` : '-',
      rawValue: project.unitArea,
      label: labels.perUnitLabel,
      labelItemId: 'per-unit',
      editField: '单体面积',
      patchKey: 'global_unit_area',
      input: 'number' as const,
      displaySuffix: ' sqm',
    },
    {
      value: project.guests && project.guests !== 'TBD' ? project.guests : '-',
      rawValue: project.guests && project.guests !== 'TBD' ? project.guests : '',
      label: labels.guestsLabel,
      labelItemId: 'guests',
      editField: '入住人数',
      patchKey: 'global_guests',
      input: 'text' as const,
    },
    {
      value: project.openDate && project.openDate !== 'TBD' ? project.openDate : '-',
      rawValue: project.openDate && project.openDate !== 'TBD' ? project.openDate : '',
      label: labels.openedLabel,
      labelItemId: 'opened',
      editField: '开放时间',
      patchKey: 'global_open_date',
      input: 'text' as const,
    },
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
      {...globalModuleAttrs('detail-labels')}
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
            {...currentImageEditAttrs}
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
          {...globalItemAttrs('detail-labels', 'share', t)}
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
            {...globalItemAttrs('detail-labels', 'link-copied', t)}
          >
            {labels.linkCopied}
          </div>
        ) : null}

        <button
          onClick={onClose}
          aria-label={buildGlobalCmsLabels(pageModules, t).closeLabel}
          {...globalItemAttrs('map-labels', 'close', t)}
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
          <div
            style={{ fontSize: 22, marginBottom: 5, lineHeight: 1 }}
            {...globalProjectCmsEditAttrs(project.id, editable, '国家/旗帜', 'country', {
              patchKey: 'country',
              maxLength: 80,
              value: project.country,
            })}
          >
            {project.country}
          </div>
          <h1 style={{
            color: '#F5F2ED',
            fontSize: 21,
            fontWeight: 700,
            fontFamily: "var(--font-heading), 'DM Sans', sans-serif",
            margin: '0 0 6px',
            lineHeight: 1.2,
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          }}
          {...globalProjectCmsEditAttrs(project.id, editable, '项目名称', `name-${t}`, {
            patchKey: namePatchKey,
            maxLength: 220,
            required: true,
            value: name,
          })}
          >
            {name}
          </h1>
          <p
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, letterSpacing: '0.03em' }}
            {...globalProjectCmsEditAttrs(project.id, editable, '项目地点', `location-${t}`, {
              patchKey: locationPatchKey,
              maxLength: 220,
              required: true,
              value: location,
            })}
          >
            {location}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#FAF7F2', borderBottom: '1px solid #E5DED4' }}>
        {stats.map(({ value, rawValue, label, labelItemId, editField, patchKey, input, displaySuffix }, index) => {
          return (
          <div
            key={label}
            style={{
              padding: '14px 10px',
              textAlign: 'center',
              borderRight: index < 3 ? '1px solid #E5DED4' : 'none',
            }}
          >
            <div
              style={{ color: '#E36F2C', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "var(--font-heading), 'DM Sans', sans-serif" }}
              {...globalProjectCmsEditAttrs(project.id, editable, editField, `stat-${labelItemId}`, {
                patchKey,
                input,
                maxLength: input === 'number' ? undefined : 80,
                nullable: true,
                value: rawValue,
                displaySuffix,
              })}
            >
              {value}
            </div>
            <div
              style={{ color: '#8A7D74', fontSize: 10, marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              {...globalItemAttrs('detail-labels', labelItemId, t)}
            >
              {label}
            </div>
          </div>
          )
        })}
      </div>

      <div style={{ padding: '0 26px 48px' }}>
        <FadeSection style={{ paddingTop: 28, paddingBottom: 26, borderBottom: '1px solid #E5DED4' }}>
          <div style={S.label} {...globalItemAttrs('detail-labels', 'overview-eyebrow', t)}>{labels.overviewEyebrow}</div>
          <h2 style={S.title} {...globalItemAttrs('detail-labels', 'overview-title', t)}>{labels.overviewTitle}</h2>
          <p
            style={S.body}
            {...globalProjectCmsEditAttrs(project.id, editable, '项目说明', `description-${t}`, {
              patchKey: descriptionPatchKey,
              input: 'textarea',
              maxLength: 6000,
              value: description,
            })}
          >
            {description}
          </p>
        </FadeSection>

        <FadeSection style={{ paddingTop: 26, paddingBottom: 26, borderBottom: '1px solid #E5DED4' }}>
          <div style={S.label} {...globalItemAttrs('detail-labels', 'amenities-eyebrow', t)}>{labels.amenitiesEyebrow}</div>
          <h2 style={S.title} {...globalItemAttrs('detail-labels', 'amenities-title', t)}>{labels.amenitiesTitle}</h2>
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
                <span
                  style={{ fontSize: 18, flexShrink: 0 }}
                  {...globalProjectCmsEditAttrs(project.id, editable && hasEditableAmenities, '设施图标', `amenity-${index}-icon`, {
                    patchKey: 'global_amenities',
                    arrayIndex: index,
                    objectPath: 'icon',
                    maxLength: 12,
                    required: true,
                    value: amenity.icon,
                  })}
                >
                  {amenity.icon}
                </span>
                <span
                  style={{ color: '#5F5750', fontSize: 13, lineHeight: 1.3 }}
                  {...globalProjectCmsEditAttrs(project.id, editable && hasEditableAmenities, '设施名称', `amenity-${index}-label-${t}`, {
                    patchKey: 'global_amenities',
                    arrayIndex: index,
                    objectPath: `label.${t}`,
                    maxLength: t === 'zh' ? 120 : 160,
                    required: true,
                    value: amenity.label[t],
                  })}
                >
                  {amenity.label[t]}
                </span>
              </div>
            ))}
          </div>
        </FadeSection>

        <FadeSection style={{ paddingTop: 26, paddingBottom: 26, borderBottom: '1px solid #E5DED4' }}>
          <div style={S.label} {...globalItemAttrs('detail-labels', 'gallery-eyebrow', t)}>{labels.galleryEyebrow}</div>
          <h2 style={S.title} {...globalItemAttrs('detail-labels', 'gallery-title', t)}>{labels.galleryTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {galleryImages.map(({ src, imageIndex }, index) => (
              <GalleryThumb
                key={`${src}-${imageIndex}`}
                src={src}
                alt={`${name} ${labels.galleryTitle} ${index + 1}`}
                editAttrs={globalProjectImageEditAttrs(
                  project.id,
                  editable,
                  project.cmsImageSources?.[imageIndex],
                  `gallery-image-${imageIndex}`,
                  src,
                )}
                onClick={() => setLightboxSrc(src)}
              />
            ))}
          </div>
        </FadeSection>

        <FadeSection style={{ paddingTop: 26, paddingBottom: 26, borderBottom: '1px solid #E5DED4' }}>
          <div style={S.label} {...globalItemAttrs('detail-labels', 'transport-eyebrow', t)}>{labels.transportEyebrow}</div>
          <h2 style={S.title} {...globalItemAttrs('detail-labels', 'transport-title', t)}>{labels.transportTitle}</h2>

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
                <span
                  style={{ fontSize: 17, flexShrink: 0, width: 22, textAlign: 'center', marginTop: 1 }}
                  {...globalProjectCmsEditAttrs(project.id, editable && hasEditableTransport, '交通图标', `transport-${t}-${index}-mode`, {
                    patchKey: transportPatchKey,
                    arrayIndex: index,
                    objectPath: 'mode',
                    maxLength: 12,
                    required: true,
                    value: item.mode,
                  })}
                >
                  {item.mode}
                </span>
                <span
                  style={{ ...S.body, fontSize: 13, lineHeight: 1.6 }}
                  {...globalProjectCmsEditAttrs(project.id, editable && hasEditableTransport, '交通说明', `transport-${t}-${index}-text`, {
                    patchKey: transportPatchKey,
                    arrayIndex: index,
                    objectPath: 'text',
                    maxLength: 220,
                    required: true,
                    value: item.text,
                  })}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{ color: '#8A7D74', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}
            {...globalItemAttrs('detail-labels', 'nearby-title', t)}
          >
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
                <span
                  style={{ color: '#5F5750', fontSize: 12, lineHeight: 1.3 }}
                  {...globalProjectCmsEditAttrs(project.id, editable && hasEditableNearby, '周边名称', `nearby-${t}-${index}-name`, {
                    patchKey: nearbyPatchKey,
                    arrayIndex: index,
                    objectPath: 'name',
                    maxLength: 120,
                    required: true,
                    value: item.name,
                  })}
                >
                  {item.name}
                </span>
                <span
                  style={{ color: '#E36F2C', fontSize: 11, flexShrink: 0 }}
                  {...globalProjectCmsEditAttrs(project.id, editable && hasEditableNearby, '周边距离', `nearby-${t}-${index}-distance`, {
                    patchKey: nearbyPatchKey,
                    arrayIndex: index,
                    objectPath: 'distance',
                    maxLength: 120,
                    required: true,
                    value: item.distance,
                  })}
                >
                  {item.distance}
                </span>
              </div>
            ))}
          </div>
        </FadeSection>

        <FadeSection style={{ paddingTop: 26 }}>
          <div
            {...globalModuleAttrs('cta-labels')}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {project.bookingUrl || editable ? (
              <a
                href={project.bookingUrl || '#'}
                target={project.bookingUrl ? '_blank' : undefined}
                rel={project.bookingUrl ? 'noopener noreferrer' : undefined}
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
                {...globalItemAttrs('cta-labels', 'book-now', t)}
                {...globalProjectCmsEditAttrs(project.id, editable, '预订链接', 'booking-url', {
                  patchKey: 'global_booking_url',
                  maxLength: 500,
                  nullable: true,
                  value: project.bookingUrl,
                })}
              >
                <span {...globalItemAttrs('cta-labels', 'book-now', t)}>{labels.bookNowLabel}</span>
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
              {...globalItemAttrs('cta-labels', 'contact', t)}
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
              {...globalItemAttrs('cta-labels', 'back-to-map', t)}
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
  editAttrs = {},
  onClick,
}: {
  src: string
  alt: string
  editAttrs?: Record<string, string>
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
      {...editAttrs}
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
