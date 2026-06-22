import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  type LucideIcon,
} from 'lucide-react'

export type ProductEditorSectionLink = {
  key: string
  title: string
  detail: string
  href: string
}

export type ProductEditorMetric = {
  label: string
  value: string
  detail: string
  tone?: ProductEditorTone
}

export type ProductEditorSignal = {
  label: string
  detail: string
  tone: ProductEditorTone
  href?: string
  Icon?: LucideIcon
}

export type ProductEditorTone = 'ready' | 'warning' | 'neutral'

function toneClassName(tone: ProductEditorTone) {
  if (tone === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (tone === 'warning') return 'border-[#E36F2C]/30 bg-[#FFF2E7] text-[#E36F2C]'
  return 'border-[#D8E7E8] bg-[#F0F2F2] text-[#61767D]'
}

function defaultSignalIcon(tone: ProductEditorTone) {
  if (tone === 'ready') return CheckCircle2
  if (tone === 'warning') return AlertTriangle
  return CircleDashed
}

export default function ProductEditorConsole({
  title,
  description,
  sections,
  metrics,
  signals,
}: {
  title: string
  description: string
  sections: ProductEditorSectionLink[]
  metrics: ProductEditorMetric[]
  signals: ProductEditorSignal[]
}) {
  return (
    <section className="rounded-md border border-[#D8E7E8] bg-[#F7FAFA] p-5 shadow-sm">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E2C31]">{title}</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#61767D]">{description}</p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1889B6]">
          CMS 编辑台 · 保存前先复核
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-md border border-[#D8E7E8] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#61767D]">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold text-[#1E2C31]">{metric.value}</p>
              </div>
              <span className={`h-3 w-3 rounded-full border ${toneClassName(metric.tone ?? 'neutral')}`} />
            </div>
            <p className="mt-2 text-xs leading-5 text-[#61767D]">{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-hidden rounded-md border border-[#D8E7E8] bg-white">
          <div className="border-b border-[#E6EEEE] px-4 py-3">
            <h3 className="text-sm font-bold text-[#1E2C31]">编辑任务顺序</h3>
            <p className="mt-1 text-xs text-[#61767D]">按运营编辑顺序下钻，避免在长表单里来回寻找字段。</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#E6EEEE] bg-[#FBFDFD] text-[#61767D]">
                  <th className="px-4 py-3 text-left font-medium">序号</th>
                  <th className="px-4 py-3 text-left font-medium">分区</th>
                  <th className="px-4 py-3 text-left font-medium">处理内容</th>
                  <th className="px-4 py-3 text-right font-medium">入口</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section, index) => (
                  <tr key={section.key} className="border-b border-[#E6EEEE] last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-[#8A9EA4]">{String(index + 1).padStart(2, '0')}</td>
                    <td className="px-4 py-3 font-semibold text-[#1E2C31]">{section.title}</td>
                    <td className="px-4 py-3 text-xs leading-5 text-[#61767D]">{section.detail}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={section.href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1889B6] hover:text-[#E36F2C]">
                        定位 <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-md border border-[#D8E7E8] bg-white">
          <div className="border-b border-[#E6EEEE] px-4 py-3">
            <h3 className="text-sm font-bold text-[#1E2C31]">发布影响信号</h3>
            <p className="mt-1 text-xs text-[#61767D]">提交前核对关键字段、前台预览和发布状态。</p>
          </div>
          <div className="divide-y divide-[#E6EEEE]">
            {signals.map((signal) => {
              const Icon = signal.Icon ?? defaultSignalIcon(signal.tone)
              const body = (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${toneClassName(signal.tone)}`}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[#1E2C31]">{signal.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#61767D]">{signal.detail}</span>
                  </span>
                </div>
              )

              if (!signal.href) return <div key={signal.label}>{body}</div>
              return (
                <Link key={signal.label} href={signal.href} className="block transition hover:bg-[#F7FAFA]">
                  {body}
                </Link>
              )
            })}
          </div>
        </aside>
      </div>
    </section>
  )
}
