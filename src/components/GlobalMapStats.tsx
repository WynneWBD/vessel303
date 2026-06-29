'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  buildGlobalCmsLabels,
  globalItemAttrs,
  globalModuleAttrs,
  globalModuleFieldAttrs,
  type GlobalCmsLang,
  type GlobalPageModuleLike,
} from '@/lib/global-page-cms'

function visualOpenPanelAttrs(key: string) {
  return { 'data-visual-open-panel': key }
}

export default function GlobalMapStats({ pageModules = [] }: { pageModules?: GlobalPageModuleLike[] }) {
  const { lang, setLang } = useLanguage()
  const searchParams = useSearchParams()
  const cmsLang: GlobalCmsLang = lang === 'zh' ? 'zh' : 'en'
  const visualDraftPreview = searchParams?.get('visualDraft') === '1'
  const labels = buildGlobalCmsLabels(pageModules, cmsLang)

  const stats = [
    { id: 'countries', value: labels.countriesValue, label: labels.countriesLabel },
    { id: 'camps', value: labels.campsValue, label: labels.campsLabel },
    { id: 'devices', value: labels.devicesValue, label: labels.devicesLabel },
  ]

  return (
    <div
      className="vessel-global-header"
      {...globalModuleAttrs('header')}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#F5F2ED',
        zIndex: 1000,
        borderBottom: '1px solid #E5DED4',
      }}
    >
      <div className="vessel-global-header__main">
        <div className="vessel-global-header__brand">
          <span
            onClick={() => window.history.back()}
            role="button"
            {...visualOpenPanelAttrs('global-header-back')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            {...globalItemAttrs('header', 'logo-alt', cmsLang)}
          >
            <Image
              src="/images/vessel-logo.png"
              alt={labels.logoAlt}
              height={24}
              width={96}
              style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
              unoptimized
            />
          </span>
          <div style={{ width: 1, height: 20, background: 'rgba(138,133,128,0.4)' }} />
          <span className="vessel-global-header__title" {...globalModuleFieldAttrs('header', 'title', cmsLang)}>{labels.headerTitle}</span>
        </div>

        <div
          className="vessel-global-header__desktop-stats"
          style={{ alignItems: 'center', gap: 32, marginLeft: 'auto', marginRight: 24 }}
        >
          {stats.map((item, index) => (
            <div key={item.label} style={{ display: 'contents' }}>
              {index > 0 ? <div style={{ width: 1, height: 16, background: '#E5DED4' }} /> : null}
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }} {...globalItemAttrs('header', item.id, cmsLang, 'value')}>
                  {item.value}
                </span>
                <span style={{ color: '#8A7D74', fontSize: 12, marginLeft: 4 }} {...globalItemAttrs('header', item.id, cmsLang)}>
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="vessel-global-header__lang"
          style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5DED4', overflow: 'hidden', flexShrink: 0 }}
        >
          <button
            onClick={() => setLang('en')}
            {...visualOpenPanelAttrs('global-language-toggle')}
            {...globalItemAttrs('header', 'language-en', cmsLang)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              border: 'none',
              background: lang === 'en' ? '#E36F2C' : 'transparent',
              color: lang === 'en' ? '#F5F2ED' : '#8A7D74',
              fontWeight: lang === 'en' ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {labels.languageEn}
          </button>
          <div style={{ width: 1, height: 12, background: '#E5DED4' }} />
          <button
            onClick={() => setLang('zh')}
            {...visualOpenPanelAttrs('global-language-toggle')}
            {...globalItemAttrs('header', 'language-zh', cmsLang)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              border: 'none',
              background: lang === 'zh' ? '#E36F2C' : 'transparent',
              color: lang === 'zh' ? '#F5F2ED' : '#8A7D74',
              fontWeight: lang === 'zh' ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {labels.languageZh}
          </button>
        </div>
      </div>

      <div
        className="vessel-global-header__mobile-stats"
        style={{ borderTop: '1px solid #E5DED4', padding: '0 24px' }}
      >
        {stats.map((item, index) => (
          <div key={item.label} style={{ display: 'contents' }}>
            {index > 0 ? <span style={{ color: '#C4B9AB', fontSize: 12 }}>/</span> : null}
            <div>
              <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em' }} {...globalItemAttrs('header', item.id, cmsLang, 'value')}>
                {item.value}
              </span>
              <span style={{ color: '#8A7D74', fontSize: 11, marginLeft: 3 }} {...globalItemAttrs('header', item.id, cmsLang)}>
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {visualDraftPreview ? (
        <div className="vessel-global-visual-hero" {...globalModuleAttrs('hero')}>
          <span className="vessel-global-visual-hero__eyebrow" {...globalItemAttrs('hero', 'eyebrow', cmsLang)}>
            {labels.heroEyebrow}
          </span>
          <strong className="vessel-global-visual-hero__title" {...globalModuleFieldAttrs('hero', 'title', cmsLang)}>
            {labels.seoTitle}
          </strong>
          <span className="vessel-global-visual-hero__description" {...globalModuleFieldAttrs('hero', 'description', cmsLang)}>
            {labels.seoDescription}
          </span>
        </div>
      ) : null}

      <style>{`
        .vessel-global-header {
          display: flex;
          flex-direction: column;
          height: 92px;
          font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        }
        .vessel-global-header__main {
          display: flex;
          align-items: center;
          min-width: 0;
          height: 56px;
          padding: 0 16px;
        }
        .vessel-global-header__brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex-shrink: 1;
        }
        .vessel-global-header__title {
          min-width: 0;
          overflow: hidden;
          color: #8A7D74;
          font-size: 13px;
          letter-spacing: 0.08em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vessel-global-header__desktop-stats {
          display: none;
        }
        .vessel-global-header__lang {
          margin-left: auto;
        }
        .vessel-global-header__mobile-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          height: 36px;
          box-sizing: border-box;
          overflow: hidden;
          white-space: nowrap;
        }
        .vessel-global-header__mobile-stats > div {
          min-width: 0;
        }
        .vessel-global-visual-hero {
          position: fixed;
          top: calc(var(--global-map-header-height, 92px) + 16px);
          left: 16px;
          z-index: 980;
          display: grid;
          width: min(520px, calc(100vw - 32px));
          gap: 8px;
          box-sizing: border-box;
          border: 1px solid rgba(36, 31, 27, 0.16);
          border-radius: 8px;
          background: rgba(245, 242, 237, 0.94);
          box-shadow: 0 12px 32px rgba(36, 31, 27, 0.12);
          padding: 14px 16px;
          pointer-events: auto;
        }
        .vessel-global-visual-hero__eyebrow {
          color: #E36F2C;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          line-height: 1.2;
          text-transform: uppercase;
        }
        .vessel-global-visual-hero__title {
          color: #241F1B;
          font-family: var(--font-heading), 'DM Sans', sans-serif;
          font-size: 20px;
          line-height: 1.25;
        }
        .vessel-global-visual-hero__description {
          color: #6B625B;
          font-size: 13px;
          line-height: 1.55;
        }
        @media (max-width: 380px) {
          .vessel-global-header__main {
            padding: 0 10px;
          }
          .vessel-global-header__brand {
            gap: 8px;
          }
          .vessel-global-header__title {
            max-width: 7.8em;
            font-size: 12px;
            letter-spacing: 0.04em;
          }
          .vessel-global-header__mobile-stats {
            gap: 8px;
            padding: 0 10px !important;
          }
        }
        @media (min-width: 768px) {
          .vessel-global-header {
            flex-direction: row;
            align-items: center;
            height: 56px;
          }
          .vessel-global-header__main {
            flex: 1 1 auto;
            padding: 0 24px;
          }
          .vessel-global-header__brand {
            gap: 12px;
            flex-shrink: 0;
          }
          .vessel-global-header__title {
            font-size: 13px;
            letter-spacing: 0.1em;
          }
          .vessel-global-header__desktop-stats {
            display: flex;
          }
          .vessel-global-header__lang {
            margin-left: 0;
          }
          .vessel-global-header__mobile-stats {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
