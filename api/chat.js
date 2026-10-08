/**
 * /api/chat — Serverless proxy for the DeepSeek AI chatbot.
 *
 * This keeps the DEEPSEEK_API_KEY on the server so it is NEVER exposed to
 * visitors. The static site's chatbot.js posts to this endpoint; this proxy
 * forwards to DeepSeek with the server-side key.
 *
 * Deployable as-is on Vercel or Netlify (functions). On Vercel, any file under
 * /api automatically becomes a serverless function.
 *
 * Environment variable required: DEEPSEEK_API_KEY
 *
 * Usage (from the browser):
 *   fetch('/api/chat', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ messages: [{ role: 'user', content: 'Pricing?' }] })
 *   })
 */

// Ground-truth system prompt (mirrors src/lib/chat-prompt.ts).
const SYSTEM_PROMPT = `You are the "PinForge AI Assistant", the on-site chatbot for PinForge AI.

PinForge AI automates AliExpress affiliate product promotion on Pinterest — "Turn AliExpress products into passive USD income on Pinterest."

WHAT IT DOES (only these — never invent):
1. Connect AliExpress affiliate account (official API, your tracking ID).
2. Connect Pinterest Business account(s) via OAuth.
3. Auto-fetch trending products (official API, no scraping).
4. Auto-download product images.
5. Auto-generate affiliate links with your tracking ID.
6. AI (Gemini/GPT/DeepSeek) writes optimized titles, descriptions, hashtags, alt text.
7. Auto-post with human-like 15-60 min delays, cap 15 pins/day.
8. Scheduled automation, approval queue + trust system, in-app AI assistant.

FEATURES: AliExpress trending products, auto affiliate links, AI content, smart scheduling, official APIs, multi-account, bulk import, commission analytics, AI assistant, approval queue.

PRICING: Starter free ($0, 1 account, 5 pins/day). Pro $19/mo ($15 annual, 5 accounts, 15 pins/day, auto-sourcing, affiliate links). Agency $49/mo ($39 annual, unlimited).

TONE: warm, concise, professional, honest. No hype. Be truthful that results vary.
RULES: Never invent features/prices/numbers. If unsure, say so and point to FAQ/contact. End with a soft next-step question. Ask for email on buying intent or pricing/support. Never ask for passwords/keys.`;

export default async function handler(req) {
  // Only allow POST.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'DEEPSEEK_API_KEY not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(
        JSON.stringify({ error: `DeepSeek error (${upstream.status})`, detail: text.slice(0, 300) }),
        { status: upstream.status === 401 ? 401 : 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, try again.';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to reach the AI service.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// Next.js App Router compatibility (export both).
export const POST = handler;
