import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const apply = process.argv.includes('--apply')

function loadEnvFile(name) {
  const file = resolve(root, name)
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL / POSTGRES_URL.')
  process.exit(1)
}

function item(id, labelZh, labelEn, sortOrder, extra = {}) {
  return { id, label_zh: labelZh, label_en: labelEn, is_visible: true, sort_order: sortOrder, ...extra }
}

const formItems = (scopeZh, scopeEn, submitZh, submitEn, successZh, successEn, messageZh, messageEn, start = 10) => [
  item('form-eyebrow', scopeZh, scopeEn, start),
  item('form-name', '姓名', 'Name', start + 10),
  item('form-email', '邮箱', 'Email', start + 20),
  item('form-phone', '电话 / WhatsApp', 'Phone / WhatsApp', start + 30),
  item('form-country', '国家 / 城市', 'Country / City', start + 40),
  item('form-company', '公司 / 机构', 'Company / Organization', start + 50),
  item('form-quantity', '预计数量', 'Expected Quantity', start + 60),
  item('form-message', messageZh, messageEn, start + 70),
  item('form-submit', submitZh, submitEn, start + 80),
  item('form-submitting', '提交中', 'Submitting', start + 90),
  item('form-success', successZh, successEn, start + 100),
  item('form-error', '提交失败，请稍后再试。', 'Submission failed. Please try again.', start + 110),
  item('form-source-prefix', '来源', 'Source', start + 120),
  item('form-company-prefix', '公司', 'Company', start + 130),
]

const modules = [
  {
    id: 'site:navbar',
    page_key: 'site',
    module_key: 'navbar',
    module_type: 'navigation',
    title_zh: '顶部导航',
    title_en: 'Navbar',
    description_zh: '全站顶部导航和行动按钮。前台只渲染已发布且可见的项目。',
    description_en: 'Global navbar links and action buttons. The frontend renders only published visible items.',
    items: [
      item('logo', 'VESSEL 微宿', 'VESSEL', 5, { href: '/', image_url: '/images/vessel-logo.png', value_zh: 'brand', value_en: 'brand' }),
      item('nav-products', '产品系列', 'Products', 10, { href: '/products', value_zh: 'primary', value_en: 'primary' }),
      item('nav-cases', '项目案例', 'Cases', 20, { href: '/cases', value_zh: 'primary', value_en: 'primary' }),
      item('nav-about', '关于我们', 'About', 30, { href: '/about', value_zh: 'primary', value_en: 'primary' }),
      item('nav-faq', '常见问题', 'FAQ', 40, { href: '/faq', value_zh: 'primary', value_en: 'primary' }),
      item('nav-news', '新闻活动', 'News', 50, { href: '/news', value_zh: 'primary', value_en: 'primary' }),
      item('nav-contact', '联系我们', 'Contact', 60, { href: '/contact?source=navbar:contact_nav', value_zh: 'primary', value_en: 'primary' }),
      item('action-purchase', '采购咨询', 'Purchase Inquiry', 70, { href: '/contact?source=navbar:purchase_cta', value_zh: 'action', value_en: 'action' }),
      item('action-booking', '预订营地', 'Book a Visit', 80, { href: '/contact?source=navbar:booking_cta', value_zh: 'action', value_en: 'action' }),
    ],
    is_visible: true,
    sort_order: 10,
  },
  {
    id: 'site:ui-labels',
    page_key: 'site',
    module_key: 'ui-labels',
    module_type: 'fixed-content',
    title_zh: '全站界面标签',
    title_en: 'Global interface labels',
    description_zh: '导航、抽屉、图片和轮播等客户可见交互标签。',
    description_en: 'Customer-facing interaction labels for navigation, drawers, images, and carousel controls.',
    items: [
      item('menu-toggle', '打开或关闭菜单', 'Toggle menu', 10),
      item('drawer-close', '关闭', 'Close', 20),
    ],
    is_visible: true,
    sort_order: 15,
  },
  {
    id: 'site:footer-brand',
    page_key: 'site',
    module_key: 'footer-brand',
    module_type: 'fixed-content',
    title_zh: 'VESSEL 微宿',
    title_en: 'VESSEL',
    description_zh: '面向文旅度假、商业空间和公共服务场景的智能装配式建筑系统。',
    description_en: 'Smart prefab architecture for resorts, commercial spaces, and public facilities.',
    items: [
      item('logo', 'VESSEL 微宿', 'VESSEL', 5, { href: '/', image_url: '/images/vessel-logo.png' }),
      item('tagline', '智能装配式建筑', 'Smart Prefab Architecture', 10),
      item('whatsapp', 'WhatsApp: +86 180-2417-6679', 'WhatsApp: +86 180-2417-6679', 20),
      item('email', 'Email: 303vessel@303industries.cn', 'Email: 303vessel@303industries.cn', 30, { href: 'mailto:303vessel@303industries.cn' }),
    ],
    is_visible: true,
    sort_order: 30,
  },
  {
    id: 'products:ui-labels',
    page_key: 'products',
    module_key: 'ui-labels',
    module_type: 'fixed-content',
    title_zh: '产品目录界面文案',
    title_en: 'Product catalog interface labels',
    description_zh: '产品目录筛选、按钮、空状态和图片标签。',
    description_en: 'Customer-facing labels for filters, buttons, empty state, and image controls.',
    items: [
      item('image-label-prefix', '产品图片', 'Product image', 140),
    ],
    is_visible: true,
    sort_order: 40,
  },
  {
    id: 'products:inquiry-form',
    page_key: 'products',
    module_key: 'inquiry-form',
    module_type: 'fixed-content',
    title_zh: '产品询盘',
    title_en: 'Product Inquiry',
    description_zh: '填写项目需求，后台会按产品详情页来源生成线索。',
    description_en: 'Share project requirements and the backend will track this lead from the product detail page.',
    items: [
      item('inquiry-type', '产品询盘', 'Product Inquiry', 10),
      ...formItems('产品咨询', 'Product Consultation', '提交产品询盘', 'Submit Product Inquiry', '已收到产品需求，我们会按该产品来源跟进。', 'Received. The team will follow up from this product source.', '产品需求', 'Product Requirements', 20),
    ],
    is_visible: true,
    sort_order: 45,
  },
  {
    id: 'cases:inquiry-form',
    page_key: 'cases',
    module_key: 'inquiry-form',
    module_type: 'fixed-content',
    title_zh: '案例咨询',
    title_en: 'Case Inquiry',
    description_zh: '填写项目背景，后台会按案例详情页来源生成线索。',
    description_en: 'Share project context and the backend will track this lead from the case detail page.',
    items: [
      item('inquiry-type', '案例咨询', 'Project Case Inquiry', 10),
      ...formItems('案例咨询', 'Case Consultation', '提交案例咨询', 'Submit Case Inquiry', '已收到案例咨询，我们会按该案例来源跟进。', 'Received. The team will follow up from this case source.', '项目需求', 'Project Requirements', 20),
    ],
    is_visible: true,
    sort_order: 20,
  },
  {
    id: 'faq:hero',
    page_key: 'faq',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '常见问题',
    title_en: 'Frequently Asked Questions',
    description_zh: '查看产品、运输、安装、认证和商务条款相关问题。',
    description_en: 'Review product, transport, installation, certification, and commercial questions.',
    items: formItems('项目咨询', 'Project Inquiry', '提交咨询', 'Submit Inquiry', '已收到，我们会按该页面来源跟进。', 'Received. The team will follow up from this page source.', '问题或项目需求', 'Question or Project Requirements', 100),
    is_visible: true,
    sort_order: 10,
  },
  {
    id: 'media-kit:hero',
    page_key: 'media-kit',
    module_key: 'hero',
    module_type: 'fixed-content',
    title_zh: '媒体资料',
    title_en: 'Media Kit',
    description_zh: '获取 VESSEL 产品图片、品牌资料和项目资料申请入口。',
    description_en: 'Request VESSEL product images, brand materials, and project references.',
    items: [
      item('label-name', '姓名', 'Name', 60),
      item('label-email', '邮箱', 'Email', 70),
      item('label-phone', '电话 / WhatsApp', 'Phone / WhatsApp', 80),
      item('label-company', '公司 / 机构', 'Company / Organization', 90),
      item('label-country', '国家 / 城市', 'Country / City', 100),
      item('label-use-case', '资料用途', 'Asset Use Case', 110),
      item('label-message', '补充说明', 'Additional Notes', 120),
      item('submit', '提交资料申请', 'Submit Media Request', 130),
      item('submitting', '提交中', 'Submitting', 140),
      item('success-title', '已收到资料申请', 'Media Request Received', 150),
      item('success-body', '团队会按您的用途回复可用资料。', 'The team will respond with suitable assets for your use case.', 160),
      item('error-body', '提交失败，请稍后再试。', 'Submission failed. Please try again.', 170),
      item('use-case-press', '媒体报道', 'Press Coverage', 180, { value_zh: 'press', value_en: 'press' }),
      item('use-case-proposal', '项目提案', 'Project Proposal', 190, { value_zh: 'proposal', value_en: 'proposal' }),
      item('use-case-channel', '渠道介绍', 'Channel Introduction', 200, { value_zh: 'channel', value_en: 'channel' }),
      item('use-case-research', '研究参考', 'Research Reference', 210, { value_zh: 'research', value_en: 'research' }),
    ],
    is_visible: true,
    sort_order: 10,
  },
  {
    id: 'scenarios:inquiry-form',
    page_key: 'scenarios',
    module_key: 'inquiry-form',
    module_type: 'fixed-content',
    title_zh: '场景方案咨询',
    title_en: 'Scenario Inquiry',
    description_zh: '填写场景需求，后台会按场景页来源生成线索。',
    description_en: 'Share scenario requirements and the backend will track this lead from the scenario page.',
    items: formItems('场景咨询', 'Scenario Consultation', '提交场景咨询', 'Submit Scenario Inquiry', '已收到场景需求，我们会按该场景来源跟进。', 'Received. The team will follow up from this scenario source.', '场景需求', 'Scenario Requirements', 10),
    is_visible: true,
    sort_order: 20,
  },
  {
    id: 'innovation:inquiry-form',
    page_key: 'innovation',
    module_key: 'inquiry-form',
    module_type: 'fixed-content',
    title_zh: '技术专题咨询',
    title_en: 'Innovation Inquiry',
    description_zh: '填写技术或项目需求，后台会按技术专题来源生成线索。',
    description_en: 'Share technical or project requirements and the backend will track this lead from the innovation page.',
    items: [
      item('inquiry-type', '技术专题咨询', 'Innovation Inquiry', 10),
      ...formItems('技术咨询', 'Technology Consultation', '提交技术咨询', 'Submit Innovation Inquiry', '已收到咨询，我们会按该专题来源跟进。', 'Received. The team will follow up from this innovation source.', '技术或项目需求', 'Technology or Project Requirements', 20),
    ],
    is_visible: true,
    sort_order: 20,
  },
]

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

function normalizeItems(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function mergeItems(existing, defaults) {
  const existingIds = new Set(existing.map((row) => row?.id).filter(Boolean))
  return {
    items: [...existing, ...defaults.filter((row) => row?.id && !existingIds.has(row.id))],
    added: defaults.filter((row) => row?.id && !existingIds.has(row.id)).map((row) => row.id),
  }
}

async function main() {
  const client = await pool.connect()
  const changes = []

  try {
    await client.query('BEGIN')
    for (const pageModule of modules) {
      const existing = await client.query(
        'SELECT id, items, title_zh, title_en, description_zh, description_en FROM page_modules WHERE page_key = $1 AND module_key = $2 LIMIT 1',
        [pageModule.page_key, pageModule.module_key],
      )

      if (existing.rowCount === 0) {
        changes.push(`${pageModule.page_key}:${pageModule.module_key} insert ${pageModule.items.length} items`)
        if (apply) {
          await client.query(
            `INSERT INTO page_modules (
              id, page_key, module_key, module_type, title_zh, title_en,
              description_zh, description_en, items, is_visible, sort_order
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
            [
              pageModule.id,
              pageModule.page_key,
              pageModule.module_key,
              pageModule.module_type,
              pageModule.title_zh,
              pageModule.title_en,
              pageModule.description_zh,
              pageModule.description_en,
              JSON.stringify(pageModule.items),
              pageModule.is_visible,
              pageModule.sort_order,
            ],
          )
        }
        continue
      }

      const current = existing.rows[0]
      const { items, added } = mergeItems(normalizeItems(current.items), pageModule.items)
      if (added.length === 0) continue
      changes.push(`${pageModule.page_key}:${pageModule.module_key} add ${added.join(', ')}`)
      if (apply) {
        await client.query(
          `UPDATE page_modules
           SET items = $3::jsonb,
               title_zh = CASE WHEN COALESCE(title_zh, '') = '' THEN $4 ELSE title_zh END,
               title_en = CASE WHEN COALESCE(title_en, '') = '' THEN $5 ELSE title_en END,
               description_zh = CASE WHEN COALESCE(description_zh, '') = '' THEN $6 ELSE description_zh END,
               description_en = CASE WHEN COALESCE(description_en, '') = '' THEN $7 ELSE description_en END
           WHERE page_key = $1 AND module_key = $2`,
          [
            pageModule.page_key,
            pageModule.module_key,
            JSON.stringify(items),
            pageModule.title_zh,
            pageModule.title_en,
            pageModule.description_zh,
            pageModule.description_en,
          ],
        )
      }
    }

    if (apply) {
      await client.query('COMMIT')
    } else {
      await client.query('ROLLBACK')
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }

  console.log(apply ? 'B25 page module backfill applied.' : 'B25 page module backfill dry-run.')
  if (changes.length === 0) {
    console.log('No missing modules or items found.')
  } else {
    for (const change of changes) console.log(`- ${change}`)
  }
}

main().catch((err) => {
  if (err instanceof Error) {
    console.error([err.name, err.message, err.code].filter(Boolean).join(': '))
  } else {
    console.error(err)
  }
  process.exit(1)
})
