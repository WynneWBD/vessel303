import Link from 'next/link'
import { formatNumber, loadStatusOverview, sumContent, type ContentMetric, type SeoMetrics } from '@/lib/admin-status-metrics'
import { loadCaseInquiryHealth, type CaseInquiryHealth } from '@/lib/project-case-inquiry-health'
import {
  ActionCard,
  buildStatusBadges,
  MetricCard,
  SectionTitle,
  StatusPageShell,
  STATUS_ICONS,
} from '../_components'
import { getStatusAccess } from '../_access'

export const dynamic = 'force-dynamic'

export const metadata = { title: '内容统计 - 运营数据中心 - VESSEL' }

type ContentTotals = ReturnType<typeof sumContent>
type ContentDecisionTone = 'orange' | 'blue' | 'green'
type ContentReleaseTone = 'critical' | 'warning' | 'review' | 'ready'

type ContentDecision = {
  label: string
  detail: string
  tone: ContentDecisionTone
  href: string
  actionLabel: string
}

type ContentReleaseRow = {
  key: string
  priority: string
  stage: string
  title: string
  owner: string
  value: string
  evidence: string
  impact: string
  href: string
  actionLabel: string
  tone: ContentReleaseTone
  Icon: typeof STATUS_ICONS.AlertCircle
}

type ContentNextAction = {
  key: string
  priority: string
  title: string
  owner: string
  status: string
  evidence: string
  acceptance: string
  href: string
  actionLabel: string
  tone: ContentReleaseTone
  Icon: typeof STATUS_ICONS.AlertCircle
}

type PublicDiscoveryHealthItem = {
  key: string
  label: string
  publicHref: string
  contentHref: string
  sourceHref: string
  seoHref: string
  published: number
  draft: number
  issues: number
  seoMissing: number
  recent30: number
  detail: string
  Icon: typeof STATUS_ICONS.AlertCircle
  tone: 'orange' | 'blue' | 'green'
}

function seoGapHref(seo: SeoMetrics): string {
  if (seo.productsMissing > 0) return '/admin/content/products/list?view=incomplete&issue=seo'
  if (seo.projectsMissing > 0) return '/admin/content/projects/list?view=incomplete#case-conversion-content-backfill-desk'
  if (seo.newsMissing > 0) return '/admin/content/news/list?status=published&issue=seo#news-source-seo-list-bridge'
  return '/admin/site/seo#metadata-coverage'
}

export default async function AdminStatusContentPage() {
  const { role, email } = await getStatusAccess()
  const [overview, caseInquiryHealth] = await Promise.all([
    loadStatusOverview(),
    loadCaseInquiryHealth(),
  ])
  const totals = sumContent(overview.content)
  const contentItems = Object.values(overview.content)

  return (
    <StatusPageShell
      role={role}
      email={email}
      activeItem="content"
      badges={buildStatusBadges(overview, role)}
    >
      <section className="space-y-5">
        <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#1889B6]">内容统计</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">产品 / 项目 / 新闻内容缺口</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            查看发布、草稿、近期变化和内容缺项。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="内容总量"
            value={totals.total}
            detail={`已发布 ${formatNumber(totals.published)} / 草稿 ${formatNumber(totals.draft)}`}
            Icon={STATUS_ICONS.FileText}
          />
          <MetricCard
            title="字段缺项"
            value={totals.issues}
            detail="封面、图库、文案、SEO 和坐标。"
            Icon={STATUS_ICONS.AlertCircle}
            tone={totals.issues > 0 ? 'orange' : 'green'}
          />
          <MetricCard
            title="近 30 天变化"
            value={totals.recent30}
            detail={`近 7 天 ${formatNumber(totals.recent7)} / 近 90 天 ${formatNumber(totals.recent90)}`}
            Icon={STATUS_ICONS.ListChecks}
            tone="blue"
          />
          <MetricCard
            title="草稿待处理"
            value={totals.draft}
            detail="待检查或待发布的草稿。"
            href="/admin/content"
            Icon={STATUS_ICONS.Newspaper}
            tone={totals.draft > 0 ? 'orange' : 'green'}
          />
        </div>

        <section className="space-y-4">
          <ContentNextActionBoard
            items={contentItems}
            totals={totals}
            caseInquiryHealth={caseInquiryHealth}
            seo={overview.site.seo}
          />
          <CaseInquiryHealthPanel health={caseInquiryHealth} />
          <PublicDiscoveryHealthBoard
            products={overview.content.products}
            projects={overview.content.projects}
            news={overview.content.news}
            seo={overview.site.seo}
          />
          <ContentReleaseLedger items={contentItems} totals={totals} />
          <ContentOperationsMatrix items={contentItems} totals={totals} />
        </section>

        <section className="space-y-4">
          <SectionTitle title="内容类型" detail="按类型查看状态和入口。" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {contentItems.map((item) => (
              <ContentPanel key={item.key} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title="处理入口" detail="按优先级打开对应列表。" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ActionCard
              title="处理产品缺项"
              detail={`${formatNumber(overview.content.products.issues)} 个产品存在关键字段缺口。`}
              href={overview.content.products.issueHref}
              Icon={STATUS_ICONS.Package}
              primary={overview.content.products.issues > 0}
            />
            <ActionCard
              title="处理项目案例缺项"
              detail={`${formatNumber(overview.content.projects.issues)} 个案例需要补齐封面、图库、坐标或产品型号。`}
              href={overview.content.projects.issueHref}
              Icon={STATUS_ICONS.Globe2}
              primary={overview.content.projects.issues > 0}
            />
            <ActionCard
              title="处理发布转化弱"
              detail={`${formatNumber(caseInquiryHealth.weak)} 个已发布案例需要补齐素材、叙事、项目事实或标签。`}
              href="/admin/content/projects/list?view=case-conversion-weak"
              Icon={STATUS_ICONS.SearchCheck}
              primary={caseInquiryHealth.weak > 0}
            />
            <ActionCard
              title="处理新闻草稿"
              detail={`${formatNumber(overview.content.news.draft)} 条新闻仍处于草稿状态。`}
              href={overview.content.news.draftHref}
              Icon={STATUS_ICONS.Newspaper}
              primary={overview.content.news.draft > 0}
            />
          </div>
        </section>
      </section>
    </StatusPageShell>
  )
}

function ContentNextActionBoard({
  items,
  totals,
  caseInquiryHealth,
  seo,
}: {
  items: ContentMetric[]
  totals: ContentTotals
  caseInquiryHealth: CaseInquiryHealth
  seo: SeoMetrics
}) {
  const actions = buildContentNextActions(items, totals, caseInquiryHealth, seo)
  const activeActions = actions.filter(isContentNextActionBlocking)
  const highestPriority = actions.find(isContentNextActionBlocking)?.priority ?? 'OK'
  const seoMissing = seo.productsMissing + seo.projectsMissing + seo.newsMissing

  return (
    <section id="content-next-actions" className="scroll-mt-24 space-y-4">
      <SectionTitle
        title="内容待办"
        detail="按缺项、SEO、案例询盘和发布检查排序。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 md:grid-cols-4">
          <MatrixSummary label="当前优先级" value={contentPriorityDisplay(highestPriority)} detail="缺项 / SEO / 案例" warn={highestPriority !== 'OK'} />
          <MatrixSummary label="待处理" value={activeActions.length} detail="需要处理的项目" warn={activeActions.length > 0} />
          <MatrixSummary label="SEO 待补" value={seoMissing} detail="产品 / 案例 / 新闻 SEO 字段" warn={seoMissing > 0} />
          <MatrixSummary label="案例转化弱" value={caseInquiryHealth.weak} detail="已发布但转化素材不足" warn={caseInquiryHealth.weak > 0} />
        </div>
        <div className="grid grid-cols-1 divide-y divide-[#E6EEEE] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {actions.map((action) => (
            <ContentNextActionCard key={action.key} action={action} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ContentNextActionCard({ action }: { action: ContentNextAction }) {
  const Icon = action.Icon

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${contentReleaseToneClassName(action.tone)}`}>
            <Icon size={18} />
          </span>
          <span className="min-w-0">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${contentReleaseBadgeClassName(action.tone)}`}>
              {contentPriorityDisplay(action.priority)} · {contentReleaseLabel(action.tone)}
            </span>
            <h3 className="mt-2 text-base font-bold text-[#1E2C31]">{action.title}</h3>
          </span>
        </div>
        <Link
          href={action.href}
          className="inline-flex h-8 shrink-0 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
        >
          {action.actionLabel}
        </Link>
      </div>

      <div className="grid gap-3 text-xs leading-5 text-[#61767D] md:grid-cols-2">
        <ActionFact label="负责人" value={action.owner} />
        <ActionFact label="当前动作" value={action.status} />
        <ActionFact label="证据" value={action.evidence} />
        <ActionFact label="完成口径" value={action.acceptance} />
      </div>
    </div>
  )
}

function ActionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-[#F7FAFA] px-3 py-2">
      <p className="font-semibold text-[#1E2C31]">{label}</p>
      <p className="mt-1 text-[#61767D]">{value}</p>
    </div>
  )
}

function isContentNextActionBlocking(action: ContentNextAction) {
  return action.tone === 'critical' || action.tone === 'warning'
}

function CaseInquiryHealthPanel({ health }: { health: CaseInquiryHealth }) {
  const readyRate = percent(health.ready, health.published)

  return (
    <div>
      <SectionTitle
        title="案例询盘状态"
        detail="查看案例内容质量、询盘信息和前台入口。"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="可询盘案例"
          value={health.ready}
          detail={`已发布案例占比 ${readyRate}%`}
          href="/admin/content/projects/list?status=published"
          Icon={STATUS_ICONS.CheckCircle2}
          tone={health.ready > 0 ? 'green' : 'gray'}
        />
        <MetricCard
          title="发布转化弱"
          value={health.weak}
          detail="已发布但素材、叙事、项目事实或标签待补"
          href="/admin/content/projects/list?view=case-conversion-weak"
          Icon={STATUS_ICONS.AlertCircle}
          tone={health.weak > 0 ? 'orange' : 'green'}
        />
        <MetricCard
          title="草稿待完善"
          value={health.draft}
          detail="发布前补齐案例咨询信息"
          href="/admin/content/projects/list?status=draft"
          Icon={STATUS_ICONS.FileText}
          tone={health.draft > 0 ? 'orange' : 'green'}
        />
        <MetricCard
          title="前台案例入口"
          value={health.published}
          detail={`项目总量 ${formatNumber(health.total)}，发布后进入 /cases`}
          href="/cases"
          Icon={STATUS_ICONS.Globe2}
          tone="blue"
        />
      </div>
    </div>
  )
}

function PublicDiscoveryHealthBoard({
  products,
  projects,
  news,
  seo,
}: {
  products: ContentMetric
  projects: ContentMetric
  news: ContentMetric
  seo: SeoMetrics
}) {
  const items: PublicDiscoveryHealthItem[] = [
    {
      key: 'products',
      label: '产品目录',
      publicHref: '/products',
      contentHref: products.issues > 0 ? products.issueHref : '/admin/content/products/list#product-source-contract',
      sourceHref: '/admin/status/leads#source-seo-lead-quality',
      seoHref: '/admin/content/products/list?view=incomplete&issue=seo',
      published: products.published,
      draft: products.draft,
      issues: products.issues,
      seoMissing: seo.productsMissing,
      recent30: products.recent30,
      detail: '对应公开 /products 与产品详情，优先保障图片、图库、中英文名称和 SEO 字段。',
      Icon: STATUS_ICONS.Package,
      tone: products.issues > 0 || seo.productsMissing > 0 ? 'orange' : products.recent30 === 0 ? 'blue' : 'green',
    },
    {
      key: 'projects',
      label: '项目案例',
      publicHref: '/cases',
      contentHref: projects.issues > 0 ? projects.issueHref : '/admin/content/projects/list#case-source-contract',
      sourceHref: '/admin/status/leads#source-seo-lead-quality',
      seoHref: '/admin/content/projects/list?view=incomplete#case-conversion-content-backfill-desk',
      published: projects.published,
      draft: projects.draft,
      issues: projects.issues,
      seoMissing: seo.projectsMissing,
      recent30: projects.recent30,
      detail: '对应公开 /cases 与案例详情，优先补齐封面、图库、坐标、项目事实和咨询上下文。',
      Icon: STATUS_ICONS.Globe2,
      tone: projects.issues > 0 || seo.projectsMissing > 0 ? 'orange' : projects.recent30 === 0 ? 'blue' : 'green',
    },
    {
      key: 'news',
      label: '新闻发现',
      publicHref: '/news#news-discovery-console',
      contentHref: news.issues > 0 ? news.issueHref : '/admin/content/news#news-public-discovery-bridge',
      sourceHref: '/admin/status/leads#source-seo-lead-quality',
      seoHref: '/admin/content/news/list?status=published&issue=seo#news-source-seo-list-bridge',
      published: news.published,
      draft: news.draft,
      issues: news.issues,
      seoMissing: seo.newsMissing,
      recent30: news.recent30,
      detail: '对应公开 /news 发现和详情续航，优先补齐可公开样本、摘要正文、分类和 SEO 字段。',
      Icon: STATUS_ICONS.Newspaper,
      tone: news.issues > 0 || seo.newsMissing > 0 ? 'orange' : news.recent30 === 0 ? 'blue' : 'green',
    },
  ]
  const seoContentMissing = seo.productsMissing + seo.projectsMissing + seo.newsMissing
  const publicReadyCount = items.filter((item) => item.issues === 0 && item.seoMissing === 0 && item.published > 0).length

  return (
    <section id="public-discovery-health" className="scroll-mt-24 space-y-4">
      <SectionTitle
        title="公开入口与来源健康总览"
        detail="集中查看产品、案例、新闻的前台入口、内容缺项、SEO 待补和来源表现。"
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MatrixSummary label="公开内容线" value={items.length} detail="产品、案例、新闻" />
        <MatrixSummary label="可公开内容" value={`${publicReadyCount}/${items.length}`} detail="已发布且无内容 / SEO 缺项" />
        <MatrixSummary label="内容缺项" value={products.issues + projects.issues + news.issues} detail="三类公开内容关键字段" warn={products.issues + projects.issues + news.issues > 0} />
        <MatrixSummary label="SEO 待补" value={seoContentMissing} detail="产品、案例、新闻 SEO 字段" warn={seoContentMissing > 0} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {items.map((item) => (
          <PublicDiscoveryHealthCard key={item.key} item={item} />
        ))}
      </div>
    </section>
  )
}

function PublicDiscoveryHealthCard({ item }: { item: PublicDiscoveryHealthItem }) {
  const Icon = item.Icon
  const accent =
    item.tone === 'orange'
      ? 'bg-[#FFF2E7] text-[#E36F2C]'
      : item.tone === 'blue'
        ? 'bg-[#EAF6F8] text-[#1889B6]'
        : 'bg-emerald-50 text-emerald-700'
  const statusLabel =
    item.issues > 0 || item.seoMissing > 0
      ? '待补'
      : item.published <= 0
        ? '待发布'
        : item.recent30 === 0
          ? '待复盘'
          : '健康'

  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${accent}`}>
            <Icon size={20} />
          </span>
          <span className="min-w-0">
            <h3 className="text-base font-bold text-[#1E2C31]">{item.label}</h3>
            <p className="mt-1 text-xs leading-5 text-[#61767D]">{item.detail}</p>
          </span>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${accent}`}>{statusLabel}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <SmallBox label="已发布" value={item.published} href={item.publicHref} />
        <SmallBox label="草稿" value={item.draft} href={item.contentHref} warn={item.draft > 0} />
        <SmallBox label="内容缺项" value={item.issues} href={item.contentHref} warn={item.issues > 0} />
        <SmallBox label="SEO 待补" value={item.seoMissing} href={item.seoHref} warn={item.seoMissing > 0} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PublicDiscoveryAction href={item.publicHref} label="前台入口" />
        <PublicDiscoveryAction href={item.contentHref} label="内容处理" />
        <PublicDiscoveryAction href={item.sourceHref} label="来源复盘" />
      </div>
      <p className="mt-4 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] px-3 py-2 text-xs leading-5 text-[#61767D]">
        近 30 天变化 {formatNumber(item.recent30)} 条；先补内容和 SEO，再回看前台发现与来源质量。
      </p>
    </div>
  )
}

function PublicDiscoveryAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
    >
      {label}
    </Link>
  )
}

function buildContentNextActions(
  items: ContentMetric[],
  totals: ContentTotals,
  caseInquiryHealth: CaseInquiryHealth,
  seo: SeoMetrics,
): ContentNextAction[] {
  const issueItems = [...items].filter((item) => item.issues > 0).sort((a, b) => b.issues - a.issues)
  const issueTarget = issueItems[0]
  const seoMissing = seo.productsMissing + seo.projectsMissing + seo.newsMissing
  const issueEvidence =
    issueItems.length > 0
      ? issueItems.map((item) => `${item.label} ${formatNumber(item.issues)}`).join(' / ')
      : '产品、项目、新闻关键字段暂无显性缺口'

  return [
    {
      key: 'content-field-gaps',
      priority: totals.issues > 0 ? 'P0' : 'OK',
      title: '补齐公开内容',
      owner: '内容管理',
      status: totals.issues > 0 ? '先处理缺项最多的内容类型。' : '暂无内容缺项。',
      evidence: issueEvidence,
      acceptance: '缺项清零；前台列表、详情、封面和按钮正常展示。',
      href: issueTarget?.issueHref ?? '/admin/status/content',
      actionLabel: totals.issues > 0 ? '处理最高缺项' : '查看内容状态',
      tone: totals.issues > 0 ? 'critical' : 'ready',
      Icon: STATUS_ICONS.AlertCircle,
    },
    {
      key: 'content-seo-gaps',
      priority: seoMissing > 0 ? 'P1' : 'OK',
      title: '补齐产品 / 案例 / 新闻 SEO',
      owner: 'SEO',
      status: seoMissing > 0 ? '补搜索标题、描述、slug 和摘要。' : 'SEO 缺项已归零。',
      evidence: `产品 ${formatNumber(seo.productsMissing)} / 案例 ${formatNumber(seo.projectsMissing)} / 新闻 ${formatNumber(seo.newsMissing)}`,
      acceptance: 'SEO 待补为 0；公开页标题和描述完整。',
      href: seoGapHref(seo),
      actionLabel: seoMissing > 0 ? '处理 SEO 待补' : '查看 SEO 状态',
      tone: seoMissing > 0 ? 'warning' : 'ready',
      Icon: STATUS_ICONS.SearchCheck,
    },
    {
      key: 'case-conversion-weak',
      priority: caseInquiryHealth.weak > 0 ? 'P1' : 'OK',
      title: '处理案例转化弱',
      owner: '案例内容',
      status: caseInquiryHealth.weak > 0 ? '补齐项目事实、图片、产品关联和询盘信息。' : '已发布案例状态正常。',
      evidence: `可询盘 ${formatNumber(caseInquiryHealth.ready)} / 转化弱 ${formatNumber(caseInquiryHealth.weak)} / 草稿 ${formatNumber(caseInquiryHealth.draft)}`,
      acceptance: '转化弱案例归零或有明确原因。',
      href: caseInquiryHealth.weak > 0 ? '/admin/content/projects/list?view=case-conversion-weak' : '/admin/content/projects/list?status=published',
      actionLabel: caseInquiryHealth.weak > 0 ? '处理弱案例' : '查看已发布案例',
      tone: caseInquiryHealth.weak > 0 ? 'warning' : 'ready',
      Icon: STATUS_ICONS.Globe2,
    },
    {
      key: 'public-content-smoke',
      priority: 'P3',
      title: '发布后前台复验',
      owner: '网站运营',
      status: '内容调整或发布后，打开公开入口复查。',
      evidence: '产品、案例、新闻和重点详情页入口。',
      acceptance: '前台页面、图片和按钮正常展示。',
      href: '/admin/site/pages#content-source-route-tree',
      actionLabel: '查看复验入口',
      tone: 'review',
      Icon: STATUS_ICONS.CheckCircle2,
    },
  ]
}

function buildContentReleaseRows(items: ContentMetric[], totals: ContentTotals): ContentReleaseRow[] {
  const issueItems = [...items].filter((item) => item.issues > 0).sort((a, b) => b.issues - a.issues)
  const draftItems = [...items].filter((item) => item.draft > 0).sort((a, b) => b.draft - a.draft)
  const staleItems = items.filter((item) => item.total > 0 && item.recent30 === 0)
  const product = items.find((item) => item.key === 'products')
  const project = items.find((item) => item.key === 'projects')
  const news = items.find((item) => item.key === 'news')
  const issueTarget = issueItems[0]
  const draftTarget = draftItems[0]

  const issueEvidence =
    issueItems.length > 0
      ? issueItems.map((item) => `${item.label} ${formatNumber(item.issues)}`).join(' / ')
      : '产品、项目、新闻关键展示字段暂无显性缺口'
  const draftEvidence =
    draftItems.length > 0
      ? draftItems.map((item) => `${item.label} ${formatNumber(item.draft)}`).join(' / ')
      : '暂无草稿积压'
  const staleEvidence =
    staleItems.length > 0
      ? staleItems.map((item) => `${item.label} 30 天无更新`).join(' / ')
      : `近 30 天有 ${formatNumber(totals.recent30)} 条内容变化`

  return [
    {
      key: 'field-gaps',
      priority: totals.issues > 0 ? 'P0' : 'OK',
      stage: '字段缺项',
      title: '已发布 / 待发布内容关键字段',
      owner: '内容管理 / 全部',
      value: totals.issues > 0 ? `${formatNumber(totals.issues)} 个缺项` : '无缺项',
      evidence: issueEvidence,
      impact: '影响前台展示、SEO、地图和询盘判断。',
      href: issueTarget?.issueHref ?? '/admin/status/content',
      actionLabel: totals.issues > 0 ? '处理最高缺项' : '查看内容状态',
      tone: totals.issues > 0 ? 'critical' : 'ready',
      Icon: STATUS_ICONS.AlertCircle,
    },
    {
      key: 'draft-queue',
      priority: totals.draft > 0 ? 'P1' : 'OK',
      stage: '发布排期',
      title: '草稿待收口',
      owner: '内容运营',
      value: totals.draft > 0 ? `${formatNumber(totals.draft)} 个草稿` : '无草稿积压',
      evidence: draftEvidence,
      impact: '决定发布、补素材或保留草稿。',
      href: draftTarget?.draftHref ?? '/admin/content',
      actionLabel: totals.draft > 0 ? '查看草稿队列' : '进入内容管理',
      tone: totals.draft > 0 ? 'warning' : 'ready',
      Icon: STATUS_ICONS.Newspaper,
    },
    {
      key: 'freshness',
      priority: staleItems.length > 0 ? 'P2' : 'OK',
      stage: '内容新鲜度',
      title: '30 天更新覆盖',
      owner: '运营复盘',
      value: staleItems.length > 0 ? `${formatNumber(staleItems.length)} 类无更新` : `${formatNumber(totals.recent30)} 条变化`,
      evidence: staleEvidence,
      impact: '判断是否需要补充新素材。',
      href: '/admin/content',
      actionLabel: '查看内容入口',
      tone: staleItems.length > 0 ? 'review' : 'ready',
      Icon: STATUS_ICONS.ListChecks,
    },
    {
      key: 'product-release',
      priority: product && product.issues > 0 ? 'P1' : 'P3',
      stage: '产品目录',
      title: '产品页完整度',
      owner: '产品内容',
      value: product ? `${formatNumber(product.published)} 已发布 / ${formatNumber(product.issues)} 缺项` : '无产品数据',
      evidence: product
        ? `草稿 ${formatNumber(product.draft)} / 近 30 天变化 ${formatNumber(product.recent30)}`
        : '产品表暂无可读数据',
      impact: '影响客户询盘前的判断。',
      href: product?.issues ? product.issueHref : product?.href ?? '/admin/content/products',
      actionLabel: product?.issues ? '处理产品缺项' : '进入产品管理',
      tone: product && product.issues > 0 ? 'warning' : 'review',
      Icon: STATUS_ICONS.Package,
    },
    {
      key: 'project-release',
      priority: project && project.issues > 0 ? 'P1' : 'P3',
      stage: '项目案例',
      title: '案例完整度',
      owner: '案例内容',
      value: project ? `${formatNumber(project.published)} 已发布 / ${formatNumber(project.issues)} 缺项` : '无案例数据',
      evidence: project
        ? `草稿 ${formatNumber(project.draft)} / 近 30 天变化 ${formatNumber(project.recent30)}`
        : '案例表暂无可读数据',
      impact: '影响客户对交付能力的判断。',
      href: project?.issues ? project.issueHref : project?.href ?? '/admin/content/projects',
      actionLabel: project?.issues ? '处理案例缺项' : '进入案例管理',
      tone: project && project.issues > 0 ? 'warning' : 'review',
      Icon: STATUS_ICONS.Globe2,
    },
    {
      key: 'news-release',
      priority: news && (news.issues > 0 || news.draft > 0) ? 'P2' : 'P3',
      stage: '新闻内容',
      title: '新闻发布与 SEO 摘要',
      owner: '内容运营',
      value: news ? `${formatNumber(news.published)} 已发布 / ${formatNumber(news.draft)} 草稿` : '无新闻数据',
      evidence: news
        ? `缺项 ${formatNumber(news.issues)} / 近 30 天变化 ${formatNumber(news.recent30)}`
        : '新闻表暂无可读数据',
      impact: '避免新闻草稿长期停留。',
      href: news?.issues ? news.issueHref : news?.draft ? news.draftHref : news?.href ?? '/admin/content/news',
      actionLabel: news?.issues ? '处理新闻缺项' : news?.draft ? '查看新闻草稿' : '进入新闻管理',
      tone: news && (news.issues > 0 || news.draft > 0) ? 'review' : 'ready',
      Icon: STATUS_ICONS.FileText,
    },
    {
      key: 'public-smoke',
      priority: 'P3',
      stage: '发布后复验',
      title: '前台内容复查',
      owner: '网站运营',
      value: '人工复验',
      evidence: '发布后抽检 /products、/cases、/news 与重点详情页。',
      impact: '确认前台内容入口正常。',
      href: '/admin/status/site#site-release-preflight-bridge',
      actionLabel: '查看复查清单',
      tone: 'review',
      Icon: STATUS_ICONS.SearchCheck,
    },
  ]
}

function ContentReleaseLedger({
  items,
  totals,
}: {
  items: ContentMetric[]
  totals: ContentTotals
}) {
  const rows = buildContentReleaseRows(items, totals)

  return (
    <div>
      <SectionTitle
        title="内容发布处理台账"
        detail="把内容缺项、草稿、更新覆盖和发布后复验集中成可执行队列。"
      />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 md:grid-cols-4">
          <MatrixSummary label="最高优先级" value={contentPriorityDisplay(totals.issues > 0 ? 'P0' : totals.draft > 0 ? 'P1' : 'OK')} detail="按缺项、草稿、更新覆盖排序" warn={totals.issues > 0} />
          <MatrixSummary label="待处理缺项" value={totals.issues} detail="产品 / 项目 / 新闻关键字段" warn={totals.issues > 0} />
          <MatrixSummary label="待收口草稿" value={totals.draft} detail="进入发布排期前先确认素材" warn={totals.draft > 0} />
          <MatrixSummary label="复验入口" value="3+" detail="产品、案例、新闻与重点详情页" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                <th className="min-w-32 px-5 py-3 text-left font-semibold">优先级</th>
                <th className="min-w-72 px-4 py-3 text-left font-semibold">处理事项</th>
                <th className="min-w-64 px-4 py-3 text-left font-semibold">证据</th>
                <th className="min-w-64 px-4 py-3 text-left font-semibold">运营影响</th>
                <th className="min-w-32 px-5 py-3 text-right font-semibold">入口</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EEEE]">
              {rows.map((row) => {
                const Icon = row.Icon

                return (
                  <tr key={row.key} className="align-top transition hover:bg-[#FBFDFD]">
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${contentReleaseBadgeClassName(row.tone)}`}>
                        {contentPriorityDisplay(row.priority)}
                      </span>
                      <p className="mt-2 text-xs font-semibold text-[#61767D]">{row.stage}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${contentReleaseToneClassName(row.tone)}`}>
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-[#1E2C31]">{row.title}</span>
                          <span className="mt-1 block text-xs leading-5 text-[#61767D]">{row.owner}</span>
                          <span className="mt-2 inline-flex rounded-full bg-[#F0F7F8] px-2.5 py-1 text-xs font-semibold text-[#1889B6]">
                            {contentReleaseLabel(row.tone)} · {row.value}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">{row.evidence}</td>
                    <td className="px-4 py-4 text-xs leading-5 text-[#61767D]">{row.impact}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={row.href}
                        className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
                      >
                        {row.actionLabel}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function contentReleaseToneClassName(tone: ContentReleaseTone): string {
  if (tone === 'critical') return 'bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'warning') return 'bg-[#FFF6EF] text-[#C75F18]'
  if (tone === 'review') return 'bg-[#EAF6F8] text-[#1889B6]'
  return 'bg-emerald-50 text-emerald-700'
}

function contentReleaseBadgeClassName(tone: ContentReleaseTone): string {
  if (tone === 'critical') return 'border-[#E36F2C]/35 bg-[#FFF2E7] text-[#E36F2C]'
  if (tone === 'warning') return 'border-[#E36F2C]/25 bg-[#FFF6EF] text-[#C75F18]'
  if (tone === 'review') return 'border-[#1889B6]/20 bg-[#EAF6F8] text-[#1889B6]'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function contentPriorityDisplay(priority: string): string {
  if (priority === 'P0') return '高优先'
  if (priority === 'P1') return '优先'
  if (priority === 'P2') return '复核'
  if (priority === 'P3') return '观察'
  if (priority === 'OK') return '正常'
  if (priority === 'HOLD') return '受限'
  return priority
}

function contentReleaseLabel(tone: ContentReleaseTone): string {
  if (tone === 'critical') return '立即处理'
  if (tone === 'warning') return '优先处理'
  if (tone === 'review') return '复盘确认'
  return '状态正常'
}

function getContentDecision(item: ContentMetric): ContentDecision {
  if (item.issues > 0) {
    return {
      label: '优先补齐字段',
      detail: '关键展示信息缺失会影响前台展示、SEO 或地图。',
      tone: 'orange',
      href: item.issueHref,
      actionLabel: '处理缺项',
    }
  }

  if (item.draft > 0) {
    return {
      label: '草稿待收口',
      detail: '已有草稿内容，需要确认是否进入发布排期。',
      tone: 'blue',
      href: item.draftHref,
      actionLabel: '查看草稿',
    }
  }

  if (item.total > 0 && item.recent30 === 0) {
    return {
      label: '30 天无更新',
      detail: '内容基础正常，但建议检查是否需要补充新素材或案例。',
      tone: 'blue',
      href: item.href,
      actionLabel: '进入管理',
    }
  }

  return {
    label: '运行正常',
    detail: '当前没有显性缺项或草稿积压。',
    tone: 'green',
    href: item.href,
    actionLabel: '进入管理',
  }
}

function getContentPriorityScore(item: ContentMetric) {
  const staleScore = item.total > 0 && item.recent30 === 0 ? 1 : 0
  return item.issues * 3 + item.draft * 2 + staleScore
}

function percent(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

function ContentOperationsMatrix({
  items,
  totals,
}: {
  items: ContentMetric[]
  totals: ContentTotals
}) {
  const orderedItems = [...items].sort((a, b) => getContentPriorityScore(b) - getContentPriorityScore(a))
  const publishRate = percent(totals.published, totals.total)
  const issueRate = percent(totals.issues, totals.total)

  return (
    <>
      <SectionTitle title="内容运营矩阵" detail="按发布率、缺项率和最近变化判断处理顺序，减少在多个列表之间来回找问题。" />
      <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-[#E6EEEE] bg-[#FBFDFD] px-5 py-4 md:grid-cols-3">
          <MatrixSummary label="整体发布率" value={`${publishRate}%`} detail={`已发布 ${formatNumber(totals.published)} / ${formatNumber(totals.total)}`} />
          <MatrixSummary label="整体缺项率" value={`${issueRate}%`} detail={`缺项 ${formatNumber(totals.issues)} 个内容`} warn={totals.issues > 0} />
          <MatrixSummary label="近 30 天变化" value={totals.recent30} detail={`近 7 天 ${formatNumber(totals.recent7)} / 近 90 天 ${formatNumber(totals.recent90)}`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEEE] bg-[#F7FAFA] text-xs text-[#61767D]">
                <th className="min-w-36 px-5 py-3 text-left font-semibold">内容类型</th>
                <th className="min-w-52 px-4 py-3 text-left font-semibold">发布状态</th>
                <th className="min-w-44 px-4 py-3 text-left font-semibold">缺项率</th>
                <th className="px-4 py-3 text-left font-semibold">近期变化</th>
                <th className="min-w-56 px-4 py-3 text-left font-semibold">当前判断</th>
                <th className="min-w-28 px-5 py-3 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EEEE]">
              {orderedItems.map((item) => {
                const decision = getContentDecision(item)
                const itemPublishRate = percent(item.published, item.total)
                const itemIssueRate = percent(item.issues, item.total)

                return (
                  <tr key={item.key}>
                    <td className="px-5 py-4">
                      <Link href={item.href} className="font-semibold text-[#1E2C31] hover:text-[#1889B6]">
                        {item.label}
                      </Link>
                      <p className="mt-1 text-xs text-[#8A9EA4]">总量 {formatNumber(item.total)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <MatrixBar percentValue={itemPublishRate} tone="green" />
                      <p className="mt-2 text-xs text-[#61767D]">
                        已发布 {formatNumber(item.published)} / 草稿 {formatNumber(item.draft)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <MatrixBar percentValue={itemIssueRate} tone={item.issues > 0 ? 'orange' : 'green'} />
                      <p className="mt-2 text-xs text-[#61767D]">
                        缺项 {formatNumber(item.issues)} / 缺项率 {itemIssueRate}%
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#61767D]">
                      <span className="block font-semibold text-[#1E2C31]">30 天 {formatNumber(item.recent30)}</span>
                      <span className="mt-1 block">7 天 {formatNumber(item.recent7)} / 90 天 {formatNumber(item.recent90)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <DecisionBadge decision={decision} />
                      <p className="mt-2 max-w-sm text-xs leading-5 text-[#61767D]">{decision.detail}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={decision.href}
                        className="inline-flex h-8 items-center rounded-md border border-[#D8E7E8] bg-white px-3 text-xs font-semibold text-[#1889B6] transition hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
                      >
                        {decision.actionLabel}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function MatrixSummary({
  label,
  value,
  detail,
  warn,
}: {
  label: string
  value: number | string
  detail: string
  warn?: boolean
}) {
  return (
    <div className="rounded-md border border-[#E6EEEE] bg-white px-4 py-3">
      <p className="text-xs font-semibold text-[#61767D]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      <p className="mt-1 text-xs text-[#8A9EA4]">{detail}</p>
    </div>
  )
}

function MatrixBar({
  percentValue,
  tone,
}: {
  percentValue: number
  tone: 'orange' | 'green'
}) {
  const barClass = tone === 'orange' ? 'bg-[#E36F2C]' : 'bg-[#159477]'

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-[#61767D]">占比</span>
        <span className="font-bold text-[#1E2C31]">{percentValue}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E6EEEE]">
        <span className={`block h-full rounded-full ${barClass}`} style={{ width: `${percentValue}%` }} />
      </div>
    </div>
  )
}

function DecisionBadge({ decision }: { decision: ContentDecision }) {
  const className =
    decision.tone === 'orange'
      ? 'border-[#E36F2C]/25 bg-[#FFF2E7] text-[#E36F2C]'
      : decision.tone === 'blue'
        ? 'border-[#1889B6]/20 bg-[#EAF6F8] text-[#1889B6]'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {decision.label}
    </span>
  )
}

function ContentPanel({ item }: { item: ContentMetric }) {
  return (
    <div className="rounded-md border border-[#D8E7E8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1E2C31]">{item.label}</h2>
          <p className="mt-1 text-xs text-[#61767D]">查看统计，并进入对应管理页处理。</p>
        </div>
        <Link href={item.href} className="text-sm font-semibold text-[#1889B6] hover:text-[#E36F2C]">
          进入管理
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <SmallBox label="总量" value={item.total} />
        <SmallBox label="已发布" value={item.published} />
        <SmallBox label="草稿" value={item.draft} href={item.draftHref} warn={item.draft > 0} />
        <SmallBox label="缺项" value={item.issues} href={item.issueHref} warn={item.issues > 0} />
      </div>
      <div className="mt-5 rounded-md border border-[#E6EEEE] bg-[#F7FAFA] p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <SmallInline label="近 7 天" value={item.recent7} />
          <SmallInline label="近 30 天" value={item.recent30} />
          <SmallInline label="近 90 天" value={item.recent90} />
        </div>
      </div>
    </div>
  )
}

function SmallBox({
  label,
  value,
  href,
  warn,
}: {
  label: string
  value: number
  href?: string
  warn?: boolean
}) {
  const className = `rounded-md border p-3 ${
    warn ? 'border-[#E36F2C]/35 bg-[#FFF6EF]' : 'border-[#E6EEEE] bg-[#F7FAFA]'
  }`
  const content = (
    <>
      <span className="block text-xs text-[#61767D]">{label}</span>
      <span className={`mt-1 block text-2xl font-bold ${warn ? 'text-[#E36F2C]' : 'text-[#1E2C31]'}`}>
        {formatNumber(value)}
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={`${className} transition hover:-translate-y-0.5`}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

function SmallInline({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="block text-xs text-[#61767D]">{label}</span>
      <span className="mt-1 block text-lg font-bold text-[#1E2C31]">{formatNumber(value)}</span>
    </span>
  )
}
