import { FileQuestion } from 'lucide-react'
import { B9ContentAdminPage } from '@/components/admin/B9ContentAdminPage'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'FAQ CMS - VESSEL' }

type AdminFaqContentPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminFaqContentPage({ searchParams }: AdminFaqContentPageProps) {
  const sp = await searchParams
  const initialSearch = firstParam(sp?.search)?.trim().slice(0, 160) || ''

  return B9ContentAdminPage({
    title: 'FAQ CMS',
    description: '维护常见问题分类、排序和发布状态。',
    activeItem: 'faq',
    kind: 'faq',
    allowCategories: true,
    heroTitle: 'FAQ 固定内容管理',
    heroDetail: '用于 /faq 的问答分类、排序、草稿、发布和隐藏。前台查询失败或无发布内容时继续使用静态兜底。',
    Icon: FileQuestion,
    initialSearch,
  })
}
