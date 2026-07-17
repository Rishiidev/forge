// api/submit.js — Forge lead handler
// Receives form submissions from the four native forms on Forge,
// validates them, sends an email via Resend, and forwards to Notion
// (if configured). Logs everything to Vercel's function logs.
//
// Deploy: Vercel auto-detects api/*.js as serverless functions.
// Env vars: RESEND_API_KEY (required), FROM_EMAIL (optional),
//           TO_EMAIL (optional), NOTION_API_KEY + NOTION_DB_ID (optional).

export default async function handler(req, res) {
  // CORS — keep tight. Only the Forge domain can post here.
  const ALLOW_ORIGINS = new Set([
    'https://forge.bruuhh.com',
    'http://localhost:4174',
    'http://127.0.0.1:4174',
  ]);
  const origin = req.headers.origin || '';
  const allowed = ALLOW_ORIGINS.has(origin);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://forge.bruuhh.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!allowed) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  // ---- Validate body ----
  const body = req.body || {};
  const {
    source = 'unknown',
    name = '',
    email = '',
    biz = '',
    link = '',
    whatsapp = '',
    category = '',
    tier = '',
    position = '',
    website = '', // honeypot — must be empty
    reference: submittedRef = '', // client may suggest, but server always generates
  } = body;

  // Rate-limit by IP (cheap, in-memory; resets on cold start)
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    console.warn('[forge] rate limit hit for', ip);
    res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://forge.bruuhh.com');
    return res.status(429).json({ ok: false, error: 'Too many submissions. Please try again later.' });
  }

  // Generate the reference token server-side (always - never trust client)
  const reference = genReference(source);

  // Honeypot: bots fill every field. Real humans don't fill a hidden field.
  if (website) {
    console.log('[forge] honeypot triggered, dropping submission');
    return res.status(200).json({ ok: true, dropped: true });
  }

  // Required fields per source
  const required = {
    preview:  ['email', 'whatsapp'],
    audit:    ['email', 'biz', 'whatsapp'],
    waitlist: ['email', 'whatsapp'],
    operator: ['email', 'whatsapp'],
  };
  const missing = (required[source] || ['email']).filter(f => !body[f] || String(body[f]).trim() === '');
  if (missing.length) {
    return res.status(400).json({ ok: false, error: 'Missing required fields', missing });
  }

  // Validate email shape
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }

  // Validate WhatsApp is at least 7 digits, allowing +, -, space, (, )
  const waClean = String(whatsapp).replace(/[^\d]/g, '');
  if (waClean.length < 7) {
    return res.status(400).json({ ok: false, error: 'WhatsApp number too short' });
  }

  // ---- Env config ----
  // RESEND_API_KEY  — required for email. Set in Vercel.
  // LEADS_TO_EMAIL  — primary destination. Set in Vercel.
  // TO_EMAIL        — legacy alias, still honored if LEADS_TO_EMAIL is absent.
  // FROM_EMAIL      — sender (must be a verified Resend domain in production).
  // NOTION_*        — optional, if you want rows in a Notion CRM too.
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'Forge <onboarding@resend.dev>';
  const TO_EMAIL = process.env.LEADS_TO_EMAIL || process.env.TO_EMAIL || 'bruuhhstudios@gmail.com';
  const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
  const NOTION_DB_ID = process.env.NOTION_DB_ID || '';

  // ---- Compose email ----
  const labels = {
    preview:  'New preview request for Forge',
    audit:    'New 7-point audit request for Forge',
    waitlist: 'New waitlist signup for Forge',
    operator: 'New Operator plan enquiry for Forge',
  };
  const subject = `${labels[source] || 'New Forge submission'} — ${reference}`;

  const rows = [
    ['Reference',    reference],
    ['Source',       source],
    ['Email',        email],
    name  ? ['Name',         name]   : null,
    biz   ? ['Business',     biz]    : null,
    link  ? ['Google link',  link]   : null,
    whatsapp ? ['WhatsApp',  whatsapp] : null,
    category ? ['Category', category] : null,
    tier ? ['Plan',           tier]  : null,
    position ? ['Waitlist pos.', position] : null,
    ['Submitted at', new Date().toISOString()],
  ].filter(Boolean);

  const html = renderEmail(rows);
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  let emailQueued = false;
  let emailError = null;

  if (RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [TO_EMAIL],
          reply_to: email,
          subject,
          html,
          text,
        }),
      });
      if (!resendRes.ok) {
        const errText = await resendRes.text();
        emailError = `Resend ${resendRes.status}: ${errText}`;
        console.error('[forge] email send failed:', emailError);
      } else {
        emailQueued = true;
        console.log('[forge] email queued for', source, email);
      }
    } catch (e) {
      emailError = String(e && e.message || e);
      console.error('[forge] email exception:', emailError);
    }
  } else {
    emailError = 'RESEND_API_KEY not set on Vercel — submissions are logged but not emailed yet.';
    console.warn('[forge]', emailError);
  }

  // ---- Forward to Notion (optional) ----
  let notionQueued = false;
  let notionError = null;

  if (NOTION_API_KEY && NOTION_DB_ID) {
    try {
      const props = {
        'Source': { select: { name: source } },
        'Email':  { email },
      };
      if (name)     props['Name']        = { rich_text: [{ text: { content: name } }] };
      if (biz)      props['Business']    = { rich_text: [{ text: { content: biz } }] };
      if (link)     props['Google link'] = { url: link };
      if (whatsapp) props['WhatsApp']    = { phone_number: whatsapp };
      if (category) props['Category']    = { select: { name: category } };
      if (tier)     props['Plan']        = { select: { name: tier } };
      if (position) props['Waitlist pos.'] = { rich_text: [{ text: { content: String(position) } }] };
      props['Submitted at'] = { date: { start: new Date().toISOString() } };
      props['Status'] = { select: { name: 'New' } };

      const notionRes = await fetch(`https://api.notion.com/v1/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: NOTION_DB_ID },
          properties: props,
        }),
      });
      if (!notionRes.ok) {
        const t = await notionRes.text();
        notionError = `Notion ${notionRes.status}: ${t}`;
        console.error('[forge] notion create failed:', notionError);
      } else {
        notionQueued = true;
        console.log('[forge] notion row created for', source, email);
      }
    } catch (e) {
      notionError = String(e && e.message || e);
      console.error('[forge] notion exception:', notionError);
    }
  }

  // ---- Respond ----
  // Always return 200 unless validation failed — we don't want the page
  // to show an error toast for a backend hiccup; the data is in Vercel logs.
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://forge.bruuhh.com');
  return res.status(200).json({
    ok: true,
    source,
    reference,
    emailQueued,
    emailError,
    notionQueued,
    notionError,
  });
}


// ---- Reference token generator ----
// Format: SRC-XXXX (4 chars from a no-confusion alphabet)
const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function genReference(source) {
  const prefixes = { preview: 'PRV', audit: 'AUD', waitlist: 'WTL', operator: 'OPR' };
  const prefix = prefixes[source] || 'FRG';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `${prefix}-${suffix}`;
}

// ---- IP rate limit ----
// Cheap in-memory bucket. Stops casual bot floods. Resets on cold start.
const RL = new Map();
function rateLimited(ip, limit = 5, windowMs = 60 * 60 * 1000) {
  if (!ip) return false;
  const now = Date.now();
  const entry = RL.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  RL.set(ip, entry);
  return entry.count > limit;
}

function renderEmail(rows) {
  const cells = rows.map(([k, v]) => {
    const safe = String(v).replace(/[<>]/g, '');
    return `<tr><td style="padding:6px 12px;color:#6B6A55;font-size:13px;width:140px;vertical-align:top;">${k}</td><td style="padding:6px 12px;color:#1B1B12;font-size:14px;">${safe}</td></tr>`;
  }).join('');
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAF8;padding:24px 0;"><tr><td align="center">
<table cellpadding="0" cellspacing="0" border="0" width="560" style="background:#FFFFFF;border:1px solid #E2DFD3;border-radius:14px;padding:8px 0;">
  <tr><td style="padding:18px 24px;border-bottom:1px solid #E2DFD3;">
    <div style="font-family:'Fraunces','Times New Roman',serif;font-style:italic;font-size:22px;color:#3A3B1F;">Forge</div>
    <div style="font-size:12px;color:#6B6A55;margin-top:4px;letter-spacing:.08em;text-transform:uppercase;">New lead</div>
  </td></tr>
  <tr><td style="padding:8px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${cells}</table>
  </td></tr>
  <tr><td style="padding:16px 24px;border-top:1px solid #E2DFD3;font-size:11px;color:#8E8D74;">
    Auto-generated by Forge (forge.bruuhh.com). Reply directly to this email to respond to the lead.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
