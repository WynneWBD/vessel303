import { SITE_CONTACT_HREF } from '@/lib/site-links'

export type ConversionPathStatus = 'lead' | 'external' | 'partial' | 'review'

export type ConversionPathItem = {
  key: string
  area: string
  frontendHref: string
  adminHref: string
  cta: string
  leadCapture: string
  sourceRule: string
  status: ConversionPathStatus
  risk: string
}

export const CONVERSION_PATHS: ConversionPathItem[] = [
  {
    key: 'navbar',
    area: 'Navbar / Footer',
    frontendHref: '/',
    adminHref: '/admin/site/navigation',
    cta: 'Contact / Purchase / Book a Visit',
    leadCapture: 'Routes to new site contact form',
    sourceRule: 'navbar:*_cta / footer:*_cta -> contact:main:inquiry_form',
    status: 'lead',
    risk: 'Primary navigation stays inside the new site; legacy 300 contact/product URLs should be treated as backup or risk links.',
  },
  {
    key: 'products',
    area: 'Product list and detail',
    frontendHref: '/products',
    adminHref: '/admin/content/products',
    cta: 'Catalog inquiry CTA + product detail inquiry form',
    leadCapture: 'Writes to leads',
    sourceRule: 'product_detail:{productId}:inquiry_form',
    status: 'lead',
    risk: 'Mobile spacing, product image ratios, filter touch targets, detail anchors, and source-aware inquiry paths need periodic review; fixed boutique product pages keep their existing custom forms/CTA.',
  },
  {
    key: 'cases',
    area: 'Project cases',
    frontendHref: '/cases',
    adminHref: '/admin/content/projects',
    cta: 'Case list CTA + case inquiry form',
    leadCapture: 'Writes to leads',
    sourceRule: 'case_detail:{caseId}:inquiry_form',
    status: 'lead',
    risk: 'Mobile case card density, project image ratios, and scenario filtering cues need periodic review; Global remains a map display channel and is not managed here.',
  },
  {
    key: 'faq',
    area: 'FAQ',
    frontendHref: '/faq',
    adminHref: '/admin/content/faq',
    cta: 'FAQ inquiry form + Contact fallback',
    leadCapture: 'Writes to leads',
    sourceRule: 'faq:general:inquiry_form',
    status: 'lead',
    risk: 'FAQ mobile reading rhythm and CTA touch targets need periodic review; FAQ content is CMS-managed and navigation order remains code-controlled.',
  },
  {
    key: 'media-kit',
    area: 'Media Kit',
    frontendHref: '/media-kit',
    adminHref: '/admin/content/media-kit',
    cta: 'Media Kit request form',
    leadCapture: 'Writes to leads',
    sourceRule: 'media_kit:{useCase}:request_form',
    status: 'lead',
    risk: 'Media Kit mobile form spacing and resource card density need periodic review; no private download or member permission layer in this phase.',
  },
  {
    key: 'display',
    area: 'Display showroom',
    frontendHref: '/display',
    adminHref: '/admin/content/display',
    cta: 'Product detail fallback + contact handoff',
    leadCapture: 'Routes to new site contact form',
    sourceRule: 'display:showcase-contact -> contact:main:inquiry_form',
    status: 'lead',
    risk: 'Display stays a controlled showcase surface backed by published display_slide content; do not add free-form builder behavior or hardcode product facts.',
  },
  {
    key: 'scenarios',
    area: 'Scenarios',
    frontendHref: '/scenarios/tourism',
    adminHref: '/admin/content/scenarios',
    cta: 'Scenario path links + inquiry form',
    leadCapture: 'Writes to leads',
    sourceRule: 'scenario:{slug}:contact_cta / scenario:{slug}:inquiry_form',
    status: 'lead',
    risk: 'Scenario pages stay fixed-route and CMS-backed; product, case, and contact paths should not become a free-form builder surface.',
  },
  {
    key: 'innovation',
    area: 'Innovation topics',
    frontendHref: '/innovation/viie',
    adminHref: '/admin/content/innovation',
    cta: 'Innovation topic links + inquiry form',
    leadCapture: 'Writes to leads',
    sourceRule: 'innovation:{slug}:contact_cta / innovation:{slug}:inquiry_form',
    status: 'lead',
    risk: 'Topic pages stay fixed-route and CMS-backed; no free HTML/CSS editor is exposed and business facts must remain published or confirmed.',
  },
  {
    key: 'news',
    area: 'News detail',
    frontendHref: '/news',
    adminHref: '/admin/content/news',
    cta: 'Contact CTA with source parameter',
    leadCapture: 'External contact fallback',
    sourceRule: 'news:{slug}:contact_cta',
    status: 'partial',
    risk: 'News does not embed a form in this phase to keep reading pages light.',
  },
  {
    key: 'contact',
    area: 'Contact',
    frontendHref: '/contact',
    adminHref: '/admin/site/settings',
    cta: SITE_CONTACT_HREF,
    leadCapture: 'Writes to leads',
    sourceRule: 'contact:main:inquiry_form',
    status: 'lead',
    risk: 'site_settings.contactUrl is now only a legacy backup link; the main path is the new site contact form.',
  },
]
