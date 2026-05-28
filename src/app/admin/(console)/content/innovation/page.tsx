import { Lightbulb } from 'lucide-react'
import { B9ContentAdminPage } from '@/components/admin/B9ContentAdminPage'

export const dynamic = 'force-dynamic'

export const metadata = { title: '技术专题 CMS - VESSEL' }

export default function AdminInnovationContentPage() {
  return B9ContentAdminPage({
    title: '技术专题',
    description: '维护 VI/IE、VIPC、VOLS 固定技术专题。',
    activeItem: 'innovation',
    kind: 'innovation',
    allowCategories: false,
    fixedSlugs: ['viie', 'vipc', 'vols'],
    heroTitle: 'Innovation 固定专题管理',
    heroDetail: '只开放固定专题的文本、图文段落、参数和 CTA，不开放自由 HTML/CSS，保证专题页视觉结构稳定。',
    Icon: Lightbulb,
  })
}
