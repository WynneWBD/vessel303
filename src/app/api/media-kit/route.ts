import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'onboarding@resend.dev';
const NOTIFY_TO = 'vessel.sale@303industries.cn';

const schema = z.object({
  name:    z.string().min(1, 'Name required').max(100),
  email:   z.string().email('Invalid email').max(200),
  phone:   z.string().min(1, 'Phone required').max(50),
  company: z.string().min(1, 'Company required').max(200),
  country: z.string().min(1, 'Country required').max(100),
  useCase: z.enum(['press', 'brand', 'investor', 'arch', 'other']),
  message: z.string().max(2000).optional().default(''),
});

const USE_CASE_LABELS: Record<z.infer<typeof schema>['useCase'], string> = {
  press:    'Press / Editorial · 媒体采访报道',
  brand:    'Brand Partnership · 品牌合作',
  investor: 'Investor Relations · 投资机构',
  arch:     'Architecture Media · 建筑媒体',
  other:    'Other · 其他',
};

function row(label: string, value: string) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:8px 12px;color:#999;font-size:13px;white-space:nowrap;border-bottom:1px solid #222;vertical-align:top;">${label}</td>
      <td style="padding:8px 12px;color:#eee;font-size:13px;border-bottom:1px solid #222;">${value}</td>
    </tr>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function notificationHtml(d: z.infer<typeof schema>) {
  const safe = {
    name: escapeHtml(d.name),
    email: escapeHtml(d.email),
    phone: escapeHtml(d.phone),
    company: escapeHtml(d.company),
    country: escapeHtml(d.country),
    useCase: USE_CASE_LABELS[d.useCase],
    message: escapeHtml(d.message).replace(/\n/g, '<br/>'),
  };
  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #222;">
    <div style="padding:24px 28px;border-bottom:1px solid #222;display:flex;align-items:center;gap:12px;">
      <span style="color:#E36F2C;font-weight:900;font-size:18px;letter-spacing:0.2em;">VESSEL 微宿®</span>
      <span style="background:#E36F2C;color:#0a0a0a;font-size:11px;font-weight:700;padding:3px 10px;letter-spacing:0.1em;">MEDIA KIT 申请</span>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#888;font-size:13px;margin:0 0 20px;">新的高清素材申请，请在 2 个工作日内回复：</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #222;">
        ${row('姓名 / Name', safe.name)}
        ${row('邮箱 / Email', safe.email)}
        ${row('电话 / Phone', safe.phone)}
        ${row('公司 / Company', safe.company)}
        ${row('国家 / Country', safe.country)}
        ${row('使用目的 / Use', safe.useCase)}
        ${row('具体需求 / Note', safe.message)}
      </table>
      <p style="color:#555;font-size:12px;margin:20px 0 0;line-height:1.6;">
        回复流程：审核合规性 → Google Drive 添加邮箱为查看权限 → 邮件告知链接<br/>
        交付资产前请确认申请方的用途与发布渠道。
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #222;">
      <p style="color:#555;font-size:11px;margin:0;">
        来自 VESSEL 微宿® 媒体资源表单 · vessel303.com/media-kit<br/>
        提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
      </p>
    </div>
  </div>
</body>
</html>`;
}

function confirmationHtml(d: z.infer<typeof schema>) {
  const isZh = /[\u4e00-\u9fff]/.test(d.name) || /[\u4e00-\u9fff]/.test(d.company);
  if (isZh) {
    return `<!DOCTYPE html>
<html lang="zh"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #222;">
    <div style="padding:28px;border-bottom:1px solid #E36F2C33;text-align:center;">
      <div style="color:#E36F2C;font-weight:900;font-size:20px;letter-spacing:0.3em;">VESSEL 微宿®</div>
    </div>
    <div style="padding:32px 28px;">
      <p style="color:#ddd;font-size:15px;margin:0 0 8px;">尊敬的 <strong style="color:#E36F2C;">${escapeHtml(d.name)}</strong> 您好，</p>
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 18px;">
        我们已收到您的高清素材申请，媒体团队将在 <strong style="color:#fff;">2 个工作日内</strong>邮件回复，并附上 Google Drive 查看权限链接。
      </p>
      <p style="color:#666;font-size:13px;line-height:1.7;margin:0;">
        请注意：VESSEL 微宿® 所有影像素材均已嵌入 IPTC 版权元数据，使用时请注明 "Photo © VESSEL 微宿® / vessel303.com"。
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="color:#444;font-size:11px;margin:0;">vessel303.com · vessel.sale@303industries.cn</p>
    </div>
  </div>
</body></html>`;
  }
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #222;">
    <div style="padding:28px;border-bottom:1px solid #E36F2C33;text-align:center;">
      <div style="color:#E36F2C;font-weight:900;font-size:20px;letter-spacing:0.3em;">VESSEL®</div>
    </div>
    <div style="padding:32px 28px;">
      <p style="color:#ddd;font-size:15px;margin:0 0 8px;">Hi <strong style="color:#E36F2C;">${escapeHtml(d.name)}</strong>,</p>
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 18px;">
        We have received your request for high-resolution assets. Our press team will review and reply within <strong style="color:#fff;">2 business days</strong> with a Google Drive access link.
      </p>
      <p style="color:#666;font-size:13px;line-height:1.7;margin:0;">
        Note: All VESSEL® imagery carries embedded IPTC copyright metadata. Please credit "Photo © VESSEL® / vessel303.com" when publishing.
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="color:#444;font-size:11px;margin:0;">vessel303.com · vessel.sale@303industries.cn</p>
    </div>
  </div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Missing required fields';
    return Response.json({ error: message }, { status: 400 });
  }

  const data = parsed.data;

  const { error: notifyError } = await resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    replyTo: data.email,
    subject: `【Media Kit】${data.company} · ${USE_CASE_LABELS[data.useCase]}`,
    html: notificationHtml(data),
  });

  if (notifyError) {
    console.error('Resend notification error:', notifyError);
    return Response.json({ error: 'Email delivery failed' }, { status: 500 });
  }

  const { error: confirmError } = await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: 'Request Received — VESSEL® Media Kit',
    html: confirmationHtml(data),
  });
  if (confirmError) {
    console.warn('Resend confirmation error:', confirmError);
  }

  return Response.json({ success: true });
}
