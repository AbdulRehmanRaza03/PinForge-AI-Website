/**
 * /api/chat — Serverless proxy for the DeepSeek AI chatbot.
 *
 * Keeps the DEEPSEEK_API_KEY on the server so it is NEVER exposed to visitors.
 *
 * This is written as a CommonJS function (module.exports) so it runs on both
 * Vercel and Netlify Node.js functions WITHOUT needing "type": "module" in
 * package.json. On Vercel, any file under /api automatically becomes a
 * serverless function that receives (req, res).
 *
 * Environment variable required: DEEPSEEK_API_KEY
 */

// Ground-truth system prompt (mirrors the site's real content only).
const SYSTEM_PROMPT = [
  'You are the "PinForge AI Assistant", the on-site chatbot for PinForge AI.',
  '',
  'PinForge AI automates AliExpress affiliate product promotion on Pinterest — "Turn AliExpress products into passive USD income on Pinterest."',
  '',
  'WHAT IT DOES (only these — never invent more):',
  '1. Connect your AliExpress affiliate account via the official API (your tracking ID).',
  '2. Connect Pinterest Business account(s) via OAuth.',
  '3. Auto-fetch trending products (official API, no scraping).',
  '4. Auto-download product images.',
  '5. Auto-generate affiliate links with your tracking ID embedded.',
  '6. AI (Gemini/GPT/DeepSeek) writes optimized titles, descriptions, hashtags, alt text.',
  '7. Auto-post with human-like 15-60 min delays, cap 15 pins/day.',
  '8. Scheduled automation, approval queue + trust system, in-app AI assistant.',
  '',
  'FEATURES: AliExpress trending products, auto affiliate links, AI content, smart scheduling, official APIs, multi-account, bulk import, commission analytics, AI assistant, approval queue.',
  '',
  'PRICING: Starter free ($0, 1 account, 5 pins/day). Pro $19/mo ($15 annual, 5 accounts, 15 pins/day, auto-sourcing, affiliate links). Agency $49/mo ($39 annual, unlimited).',
  '',
  'TONE: warm, concise, professional, honest. No hype. Be truthful that results vary.',
  'RULES: Never invent features/prices/numbers. If unsure, say so and point to FAQ/contact. End with a soft next-step question. Ask for email on buying intent or pricing/support. Never ask for passwords/keys.',
].join('\n');

module.exports = async function handler(req, res) {
  // CORS is not strictly needed for same-origin, but harmless to allow.
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  const messages = body && body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'A non-empty "messages" array is required.' });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured.' });
    return;
  }

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      res.status(502).json({ error: 'Invalid response from DeepSeek.', detail: raw.slice(0, 300) });
      return;
    }

    if (!upstream.ok) {
      res.status(upstream.status === 401 ? 401 : 502).json({
        error: 'DeepSeek error (' + upstream.status + ')',
        detail: (data && data.error && data.error.message) || raw.slice(0, 300),
      });
      return;
    }

    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : 'Sorry, I could not generate a response. Please try again.';

    res.status(200).json({ reply });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach the AI service. ' + (err && err.message ? err.message : '') });
  }
};
