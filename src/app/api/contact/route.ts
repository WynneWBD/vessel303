import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { createLead } from '@/lib/leads-db';
import { listPublishedPageModules, type PageModuleItem, type PageModuleRow } from '@/lib/page-modules-db';

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM = 'onboarding@resend.dev';
const DEFAULT_NOTIFY_TO = '303vessel@303industries.cn';

const B_END_SOURCE_PREFIXES = [
  'case_detail:',
  'product_detail:',
  'faq:',
  'scenario:',
  'innovation:',
  'contact:',
  'navbar:',
  'footer:',
  'floating:',
];

const schema = z.object({
  inquiryType: z.string().min(1, 'Inquiry type required'),
  name: z.string().min(1, 'Name required'),
  phone: z.string().min(1, 'Phone required'),
  email: z.string().email('Invalid email').min(1, 'Email required'),
  company: z.string().optional().default(''),
  location: z.string().optional().default(''),
  projectType: z.string().optional().default(''),
  quantity: z.string().optional().default(''),
  model: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
  source: z.string().max(160).optional().default('website_contact'),
});

type ContactFormData = z.infer<typeof schema>;

type ContactEmailCopy = {
  subject: string;
  greeting: string;
  body: string;
  channelLabel: string;
  channelHref: string;
  channelContent: string;
  footer: string;
};

function getMailConfig() {
  return {
    from: process.env.RESEND_FROM || DEFAULT_FROM,
    notifyTo: process.env.CONTACT_NOTIFY_TO || DEFAULT_NOTIFY_TO,
  };
}

function clean(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function compactLines(lines: Array<string | false>) {
  return lines.filter((line): line is string => Boolean(line)).join('\n');
}

function buildLeadMessage(d: ContactFormData) {
  return compactLines([
    clean(d.remarks),
    clean(d.projectType) && `Project type: ${clean(d.projectType)}`,
    clean(d.quantity) && `Quantity: ${clean(d.quantity)}`,
    clean(d.model) && `Model: ${clean(d.model)}`,
  ]) || clean(d.inquiryType);
}

function getLeadSource(d: ContactFormData) {
  return clean(d.source) || 'website_contact';
}

function row(label: string, value: string) {
  if (!value) return '';
  const safeLabel = escapeHtml(label);
  const safeValue = escapeHtml(value);
  return `
    <tr>
      <td style="padding:8px 12px;color:#777;font-size:13px;white-space:nowrap;border-bottom:1px solid #e5e7eb;vertical-align:top;">${safeLabel}</td>
      <td style="padding:8px 12px;color:#111827;font-size:13px;white-space:pre-wrap;border-bottom:1px solid #e5e7eb;">${safeValue}</td>
    </tr>`;
}

function moduleByKey(modules: PageModuleRow[], moduleKey: string) {
  const pageModule = modules.find((entry) => entry.module_key === moduleKey && entry.is_visible !== false);
  return pageModule ?? null;
}

function visibleItem(module: PageModuleRow | null, id: string) {
  if (!module) return null;
  return (module.items ?? []).find((item) => item.id === id && item.is_visible !== false) ?? null;
}

function firstVisibleItem(module: PageModuleRow | null) {
  if (!module) return null;
  return [...(module.items ?? [])]
    .filter((item) => item.is_visible !== false)
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))[0] ?? null;
}

function englishLabel(item: PageModuleItem | null) {
  return item?.label_en?.trim() ?? '';
}

function englishContent(item: PageModuleItem | null) {
  return item?.content_en?.trim() ?? '';
}

async function loadContactEmailCopy(): Promise<ContactEmailCopy | null> {
  const modules = await listPublishedPageModules('contact').catch(() => []);
  const emailModule = moduleByKey(modules, 'email');
  const channelsModule = moduleByKey(modules, 'channels');
  const primaryChannel = firstVisibleItem(channelsModule);

  const subject = englishLabel(visibleItem(emailModule, 'confirmation-subject'));
  const greeting = englishLabel(visibleItem(emailModule, 'confirmation-greeting'));
  const body = englishLabel(visibleItem(emailModule, 'confirmation-body'));

  if (!subject || !greeting || !body) return null;

  return {
    subject,
    greeting,
    body,
    channelLabel: englishLabel(primaryChannel),
    channelHref: primaryChannel?.href?.trim() ?? '',
    channelContent: englishContent(primaryChannel),
    footer: emailModule?.description_en?.trim() || '',
  };
}

function notificationHtml(d: ContactFormData, isBEnd: boolean) {
  const submittedAt = new Date().toISOString();
  const tag = isBEnd ? 'B2B lead' : 'Website lead';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e5e7eb;">
    <div style="padding:22px 26px;border-bottom:1px solid #e5e7eb;">
      <div style="font-weight:800;font-size:18px;letter-spacing:0.16em;color:#241f1b;">VESSEL</div>
      <div style="margin-top:6px;color:#c65f22;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">${tag}</div>
    </div>
    <div style="padding:24px 26px;">
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
        ${row('Inquiry type', d.inquiryType)}
        ${row('Name', d.name)}
        ${row('Phone / WhatsApp', d.phone)}
        ${row('Email', d.email)}
        ${row('Company', d.company)}
        ${row('Country / Location', d.location)}
        ${row('Project type', d.projectType)}
        ${row('Quantity', d.quantity)}
        ${row('Model', d.model)}
        ${row('Source', getLeadSource(d))}
        ${row('Message', d.remarks)}
      </table>
    </div>
    <div style="padding:14px 26px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:11px;">
      vessel303.com contact form · ${escapeHtml(submittedAt)}
    </div>
  </div>
</body>
</html>`;
}

function confirmationHtml(d: ContactFormData, copy: ContactEmailCopy) {
  const channel = copy.channelLabel && copy.channelHref
    ? `<p style="margin:18px 0 0;"><a href="${escapeHtml(copy.channelHref)}" style="color:#c65f22;font-weight:700;text-decoration:none;">${escapeHtml(copy.channelLabel)}${copy.channelContent ? ` · ${escapeHtml(copy.channelContent)}` : ''}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e5e7eb;">
    <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;text-align:center;">
      <div style="font-weight:800;font-size:20px;letter-spacing:0.18em;color:#241f1b;">VESSEL</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 10px;color:#111827;font-size:16px;">Hi <strong>${escapeHtml(d.name)}</strong>,</p>
      <p style="margin:0 0 14px;color:#4b5563;font-size:14px;line-height:1.7;">${escapeHtml(copy.greeting)}</p>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">${escapeHtml(copy.body)}</p>
      ${channel}
    </div>
    ${copy.footer ? `<div style="padding:14px 28px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:11px;text-align:center;">${escapeHtml(copy.footer)}</div>` : ''}
  </div>
</body>
</html>`;
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
  const source = getLeadSource(data);
  const isBEnd =
    data.inquiryType === 'Project Case Inquiry' ||
    data.inquiryType === 'Product Inquiry' ||
    B_END_SOURCE_PREFIXES.some((prefix) => source.startsWith(prefix));
  const subject = isBEnd
    ? '[B2B lead] New project inquiry - VESSEL'
    : '[Website lead] New inquiry - VESSEL';

  const { from, notifyTo } = getMailConfig();

  let leadCreated = false;
  let leadId: string | null = null;
  try {
    const lead = await createLead({
      email: data.email,
      name: data.name,
      phone: data.phone,
      company: clean(data.company) || null,
      country: clean(data.location) || null,
      inquiry_type: data.inquiryType,
      sku_interest: clean(data.model) || clean(data.projectType) || null,
      message: buildLeadMessage(data),
      source,
    });
    leadCreated = true;
    leadId = lead.id;
  } catch (err) {
    console.error('[contact] lead insert failed:', err);
  }

  let notifyError: unknown = null;
  try {
    const result = await resend.emails.send({
      from,
      to: notifyTo,
      replyTo: data.email,
      subject,
      html: notificationHtml(data, isBEnd),
    });
    notifyError = result.error ?? null;
  } catch (err) {
    notifyError = err;
  }

  if (notifyError) {
    console.error('Resend notification error:', notifyError);
    if (!leadCreated) {
      return Response.json({ error: 'Submission failed' }, { status: 500 });
    }
  }

  if (!notifyError && data.email) {
    const emailCopy = await loadContactEmailCopy();
    if (emailCopy) {
      try {
        const { error: confirmError } = await resend.emails.send({
          from,
          to: data.email,
          subject: emailCopy.subject,
          html: confirmationHtml(data, emailCopy),
        });
        if (confirmError) {
          console.warn('Resend confirmation email error:', confirmError);
        }
      } catch (confirmError) {
        console.warn('Resend confirmation email error:', confirmError);
      }
    }
  }

  return Response.json({ success: true, leadCreated, leadId });
}
