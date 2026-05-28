import { FileArchive } from 'lucide-react'
import { B9ContentAdminPage } from '@/components/admin/B9ContentAdminPage'

export const dynamic = 'force-dynamic'

export const metadata = { title: '文件下载 CMS - VESSEL' }

export default function AdminMediaKitContentPage() {
  return B9ContentAdminPage({
    title: '文件下载',
    description: '维护 Media Kit 与公开可申请下载资源。',
    activeItem: 'media-kit',
    kind: 'media_file',
    allowCategories: true,
    heroTitle: 'Media Kit / 文件下载',
    heroDetail: '用于 /media-kit 的资源列表和申请入口。表单继续进入线索，不做复杂密码下载或会员权限。',
    Icon: FileArchive,
  })
}
