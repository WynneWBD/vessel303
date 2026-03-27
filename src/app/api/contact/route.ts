import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'onboarding@resend.dev';
const NOTIFY_TO = 'wynnewbd@gmail.com';

// B端咨询类型
const B_END_TYPES = new Set(['咨询报价', '合作代理', '定制服务']);

const schema = z.object({
  inquiryType: z.string().min(1, '请选择咨询类型'),
  name: z.string().min(1, '请填写姓名'),
  phone: z.string().min(1, '请填写联系电话'),
  email: z.string().email('邮箱格式不正确').min(1, '请填写邮箱地址'),
  company: z.string().optional().default(''),
  location: z.string().optional().default(''),
  projectType: z.string().optional().default(''),
  quantity: z.string().optional().default(''),
  model: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
});

function row(label: string, value: string) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:8px 12px;color:#999;font-size:13px;white-space:nowrap;border-bottom:1px solid #222;">${label}</td>
      <td style="padding:8px 12px;color:#eee;font-size:13px;border-bottom:1px solid #222;">${value}</td>
    </tr>`;
}

function notificationHtml(d: z.infer<typeof schema>, isBEnd: boolean) {
  const tag = isBEnd ? 'B端线索' : 'C端线索';
  const tagColor = isBEnd ? '#c9a84c' : '#7a9ec9';
  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #222;">

    <!-- Header -->
    <div style="padding:24px 28px;border-bottom:1px solid #222;display:flex;align-items:center;gap:12px;">
      <span style="color:#c9a84c;font-weight:900;font-size:18px;letter-spacing:0.2em;">VESSEL 微宿®</span>
      <span style="background:${tagColor};color:#0a0a0a;font-size:11px;font-weight:700;padding:3px 10px;letter-spacing:0.1em;">${tag}</span>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px;">
      <p style="color:#888;font-size:13px;margin:0 0 20px;">新的客户咨询已提交，请及时跟进：</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #222;">
        ${row('咨询类型', d.inquiryType)}
        ${row('姓名', d.name)}
        ${row('联系电话', d.phone)}
        ${row('邮箱', d.email ?? '')}
        ${row('公司名称', d.company ?? '')}
        ${row('所在地区', d.location ?? '')}
        ${row('项目类型', d.projectType ?? '')}
        ${row('采购数量', d.quantity ? d.quantity + ' 台' : '')}
        ${row('产品型号', d.model ?? '')}
        ${row('备注', d.remarks ?? '')}
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:16px 28px;border-top:1px solid #222;">
      <p style="color:#555;font-size:11px;margin:0;">
        来自 VESSEL 微宿® 官网表单系统 · vessel303.com<br/>
        提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
      </p>
    </div>
  </div>
</body>
</html>`;
}

function confirmationHtml(d: z.infer<typeof schema>) {
  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #222;">

    <!-- Header -->
    <div style="padding:28px;background:linear-gradient(135deg,#1a1a1a,#111);border-bottom:1px solid #c9a84c22;text-align:center;">
      <div style="color:#c9a84c;font-weight:900;font-size:20px;letter-spacing:0.3em;margin-bottom:4px;">VESSEL 微宿®</div>
      <div style="color:#555;font-size:11px;letter-spacing:0.2em;">高端度假营地一站式解决方案</div>
    </div>

    <!-- Body -->
    <div style="padding:32px 28px;">
      <p style="color:#ddd;font-size:15px;margin:0 0 8px;">尊敬的 <strong style="color:#c9a84c;">${d.name}</strong> 您好，</p>
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 24px;">
        感谢您的咨询！我们已收到您的「${d.inquiryType}」留言，专业顾问将在 <strong style="color:#fff;">24小时内</strong>与您取得联系。
      </p>

      <div style="background:#0f0f0f;border:1px solid #222;padding:16px 20px;margin-bottom:24px;">
        <div style="color:#c9a84c;font-size:11px;letter-spacing:0.2em;margin-bottom:12px;">您的咨询摘要</div>
        <table style="width:100%;border-collapse:collapse;">
          ${row('咨询类型', d.inquiryType)}
          ${d.projectType ? row('项目类型', d.projectType) : ''}
          ${d.model ? row('产品型号', d.model) : ''}
        </table>
      </div>

      <p style="color:#666;font-size:13px;line-height:1.7;margin:0 0 8px;">如需紧急咨询，欢迎直接联系：</p>
      <p style="margin:0;">
        <a href="tel:4008090303" style="color:#c9a84c;font-weight:700;text-decoration:none;font-size:16px;">400-8090-303</a>
        <span style="color:#444;font-size:13px;margin-left:12px;">工作日 9:00–18:00</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 28px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="color:#444;font-size:11px;margin:0;line-height:1.6;">
        VESSEL 微宿® · 高端度假营地开创者<br/>
        广东省佛山市南海区狮山镇兴业北路253号 · vessel303.com
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '请填写必填项';
    return Response.json({ error: message }, { status: 400 });
  }

  const data = parsed.data;
  const isBEnd = B_END_TYPES.has(data.inquiryType);
  const subject = isBEnd
    ? '【B端线索】新采购咨询 - VESSEL 微宿'
    : '【C端线索】新营地咨询 - VESSEL 微宿';

  // Send notification to team (must succeed)
  const { error: notifyError } = await resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    subject,
    html: notificationHtml(data, isBEnd),
  });

  if (notifyError) {
    console.error('Resend notification error:', notifyError);
    return Response.json({ error: '邮件发送失败，请稍后再试' }, { status: 500 });
  }

  // Send confirmation to user (best-effort — don't fail the request if this fails)
  if (data.email) {
    const { error: confirmError } = await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: '感谢您的咨询 — VESSEL 微宿® 已收到您的留言',
      html: confirmationHtml(data),
    });
    if (confirmError) {
      console.warn('Resend confirmation email error:', confirmError);
    }
  }

  return Response.json({ success: true });
}
