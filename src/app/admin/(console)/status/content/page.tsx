import Link from 'next/link'
import { formatNumber, loadStatusOverview, sumContent, type ContentMetric } from '@/lib/admin-status-metrics'
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

type ContentDecision = {
  label: string
  detail: string
  tone: ContentDecisionTone
  href: string
  actionLabel: string
}

export default async function AdminStatusContentPage() {
  const { role, email } = await getStatusAccess()
  const overview = await loadStatusOverview()
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
          <p className="text-sm font-semibold text-[#1889B6]">B6-2 内容统计</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E2C31]">产品 / 项目 / 新闻内容缺口</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61767D]">
            聚合现有内容表的发布、草稿、近 7 / 30 / 90 天变化和关键字段缺项。这里不编辑内容，只把运营人员带回对应管理入口。
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
            detail="封面、图库、中英文文本、SEO 或项目坐标等关键展示字段。"
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
            detail="优先处理即将发布或已进入运营排期的草稿。"
            href="/admin/content"
            Icon={STATUS_ICONS.Newspaper}
            tone={totals.draft > 0 ? 'orange' : 'green'}
          />
        </div>

        <section className="space-y-4">
          <ContentOperationsMatrix items={contentItems} totals={totals} />
        </section>

        <section className="space-y-4">
          <SectionTitle title="内容类型" detail="每个卡片都链接回现有后台，不新增写入动作。" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {contentItems.map((item) => (
              <ContentPanel key={item.key} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title="处理入口" detail="按运营优先级进入已有列表或编辑流程。" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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

function getContentDecision(item: ContentMetric): ContentDecision {
  if (item.issues > 0) {
    return {
      label: '优先补齐字段',
      detail: '关键展示字段缺失会影响前台展示、SEO 或案例地图承接。',
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
          <p className="mt-1 text-xs text-[#61767D]">只读统计，处理动作回到原管理页。</p>
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
