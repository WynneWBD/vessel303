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
    leadCapture: 'Default external contact',
    sourceRule: 'navbar:*_cta / footer:*_cta -> contact_redirect',
    status: 'external',
    risk: 'Main contact path still goes to 300 contact page by design; clicks keep source parameters for analytics.',
  },
  {
    key: 'products',
    area: 'Product list and detail',
    frontendHref: '/products',
    adminHref: '/admin/content/products',
    cta: 'Product detail inquiry form + Contact fallback',
    leadCapture: 'Writes to leads',
    sourceRule: 'product_detail:{productId}:inquiry_form',
    status: 'lead',
    risk: 'Fixed boutique product pages keep their existing custom forms/CTA.',
  },
  {
    key: 'cases',
    area: 'Project cases',
    frontendHref: '/cases',
    adminHref: '/admin/content/projects',
    cta: 'Case inquiry form',
    leadCapture: 'Writes to leads',
    sourceRule: 'case_detail:{caseId}:inquiry_form',
    status: 'lead',
    risk: 'Global remains a map display channel and is not managed here.',
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
    risk: 'FAQ content is CMS-managed; navigation order remains code-controlled.',
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
    risk: 'No private download or member permission layer in this phase.',
  },
  {
    key: 'scenarios',
    area: 'Scenarios',
    frontendHref: '/scenarios/tourism',
    adminHref: '/admin/content/scenarios',
    cta: 'Scenario inquiry form',
    leadCapture: 'Writes to leads',
    sourceRule: 'scenario:{slug}:inquiry_form',
    status: 'lead',
    risk: 'Only fixed scenario slugs are supported.',
  },
  {
    key: 'innovation',
    area: 'Innovation topics',
    frontendHref: '/innovation/viie',
    adminHref: '/admin/content/innovation',
    cta: 'Innovation inquiry form',
    leadCapture: 'Writes to leads',
    sourceRule: 'innovation:{slug}:inquiry_form',
    status: 'lead',
    risk: 'No free HTML/CSS editor is exposed.',
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
    leadCapture: 'Redirects to configured 300 contact page',
    sourceRule: 'contact_redirect source parameter',
    status: 'external',
    risk: 'This remains external until Wynne decides to switch main contact to self-owned forms.',
  },
]
