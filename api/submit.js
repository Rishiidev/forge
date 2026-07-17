// api/submit.js — Forge lead handler (three-leg delivery)
//
// Receives form submissions from the four native forms on Forge,
// validates them, and dispatches the lead to three independent legs:
//
//   1. Resend   → email notification (free tier: 100/day)
//   2. Supabase → durable Postgres store (free tier: 500MB DB)
//   3. GitHub   → append-only backup in Rishiidev/forge-leads (private)
//
// Permissive contract: top-level `ok` is true if at least Supabase
// (the durable store) succeeds. Resend and GitHub failures are recorded
// on the response and logged, but they don't fail the user request —
// the user's lead has already been captured.
//
// All three legs fire in parallel via Promise.allSettled so a slow or
// failing leg doesn't block the response.
//
// Env vars (all set in Vercel Production):
//   RESEND_API_KEY            — Resend auth
//   LEADS_TO_EMAIL            — primary destination (defaults to bruuhhstudios@gmail.com)
//   FROM_EMAIL                — sender (default: Resend sandbox; verified domain in prod)
//   SUPABASE_URL              — Supabase project URL (https://xyz.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (NOT anon — needs RLS bypass)
//   GITHUB_TOKEN              — fine-grained PAT scoped to Rishiidev/forge-leads
//                               Contents: Read & write. NO other scopes.
//   GITHUB_LEADS_REPO         — defaults to "Rishiidev/forge-leads"
//
// The handler is intentionally tolerant: missing env vars cause that
// leg to be skipped, never to throw. Every decision is logged.

export default async function handler(req, res) {
  // ---- CORS: forge.bruuhh.com only ----
  const ALLOW_ORIGINS = new Set([
    'https://forge.bruuhh.com',
    'http://localhost:4174',
    'http://127.0.0.1:4174',
  ]);
  const origin = req.headers.origin || '';
  const allowed = ALLOW_ORIGINS.has(origin);
  const corsOrigin = allowed ? origin : 'https://forge.bruuhh.com';

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!allowed) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
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
    website = '', // honeypot
    reference: submittedRef = '',
  } = body;

  // Rate-limit by IP (in-memory; resets on cold start)
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
             || req.socket?.remoteAddress
             || 'unknown';
  if (rateLimited(ip)) {
    console.warn('[forge] rate limit hit for', ip);
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    return res.status(429).json({ ok: false, error: 'Too many submissions' });
  }

  // Honeypot: bots fill every field. Real humans don't.
  if (website) {
    console.log('[forge] honeypot triggered, dropping submission');
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    return res.status(200).json({ ok: true, dropped: true });
  }

  // Required fields per source
  const required = {
    preview:  ['email', 'whatsapp'],
    audit:    ['email', 'biz', 'whatsapp'],
    waitlist: ['email', 'whatsapp'],
    operator: ['email', 'whatsapp'],
  };
  const missing = (required[source] || ['email'])
    .filter(f => !body[f] || String(body[f]).trim() === '');
  if (missing.length) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    return res.status(400).json({ ok: false, error: 'Missing required fields', missing });
  }

  // Email shape
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }
  // WhatsApp shape
  const waClean = String(whatsapp).replace(/[^\d]/g, '');
  if (waClean.length < 7) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    return res.status(400).json({ ok: false, error: 'WhatsApp number too short' });
  }

  // Generate server-side reference (never trust client)
  const reference = genReference(source);

  // ---- Env config ----
  const RESEND_API_KEY     = process.env.RESEND_API_KEY     || '';
  const FROM_EMAIL         = process.env.FROM_EMAIL         || 'Forge <onboarding@resend.dev>';
  const TO_EMAIL           = process.env.LEADS_TO_EMAIL     || process.env.TO_EMAIL || 'bruuhhstudios@gmail.com';
  const SUPABASE_URL       = process.env.SUPABASE_URL       || '';
  const SUPABASE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const GITHUB_TOKEN       = process.env.GITHUB_TOKEN       || '';
  const GITHUB_LEADS_REPO  = process.env.GITHUB_LEADS_REPO  || 'Rishiidev/forge-leads';

  // ---- Compose email body ----
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

  // ---- Priority score (operator > audit > preview > waitlist by design) ----
  const PRIORITY = { operator: 3, audit: 2, preview: 2, waitlist: 1 };
  const priority_score = PRIORITY[source] || 1;

  // ---- Common lead payload (used by all three legs) ----
  const lead = {
    reference,
    source,
    name, email, biz, link, whatsapp, category, tier,
    waitlist_position: position ? Number(position) : null,
    message: body.message || '',
    priority_score,
    ip,
    user_agent: (req.headers['user-agent'] || '').slice(0, 500),
    created_at: new Date().toISOString(),
  };

  // ---- Fire all three legs in parallel ----
  // Order matters only for logging. Promise.allSettled guarantees
  // we always get back three results regardless of failures.
  const [emailResult, dbResult, githubResult] = await Promise.allSettled([
    dispatchResend({ RESEND_API_KEY, FROM_EMAIL, TO_EMAIL, subject, html, text, replyTo: email }),
    dispatchSupabase({ SUPABASE_URL, SUPABASE_KEY, lead }),
    dispatchGithub({ GITHUB_TOKEN, GITHUB_LEADS_REPO, lead }),
  ]);

  // ---- Normalize results ----
  const email  = legResult(emailResult,  RESEND_API_KEY  ? 'skipped' : 'skipped');
  const db     = legResult(dbResult,     !SUPABASE_URL || !SUPABASE_KEY ? 'skipped:env' : null);
  const github = legResult(githubResult, !GITHUB_TOKEN ? 'skipped:env' : null);

  // Top-level ok is "the durable store (Supabase) succeeded OR was
  // attempted and we're skipping because env not set". The user's
  // lead is in either GitHub (if Supabase env missing) or Supabase
  // (preferred). If both legs skipped, we surface that.
  const topLevelOk =
    (db.ok || github.ok) &&
    !(db.ok === false && github.ok === false && email.ok === false);

  console.log('[forge] submit complete', {
    reference, source,
    email: email.ok, db: db.ok, github: github.ok,
    dbError: db.error, githubError: github.error, emailError: email.error,
  });

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  return res.status(200).json({
    ok: topLevelOk,
    source,
    reference,
    email,
    db,
    github,
  });
}

// =====================================================================
// LEG 1 — Resend (email)
// =====================================================================
async function dispatchResend({ RESEND_API_KEY, FROM_EMAIL, TO_EMAIL, subject, html, text, replyTo }) {
  if (!RESEND_API_KEY) {
    return { ok: false, status: 'skipped', error: 'RESEND_API_KEY not set' };
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to:   [TO_EMAIL],
        reply_to: replyTo,
        subject, html, text,
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      return { ok: false, status: `failed:${r.status}`, error: errText.slice(0, 200) };
    }
    const body = await r.json().catch(() => ({}));
    return { ok: true, id: body.id || null };
  } catch (e) {
    return { ok: false, status: 'exception', error: String(e?.message || e).slice(0, 200) };
  }
}

// =====================================================================
// LEG 2 — Supabase (Postgres via REST)
// =====================================================================
async function dispatchSupabase({ SUPABASE_URL, SUPABASE_KEY, lead }) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: false, status: 'skipped', error: 'env not set' };
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
      },
      body: JSON.stringify([{
        source,
        name:        name_or_null(lead.name),
        email:       lead.email,
        biz:         name_or_null(lead.biz),
        link:        name_or_null(lead.link),
        whatsapp:    lead.whatsapp,
        category:    name_or_null(lead.category),
        tier:        name_or_null(lead.tier),
        waitlist_position: lead.waitlist_position,
        message:     name_or_null(lead.message),
        reference:   lead.reference,
        ip:          lead.ip,
        user_agent:  lead.user_agent,
        priority_score: lead.priority_score,
        resend_status: null,        // reserved; Resend success is logged but not patched here
        supabase_status: 'pending',
        github_status: null,
        created_at:  lead.created_at,
      }]),
    });
    if (!r.ok) {
      const errText = await r.text();
      return { ok: false, status: `failed:${r.status}`, error: errText.slice(0, 200) };
    }
    const arr = await r.json().catch(() => []);
    const id = Array.isArray(arr) && arr[0]?.id ? arr[0].id : null;
    return { ok: true, id };
  } catch (e) {
    return { ok: false, status: 'exception', error: String(e?.message || e).slice(0, 200) };
  }
}

// Local helpers (kept inline; no module deps)
function name_or_null(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

// =====================================================================
// LEG 3 — GitHub (private backup, one file per lead)
// =====================================================================
async function dispatchGithub({ GITHUB_TOKEN, GITHUB_LEADS_REPO, lead }) {
  if (!GITHUB_TOKEN) {
    return { ok: false, status: 'skipped', error: 'env not set' };
  }
  const date = lead.created_at.slice(0, 10); // YYYY-MM-DD
  const path = `leads/${date}/${lead.reference}.json`;
  const api  = `https://api.github.com/repos/${GITHUB_LEADS_REPO}/contents/${path}`;

  const contentB64 = Buffer.from(JSON.stringify(lead, null, 2), 'utf8').toString('base64');
  const commitMessage = `forge: ${lead.source} lead ${lead.reference}`;

  try {
    const r = await fetch(api, {
      method: 'PUT',
      headers: {
        'Authorization':        `Bearer ${GITHUB_TOKEN}`,
        'Accept':              'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type':        'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: contentB64,
        branch:  'main',
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      // 422 with "already exists" — fine, lead is in the backup
      if (r.status === 422 && errText.includes('already_exists')) {
        return { ok: true, status: 'duplicate', path };
      }
      return { ok: false, status: `failed:${r.status}`, error: errText.slice(0, 200) };
    }
    const body = await r.json().catch(() => ({}));
    return {
      ok: true,
      status: 'committed',
      path,
      sha: body?.content?.sha || null,
      url: body?.content?.html_url || null,
    };
  } catch (e) {
    return { ok: false, status: 'exception', error: String(e?.message || e).slice(0, 200) };
  }
}

// =====================================================================
// Helpers
// =====================================================================
function legResult(settled, skipReason) {
  if (settled.status === 'fulfilled') return settled.value;
  // rejected (exception in the dispatch fn itself, not the underlying API)
  return {
    ok: false,
    status: 'exception',
    error: String(settled.reason?.message || settled.reason || 'unknown').slice(0, 200),
  };
}

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
