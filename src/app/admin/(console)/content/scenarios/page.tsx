import { Presentation } from 'lucide-react'
import { B9ContentAdminPage } from '@/components/admin/B9ContentAdminPage'

export const dynamic = 'force-dynamic'

export const metadata = { title: '场景方案 CMS - VESSEL' }

export default function AdminScenariosContentPage() {
  return B9ContentAdminPage({
    title: '场景方案',
    description: '维护固定场景页 tourism / commercial / public。',
    activeItem: 'scenarios',
    kind: 'scenario',
    allowCategories: false,
    fixedSlugs: ['tourism', 'commercial', 'public'],
    heroTitle: 'Scenarios 固定内容管理',
    heroDetail: '维护场景页标题、简介、参数、流程、推荐产品、关联案例和 CTA。',
    Icon: Presentation,
  })
}
