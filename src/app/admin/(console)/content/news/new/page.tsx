import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import NewsForm from '@/components/admin/NewsForm'
import ProductEditorConsole, {
  type ProductEditorMetric,
  type ProductEditorSignal,
} from '@/components/admin/ProductEditorConsole'
import { listNewsCategories } from '@/lib/news-db'
import {
  EMPTY_NEWS_STATS,
  NEWS_EDIT_SECTIONS,
  NewsConsoleShell,
  PrimaryAction,
  SectionTitle,
  getNewsStats,
  safeLoad,
  type AdminRole,
} from '../_news-console'
import { ArrowLeft, ListChecks, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: '新建新闻 - VESSEL' }

function Hero() {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[linear-gradient(135deg,#FFF2E7_0%,#F4FBFC_56%,#DDF6F8_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <PrimaryAction href="/admin/content/news/list" Icon={ArrowLeft} label="返回新闻列表" />
          <div className="mt-5">
            <SectionTitle title="新建新闻" detail="先保存草稿，再按发布前检查确认是否发布到前台。" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryAction href="/admin/content/news/new" Icon={Plus} label="新建新闻" primary />
          <PrimaryAction href="/admin/content/news/list" Icon={ListChecks} label="新闻列表" />
        </div>
      </div>
    </section>
  )
}

export default async function AdminContentNewsNewPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const role = session.user.role
  if (role !== 'admin' && role !== 'operator') {
    redirect('/admin/login?error=unauthorized')
  }

  const [stats, categories] = await Promise.all([
    safeLoad('news stats', () => getNewsStats(), EMPTY_NEWS_STATS),
    listNewsCategories().catch(() => []),
  ])

  const editorMetrics: ProductEditorMetric[] = [
    {
      label: '默认状态',
      value: '草稿',
      detail: '保存后进入新闻编辑页，发布前不会公开展示。',
      tone: 'ready',
    },
    {
      label: '编辑分区',
      value: NEWS_EDIT_SECTIONS.length.toString(),
      detail: 'Slug、分类、排期、SEO、封面、正文和发布检查。',
      tone: 'neutral',
    },
    {
      label: '分类',
      value: categories.length.toString(),
      detail: '可选新闻分类，影响列表筛选和内容归档。',
      tone: categories.length > 0 ? 'ready' : 'warning',
    },
    {
      label: '公开新闻',
      value: '未公开',
      detail: '创建草稿不会影响 /news。',
      tone: 'ready',
    },
  ]

  const editorSignals: ProductEditorSignal[] = [
    {
      label: '新建会写入新闻数据',
      detail: '点击保存后创建新闻草稿；发布仍由 NewsForm 的确认弹窗控制。',
      tone: 'warning',
      href: '#publish-check',
    },
    {
      label: 'Slug 决定公开 URL',
      detail: '发布后进入 /news/[slug]；保存前需确认英文 URL 稳定。',
      tone: 'warning',
      href: '#basic',
    },
    {
      label: '封面影响列表和详情',
      detail: '封面缺失会降低新闻列表密度和详情首屏质量。',
      tone: 'warning',
      href: '#media',
    },
    {
      label: '先补正文再看 SEO',
      detail: '建议先补中英文标题、摘要、正文和分类，再补搜索标题与描述。',
      tone: 'ready',
      href: '#content',
    },
  ]

  return (
    <NewsConsoleShell
      role={role as AdminRole}
      email={session.user.email}
      stats={stats}
      activeItem="news-new"
    >
      <Hero />
      <ProductEditorConsole
        title="新建新闻编辑任务台"
        description="先确认新闻草稿、分类、Slug、封面和 SEO 的创建边界，再进入原有新闻表单。"
        sections={NEWS_EDIT_SECTIONS}
        metrics={editorMetrics}
        signals={editorSignals}
      />
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-md border border-[#D8E7E8] bg-white p-4 shadow-sm">
            <p className="px-2 text-xs font-semibold text-[#8A9EA4]">编辑分区</p>
            <div className="mt-2 space-y-1">
              {NEWS_EDIT_SECTIONS.map((section) => (
                <a
                  key={section.key}
                  href={section.href}
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#1E2C31] transition hover:bg-[#F0F7F8] hover:text-[#1889B6]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F0F7F8] text-[#1889B6]">
                    <section.Icon size={16} />
                  </span>
                  <span>
                    <span className="block">{section.title}</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-[#8A9EA4]">{section.detail}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </aside>
        <NewsForm mode="create" basePath="/admin/content/news" initialCategories={categories} />
      </section>
    </NewsConsoleShell>
  )
}
