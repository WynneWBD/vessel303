'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ProtectedImage from '@/components/ProtectedImage';
import { useT } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { i18n } from '@/lib/i18n';
import type { CatalogProduct } from '@/lib/products';

interface Props {
  product: CatalogProduct;
  isLoggedIn: boolean;
}

type DetailModule = NonNullable<CatalogProduct['detail_modules']>[number];
type DetailModuleItem = NonNullable<DetailModule['items_cn']>[number];

const TYPE_LABEL: Record<string, { cn: string; en: string }> = {
  compact: { cn: '紧凑型', en: 'Compact' },
  standard: { cn: '标准型', en: 'Standard' },
  luxury: { cn: '豪华型', en: 'Luxury' },
};

const CONTACT_URL = 'https://en.303vessel.cn/contact.html';

function uniqueImageList(sources: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      sources
        .map((src) => src?.trim())
        .filter((src): src is string => Boolean(src)),
    ),
  );
}

function hasModuleContent(module: DetailModule, lang: 'en' | 'zh') {
  const title = lang === 'en' ? module.title_en : module.title_cn;
  const body = lang === 'en' ? module.body_en : module.body_cn;
  const items = lang === 'en' ? module.items_en ?? [] : module.items_cn ?? [];
  const images = uniqueImageList([module.image_url, ...(module.images ?? [])]);

  return Boolean(title || body || items.length > 0 || images.length > 0);
}

function SectionLabel({
  label,
  title,
  body,
}: {
  label?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="mb-5">
      {label ? (
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#E36F2C]">
          {label}
        </div>
      ) : null}
      {title ? (
        <h2 className="text-2xl font-black leading-tight tracking-normal text-[#2C2A28] sm:text-3xl">
          {title}
        </h2>
      ) : null}
      {body ? (
        <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-8 text-[#5F5750] sm:text-base">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function ModuleImage({
  src,
  alt,
  priority = false,
  contain = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  contain?: boolean;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden border border-[#E5DED4] bg-[#FAF7F2]">
      <ProtectedImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={contain ? 'object-contain p-4' : 'object-cover'}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 34vw"
      />
    </div>
  );
}

function ItemCard({ item, index }: { item: DetailModuleItem; index: number }) {
  return (
    <div className="border border-[#E5DED4] bg-white p-4">
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#E36F2C] text-[11px] font-bold text-white">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="text-sm font-semibold leading-snug text-[#2C2A28]">
          {item.title}
        </div>
      </div>
      {item.body ? (
        <p className="text-sm leading-relaxed text-[#6B625B]">{item.body}</p>
      ) : null}
    </div>
  );
}

export default function CatalogProductDetailContent({ product }: Props) {
  const t = useT();
  const { lang } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const name = lang === 'en' ? product.name_en : product.name_cn;
  const badge = lang === 'en' ? product.badge_en : product.badge_cn;
  const tags = lang === 'en' ? product.tags_en : product.tags_cn;
  const features = lang === 'en' ? product.features_en : product.features_cn;
  const description = lang === 'en' ? product.description_en : product.description_cn;
  const customSpecs = lang === 'en' ? product.specs_en ?? [] : product.specs_cn ?? [];
  const typeLabel = TYPE_LABEL[product.productType] ?? TYPE_LABEL.standard;

  const detailModules = (product.detail_modules ?? [])
    .filter((module) => module.is_visible !== false)
    .filter((module) => hasModuleContent(module, lang))
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

  const specRows = [
    {
      label: t(i18n.productDetail.specArea),
      value: product.size,
    },
    {
      label: lang === 'en' ? 'Generation' : '代别',
      value: product.gen,
    },
    {
      label: t(i18n.productDetail.specSeries),
      value: `VESSEL ${product.productSeries}`,
    },
    {
      label: lang === 'en' ? 'Type' : '产品类型',
      value: lang === 'en' ? typeLabel.en : typeLabel.cn,
    },
    ...customSpecs,
  ].filter((row) => row.label && row.value);

  const media = useMemo(
    () => uniqueImageList([product.image, ...(product.gallery ?? [])]),
    [product.gallery, product.image],
  );
  const activeImage = media[activeImageIndex] ?? media[0] ?? product.image;

  const quickStats = (features.length > 0
    ? features.slice(0, 4).map((feature) => ({ label: feature, value: '' }))
    : specRows.slice(0, 4)).filter((item) => item.label || item.value);

  const renderModuleImages = (images: string[], title: string) => {
    if (images.length === 0) return null;

    return (
      <div className={images.length === 1 ? 'mt-5' : 'mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        {images.map((src, index) => (
          <ModuleImage
            key={`${src}-${index}`}
            src={src}
            alt={`${title || name} ${index + 1}`}
            contain={src.includes('exploded') || src.includes('structure')}
          />
        ))}
      </div>
    );
  };

  const renderFaqModule = (
    module: DetailModule,
    title: string,
    body: string | undefined,
    items: DetailModuleItem[],
  ) => (
    <section key={module.id} className="border border-[#E5DED4] bg-[#FAF7F2] p-5 sm:p-7">
      <SectionLabel label="FAQ" title={title} body={body} />
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <details key={`${item.title}-${index}`} className="group border border-[#E5DED4] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left">
                <span className="text-sm font-semibold leading-snug text-[#2C2A28]">{item.title}</span>
                <span className="text-lg leading-none text-[#E36F2C] transition-transform group-open:rotate-90">›</span>
              </summary>
              {item.body ? (
                <div className="border-t border-[#E5DED4] px-4 pb-4 pt-3 text-sm leading-relaxed text-[#6B625B]">
                  {item.body}
                </div>
              ) : null}
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );

  const renderScenarioModule = (
    module: DetailModule,
    title: string,
    body: string | undefined,
    items: DetailModuleItem[],
    images: string[],
  ) => (
    <section key={module.id}>
      <SectionLabel
        label={lang === 'en' ? 'Best-fit scenarios' : '适用场景'}
        title={title}
        body={body}
      />
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="overflow-hidden border border-[#E5DED4] bg-white">
              {images[index] ? (
                <ModuleImage src={images[index]} alt={item.title} />
              ) : null}
              <div className="p-4">
                <div className="text-sm font-semibold leading-snug text-[#2C2A28]">{item.title}</div>
                {item.body ? (
                  <p className="mt-2 text-xs leading-relaxed text-[#6B625B]">{item.body}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : renderModuleImages(images, title)}
    </section>
  );

  const renderCustomizationModule = (
    module: DetailModule,
    title: string,
    body: string | undefined,
    items: DetailModuleItem[],
    images: string[],
  ) => (
    <section key={module.id} className="border border-[#E36F2C]/25 bg-[#E36F2C]/5 p-5 sm:p-7">
      <SectionLabel
        label={lang === 'en' ? 'Customization scope' : '可定制范围'}
        title={title}
        body={body}
      />
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <ItemCard key={`${item.title}-${index}`} item={item} index={index} />
          ))}
        </div>
      ) : null}
      {renderModuleImages(images, title)}
    </section>
  );

  const renderHighlightModule = (
    module: DetailModule,
    title: string,
    body: string | undefined,
    items: DetailModuleItem[],
    images: string[],
  ) => (
    <section key={module.id}>
      <SectionLabel
        label={lang === 'en' ? 'Product highlights' : '产品亮点'}
        title={title}
        body={body}
      />
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <ItemCard key={`${item.title}-${index}`} item={item} index={index} />
          ))}
        </div>
      ) : null}
      {renderModuleImages(images, title)}
    </section>
  );

  const renderContentModule = (
    module: DetailModule,
    title: string,
    body: string | undefined,
    items: DetailModuleItem[],
    images: string[],
  ) => {
    const denseList = items.length > 4;

    return (
      <section key={module.id} className="border-t border-[#E5DED4] pt-9">
        <SectionLabel label={lang === 'en' ? 'Product section' : '产品章节'} title={title} body={body} />
        {images.length > 0 ? (
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {images.slice(0, 4).map((src, index) => (
              <ModuleImage
                key={`${src}-${index}`}
                src={src}
                alt={`${title || name} ${index + 1}`}
                contain={src.includes('exploded') || src.includes('structure')}
              />
            ))}
          </div>
        ) : null}
        {items.length > 0 ? (
          denseList ? (
            <div className="divide-y divide-[#E5DED4] border border-[#E5DED4] bg-white">
              {items.map((item, index) => (
                <div key={`${item.title}-${index}`} className="grid gap-2 p-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="text-sm font-semibold leading-snug text-[#2C2A28]">{item.title}</div>
                  {item.body ? (
                    <p className="text-sm leading-relaxed text-[#6B625B]">{item.body}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((item, index) => (
                <ItemCard key={`${item.title}-${index}`} item={item} index={index} />
              ))}
            </div>
          )
        ) : null}
      </section>
    );
  };

  const renderDetailModule = (module: DetailModule) => {
    const title = lang === 'en' ? module.title_en : module.title_cn;
    const body = lang === 'en' ? module.body_en : module.body_cn;
    const items = lang === 'en' ? module.items_en ?? [] : module.items_cn ?? [];
    const images = uniqueImageList([module.image_url, ...(module.images ?? [])]);

    if (module.type === 'faq') return renderFaqModule(module, title, body, items);
    if (module.type === 'scenarios') return renderScenarioModule(module, title, body, items, images);
    if (module.type === 'customization') return renderCustomizationModule(module, title, body, items, images);
    if (module.type === 'highlights') return renderHighlightModule(module, title, body, items, images);

    return renderContentModule(module, title, body, items, images);
  };

  return (
    <main className="bg-white text-[#2C2A28]">
      <section className="relative min-h-[460px] overflow-hidden bg-[#1C1A18] sm:min-h-[540px]">
        <ProtectedImage
          src={product.image}
          alt={name}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#1C1A18] via-[#1C1A18]/60 to-[#1C1A18]/10" />

        <div className="absolute inset-x-0 top-6 z-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs tracking-wider text-white/70">
              <Link href="/" className="hover:text-[#E36F2C]">
                {t(i18n.productDetail.home)}
              </Link>
              <span>/</span>
              <Link href="/products" className="hover:text-[#E36F2C]">
                {t(i18n.productDetail.breadcrumbProducts)}
              </Link>
              <span>/</span>
              <span className="text-white">{name}</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {badge ? (
                <span className="bg-[#E36F2C] px-2.5 py-1 text-[10px] font-bold tracking-wider text-white">
                  {badge}
                </span>
              ) : null}
              {product.isCustom ? (
                <span className="border border-white/35 px-2.5 py-1 text-[10px] tracking-wider text-white/80">
                  {lang === 'en' ? 'Custom Case' : '定制案例'}
                </span>
              ) : null}
            </div>
            <h1 className="max-w-5xl text-3xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              <span className="text-[#E36F2C]">VESSEL</span>
              <span className="ml-3">{name}</span>
            </h1>
            {description ? (
              <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-8 text-white/78 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {quickStats.length > 0 ? (
        <section className="border-b border-[#E5DED4] bg-[#241F1B]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/10 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8">
            {quickStats.map((item, index) => (
              <div key={`${item.label}-${index}`} className="px-0 py-4 sm:px-5">
                {item.value ? (
                  <>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">{item.label}</div>
                    <div className="mt-1 text-base font-bold tracking-normal text-white">{item.value}</div>
                  </>
                ) : (
                  <div className="text-sm font-semibold leading-relaxed tracking-normal text-white">
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-11">
            {media.length > 0 ? (
              <section>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#111111]">
                  <ProtectedImage
                    src={activeImage}
                    alt={`${name} ${activeImageIndex + 1}`}
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                  {media.length > 1 ? (
                    <div className="absolute bottom-3 right-3 z-20 bg-[#241F1B]/75 px-2.5 py-1 text-[10px] tracking-widest text-white/70">
                      {Math.min(activeImageIndex + 1, media.length)} / {media.length}
                    </div>
                  ) : null}
                </div>

                {media.length > 1 ? (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                    {media.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        aria-label={`${lang === 'en' ? 'View image' : '查看图片'} ${index + 1}`}
                        className={`relative h-16 w-20 shrink-0 overflow-hidden border-2 transition-opacity sm:h-20 sm:w-24 ${
                          index === activeImageIndex
                            ? 'border-[#E36F2C] opacity-100'
                            : 'border-[#E5DED4] opacity-60 hover:opacity-90'
                        }`}
                      >
                        <ProtectedImage
                          src={src}
                          alt={`${name} thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-[#E0DCD6] bg-[#FAF7F2] px-3 py-1.5 text-xs tracking-wider text-[#5F5750]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {features.length > 0 ? (
              <section>
                <SectionLabel label={t(i18n.productDetail.featuresLabel)} />
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <li key={`${feature}-${index}`} className="flex gap-3 border border-[#E5DED4] bg-[#FAF7F2] p-4">
                      <span className="mt-0.5 text-sm text-[#E36F2C]">▸</span>
                      <span className="text-sm leading-relaxed tracking-normal text-[#5A5A5A]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detailModules.length > 0 ? (
              <div className="space-y-11">{detailModules.map(renderDetailModule)}</div>
            ) : null}

            {specRows.length > 0 ? (
              <section>
                <SectionLabel label={lang === 'en' ? 'Specifications' : '规格参数'} />
                <div className="grid grid-cols-1 border border-[#E5DED4] sm:grid-cols-2">
                  {specRows.map(({ label, value }) => (
                    <div key={`${label}-${value}`} className="border-b border-[#E5DED4] bg-white p-5 sm:border-r">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8A8580]">{label}</div>
                      <div className="text-base font-bold leading-snug tracking-normal text-[#2C2A28]">{value}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[#E5DED4] bg-white p-6 shadow-[0_18px_60px_rgba(44,42,40,0.08)]">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#E36F2C]">
                {lang === 'en' ? 'Project quote' : '项目报价'}
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-normal text-[#2C2A28]">
                {lang === 'en' ? 'Inquire for project pricing' : '获取项目报价'}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#6B625B]">
                {lang === 'en'
                  ? 'Pricing depends on configuration, destination, quantity, and project requirements. Send your requirements to receive a project quote.'
                  : '价格会根据配置、交付地、采购数量和项目要求核算。请提交需求，由顾问提供项目报价。'}
              </p>
            </div>

            <div className="border border-[#E5DED4] bg-[#FAF7F2] p-5">
              <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#E36F2C]">
                {lang === 'en' ? 'Product summary' : '产品摘要'}
              </div>
              <dl className="space-y-3">
                {specRows.slice(0, 5).map(({ label, value }) => (
                  <div key={`${label}-${value}-side`} className="flex justify-between gap-4 border-b border-[#E5DED4] pb-3 text-sm last:border-b-0 last:pb-0">
                    <dt className="shrink-0 text-[#8A8580]">{label}</dt>
                    <dd className="text-right font-semibold text-[#2C2A28]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#E36F2C] py-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors duration-200 hover:bg-[#C85A1F]"
            >
              {lang === 'en' ? 'Inquire now' : '立即询价'}
            </Link>

            <Link
              href="/products"
              className="block border border-[#E36F2C]/20 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#E36F2C]/80 transition-colors duration-200 hover:border-[#E36F2C]/50 hover:text-[#E36F2C]"
            >
              {t(i18n.productDetail.otherProducts)}
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
