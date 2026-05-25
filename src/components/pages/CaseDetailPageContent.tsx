'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import { useLanguage } from '@/contexts/LanguageContext'
import type { ProjectCaseRow } from '@/lib/project-cases-static'

const CONTACT_URL = 'https://en.303vessel.cn/contact.html'

function text(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function formatDate(value: string | null | undefined, zh: boolean) {
  const raw = text(value)
  if (!raw) return ''

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function hasCoordinates(project: ProjectCaseRow) {
  return project.latitude != null && project.longitude != null
}

function ProjectImage({ src, alt, className }: { src: string | null | undefined; alt: string; className: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-[#E5DED4] ${className}`}>
        <span className="px-4 text-center text-xs tracking-wider text-[#8A8580]">{alt} · site image</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`object-cover ${className}`} />
  )
}

export default function CaseDetailPageContent({
  project,
  relatedCases = [],
}: {
  project: ProjectCaseRow
  relatedCases?: ProjectCaseRow[]
}) {
  const { lang } = useLanguage()
  const zh = lang === 'zh'
  const name = zh ? project.name_zh : project.name_en
  const location = zh ? project.location_zh : project.location_en
  const type = zh ? project.project_type_zh : project.project_type_en
  const description = zh ? project.description_zh : project.description_en
  const tags = zh ? project.tags_zh : project.tags_en
  const heroImage = project.cover_image_url || project.images[0] || null
  const gallery = [
    project.cover_image_url,
    ...project.images,
  ].filter((image, index, images): image is string => Boolean(image) && images.indexOf(image) === index)

  const specs = [
    { label: zh ? '项目地点' : 'Location', value: location },
    { label: zh ? '项目类型' : 'Project Type', value: type },
    { label: zh ? '占地面积' : 'Site Area', value: text(project.area_display) },
    { label: zh ? '投资规模' : 'Investment', value: text(project.investment_display) },
    { label: zh ? '采购数量' : 'Units Purchased', value: text(project.units_display) },
    { label: zh ? '采购产品' : 'Products', value: text(project.products) },
  ].filter((item) => item.value.length > 0)

  const contentDate = formatDate(project.created_at || project.updated_at, zh)
  const contentStatus = [
    { label: zh ? '内容分类' : 'Category', value: zh ? '项目案例' : 'Project Case' },
    { label: zh ? '发布状态' : 'Status', value: zh ? '已发布' : 'Published' },
    { label: zh ? '内容时间' : 'Content Date', value: contentDate },
  ].filter((item) => item.value.length > 0)
  const dataRows = [
    { label: zh ? '项目名称' : 'Project Name', value: name },
    { label: zh ? '案例分类' : 'Case Category', value: zh ? '项目案例' : 'Project Case' },
    { label: zh ? '项目类型' : 'Project Type', value: type },
    { label: zh ? '项目地点' : 'Location', value: location },
    { label: zh ? '占地面积' : 'Site Area', value: text(project.area_display) },
    { label: zh ? '投资规模' : 'Investment', value: text(project.investment_display) },
    { label: zh ? '采购数量' : 'Units Purchased', value: text(project.units_display) },
    { label: zh ? '采购产品' : 'Products', value: text(project.products) },
  ].filter((item) => item.value.length > 0)
  const showGlobalLink = hasCoordinates(project)

  return (
    <main className="bg-[#FAF7F2] text-[#2C2A28]">
      <Navbar />

      <PageHero
        label={zh ? '项目案例' : 'Project Case'}
        title={name}
        titleGold={type}
        subtitle={location}
        breadcrumb={[
          { label: zh ? '首页' : 'Home', href: '/' },
          { label: zh ? '项目案例' : 'Cases', href: '/cases' },
          { label: name },
        ]}
      />

      <section className="border-b border-[#E5DED4]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] lg:px-8 lg:py-16">
          <div className="overflow-hidden border border-[#E5DED4] bg-[#E5DED4]">
            <ProjectImage src={heroImage} alt={name} className="aspect-[16/10] h-full w-full" />
          </div>

          <aside className="border-x border-b border-[#E5DED4] bg-white p-6 lg:border-l-0 lg:border-t lg:p-8">
            <div className="mb-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="border border-[#E36F2C]/20 bg-[#E36F2C]/10 px-2 py-1 text-[10px] tracking-wider text-[#E36F2C]">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-black tracking-wide text-[#2C2A28]">{name}</h1>
            <p className="mt-3 text-sm leading-7 text-[#6B6560]">{description}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {contentStatus.map((item) => (
                <div key={item.label} className="border border-[#E5DED4] bg-[#FAF7F2] px-4 py-3">
                  <div className="text-[10px] tracking-wider text-[#8A8580]">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold leading-6 text-[#2C2A28]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {specs.map((spec) => (
                <div key={spec.label} className="border border-[#E5DED4] bg-[#F8F6F2] px-4 py-3">
                  <div className="text-[10px] tracking-wider text-[#8A8580]">{spec.label}</div>
                  <div className="mt-1 text-sm font-semibold leading-6 text-[#2C2A28]">{spec.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#E36F2C] px-6 py-3 text-center text-sm font-bold tracking-wider text-white transition-colors hover:bg-[#C85A1F]"
              >
                {zh ? '咨询类似项目' : 'Inquire About Similar Projects'}
              </a>
              {showGlobalLink && (
                <Link
                  href={`/global?camp=${project.id}`}
                  className="border border-[#E36F2C]/40 px-6 py-3 text-center text-sm tracking-wider text-[#E36F2C] transition-colors hover:bg-[#E36F2C]/5"
                >
                  {zh ? '在 Global 地图查看' : 'View on Global Map'}
                </Link>
              )}
              <Link
                href="/cases"
                className="border border-[#C4B9AB] px-6 py-3 text-center text-sm tracking-wider text-[#2C2A28] transition-colors hover:border-[#E36F2C] hover:text-[#E36F2C]"
              >
                {zh ? '返回全部案例' : 'Back to All Cases'}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-[#E5DED4] bg-[#F5F2ED] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <div className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[#E36F2C]">
                {zh ? '项目概览' : 'Project Overview'}
              </div>
              <h2 className="text-3xl font-black tracking-wide text-[#2C2A28]">
                {zh ? '从场地到交付的案例展示' : 'A delivered project reference'}
              </h2>
            </div>
            <div className="space-y-5 text-sm leading-8 text-[#5F5750]">
              <p>{description}</p>
              {project.products && (
                <p>
                  <span className="font-semibold text-[#2C2A28]">{zh ? '应用产品：' : 'Applied products: '}</span>
                  {project.products}
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                {dataRows.map((row) => (
                  <div key={row.label} className="border border-[#E5DED4] bg-white px-4 py-3">
                    <div className="text-[10px] tracking-wider text-[#8A8580]">{row.label}</div>
                    <div className="mt-1 text-sm font-semibold leading-6 text-[#2C2A28]">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {gallery.length > 1 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-[#E36F2C]">
                  {zh ? '项目图集' : 'Project Gallery'}
                </div>
                <h2 className="text-2xl font-black tracking-wide text-[#2C2A28]">
                  {zh ? '现场图片' : 'Site Images'}
                </h2>
              </div>
              <Link href="/cases" className="text-sm tracking-wider text-[#E36F2C] hover:underline">
                {zh ? '查看全部案例' : 'View all cases'}
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.slice(0, 6).map((image, index) => (
                <ProjectImage
                  key={image}
                  src={image}
                  alt={`${name} ${index + 1}`}
                  className="aspect-[4/3] w-full border border-[#E5DED4]"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedCases.length > 0 && (
        <section className="border-t border-[#E5DED4] bg-[#F5F2ED] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-[#E36F2C]">
                  {zh ? '相关案例' : 'Related Cases'}
                </div>
                <h2 className="text-2xl font-black tracking-wide text-[#2C2A28]">
                  {zh ? '继续查看项目案例' : 'Explore More Project Cases'}
                </h2>
              </div>
              <Link href="/cases" className="inline-flex items-center gap-2 text-sm tracking-wider text-[#E36F2C] hover:underline">
                {zh ? '查看全部案例' : 'View all cases'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedCases.map((item) => {
                const relatedName = zh ? item.name_zh : item.name_en
                const relatedType = zh ? item.project_type_zh : item.project_type_en
                const relatedLocation = zh ? item.location_zh : item.location_en
                const relatedImage = item.cover_image_url || item.images[0] || null

                return (
                  <Link
                    key={item.id}
                    href={`/cases/${item.id}`}
                    className="group border border-[#E5DED4] bg-white transition-colors hover:border-[#E36F2C]/35"
                  >
                    <ProjectImage src={relatedImage} alt={relatedName} className="aspect-[4/3] w-full border-b border-[#E5DED4]" />
                    <div className="p-5">
                      <div className="mb-2 text-[10px] tracking-wider text-[#8A8580]">{relatedLocation}</div>
                      <h3 className="text-base font-black leading-6 tracking-wide text-[#2C2A28]">{relatedName}</h3>
                      {relatedType && <div className="mt-2 text-xs leading-5 tracking-wider text-[#6B6560]">{relatedType}</div>}
                      <div className="mt-4 inline-flex items-center gap-2 text-xs tracking-wider text-[#E36F2C] group-hover:underline">
                        {zh ? '查看详情' : 'View Details'}
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  )
}
