// api/wa-number.js
// Returns the configured WhatsApp number from the WHATSAPP_NUMBER env var.
// forge-wa-submit.js fetches this at runtime; falls back to its data-wa attr
// when the endpoint is unreachable (so the page never breaks).
//
// Set WHATSAPP_NUMBER in Vercel Production to override the placeholder.
// Format: country code + number, no +, no spaces (e.g. "919876543210").

export default function handler(req, res) {
  const allowed = ['https://forge.bruuhh.com', 'http://localhost:4174', 'http://127.0.0.1:4174'];
  const origin = req.headers.origin || '';
  const corsOrigin = allowed.includes(origin) ? origin : 'https://forge.bruuhh.com';
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache
  res.setHeader('Content-Type', 'application/json');

  const number = process.env.WHATSAPP_NUMBER || '';
  return res.status(200).json({
    number: number || null,
    placeholder: '919999999999',
  });
}
