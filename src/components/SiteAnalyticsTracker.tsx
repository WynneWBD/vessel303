'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { sourceFromHref, trackContactRedirect, trackSiteEvent } from '@/lib/site-analytics-client'

function isTrackedCta(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href') ?? ''
  const label = anchor.textContent?.trim() ?? ''
  if (anchor.dataset.analyticsCta === 'true') return true
  if (href.includes('/contact') || href.includes('contact.html')) return true
  if (/inquiry|inquire|contact|consult|request|quote|purchase|book|download|询盘|咨询|联系|采购|报价|预订|下载/i.test(label)) return true
  return false
}

export default function SiteAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPageKey = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return
    const pageKey = `${pathname}?${searchParams.toString()}`
    if (lastPageKey.current === pageKey) return
    lastPageKey.current = pageKey
    trackSiteEvent('page_view', { path: pathname })
  }, [pathname, searchParams])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (!isTrackedCta(anchor)) return

      const href = anchor.getAttribute('href') ?? ''
      const label = anchor.textContent?.trim().slice(0, 80) ?? ''
      if (href.includes('contact.html') && !href.startsWith('/contact')) {
        trackContactRedirect(href, label)
        return
      }

      trackSiteEvent('cta_click', {
        source: sourceFromHref(href),
        metadata: {
          href: href.slice(0, 180),
          label,
        },
      })
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}
