import { GalleryHorizontalEnd } from 'lucide-react'
import { B9ContentAdminPage } from '@/components/admin/B9ContentAdminPage'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Display CMS - VESSEL' }

export default function AdminDisplayContentPage() {
  return B9ContentAdminPage({
    title: 'Display 展示',
    description: '维护 Display 展示页橱窗内容。',
    activeItem: 'display',
    kind: 'display_slide',
    allowCategories: false,
    heroTitle: 'Display 展示内容',
    heroDetail: '优先读取后台配置；无配置时前台回到产品 CMS 橱窗或静态兜底，避免价格、图片和文案长期写死。',
    Icon: GalleryHorizontalEnd,
  })
}
