'use client'

import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { buildGlobalCmsLabels, type GlobalPageModuleLike } from '@/lib/global-page-cms'

export default function GlobalMapStats({ pageModules = [] }: { pageModules?: GlobalPageModuleLike[] }) {
  const { lang, setLang } = useLanguage()
  const labels = buildGlobalCmsLabels(pageModules, lang === 'zh' ? 'zh' : 'en')

  const stats = [
    { value: labels.countriesValue, label: labels.countriesLabel },
    { value: labels.campsValue, label: labels.campsLabel },
    { value: labels.devicesValue, label: labels.devicesLabel },
  ]

  return (
    <div
      className="vessel-global-header"
      data-page-module="global:header"
      data-page-key="global"
      data-module-key="header"
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
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
          <span className="vessel-global-header__title">{labels.headerTitle}</span>
        </div>

        <div
          className="vessel-global-header__desktop-stats"
          style={{ alignItems: 'center', gap: 32, marginLeft: 'auto', marginRight: 24 }}
        >
          {stats.map((item, index) => (
            <div key={item.label} style={{ display: 'contents' }}>
              {index > 0 ? <div style={{ width: 1, height: 16, background: '#E5DED4' }} /> : null}
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>
                  {item.value}
                </span>
                <span style={{ color: '#8A7D74', fontSize: 12, marginLeft: 4 }}>
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
              <span style={{ color: '#E36F2C', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em' }}>
                {item.value}
              </span>
              <span style={{ color: '#8A7D74', fontSize: 11, marginLeft: 3 }}>
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>

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
