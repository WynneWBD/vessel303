import { FileQuestion } from 'lucide-react'
import { B9ContentAdminPage } from '@/components/admin/B9ContentAdminPage'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'FAQ CMS - VESSEL' }

export default function AdminFaqContentPage() {
  return B9ContentAdminPage({
    title: 'FAQ CMS',
    description: '维护常见问题分类、排序和发布状态。',
    activeItem: 'faq',
    kind: 'faq',
    allowCategories: true,
    heroTitle: 'FAQ 固定内容管理',
    heroDetail: '用于 /faq 的问答分类、排序、草稿、发布和隐藏。前台查询失败或无发布内容时继续使用静态兜底。',
    Icon: FileQuestion,
  })
}
