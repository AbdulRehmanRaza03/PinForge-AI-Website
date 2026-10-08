/**
 * PinForge AI — Static Website Chatbot (vanilla JS, zero dependencies)
 *
 * Self-contained widget that injects its own CSS + HTML. Works immediately on
 * the static site with NO build step and NO API key required.
 *
 * Architecture:
 *  - Rule-based response engine using ONLY real site content (products,
 *    features, pricing) so it never invents anything.
 *  - Optional DeepSeek backend: if window.PINFORGE_CHAT_CONFIG.deepseekEnabled
 *    is true and a proxy endpoint is configured, it will use the AI; otherwise
 *    it falls back to the local engine (keeps the widget always usable).
 *
 * Extra features included beyond the base spec:
 *  - Message timestamps
 *  - "Copy reply" button on assistant messages
 *  - "Was this helpful?" thumbs feedback
 *  - Follow-up suggestion chips that change per topic
 *  - Clear / restart conversation button in the header
 *  - Typing delay simulation (feels natural)
 *  - LocalStorage persistence (messages survive page reload)
 */

(function () {
  'use strict';

  /* ───────────────────────── Brand tokens ───────────────────────── */
  const BRAND = {
    primary: '#9333ea',
    primaryDark: '#7c3aed',
    primaryLight: '#a855f7',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #e879f9 100%)',
    bg: '#070712',
    surface: '#0d0d1f',
    elevated: '#161630',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textDim: '#475569',
    border: 'rgba(147,51,234,.18)',
  };

  /* ───────────────────────── Config ─────────────────────────────── */
  // Users may override these before the script runs.
  window.PINFORGE_CHAT_CONFIG = Object.assign(
    {
      // Set deepseekEnabled = true and point `endpoint` at the server proxy
      // (see /api/chat.js) to use live DeepSeek AI. When the proxy is
      // unavailable, the bot automatically falls back to the built-in
      // rule engine, so it always remains usable. Never put a real
      // DeepSeek key here — it would be exposed to visitors.
      deepseekEnabled: true,
      endpoint: '/api/chat',
      botName: 'PinForge Assistant',
      welcomeMessage:
        "Hi! I'm the PinForge AI Assistant. Ask me about automating AliExpress affiliate products on Pinterest 👋",
    },
    window.PINFORGE_CHAT_CONFIG || {}
  );

  /* ───────────────────────── Knowledge base ──────────────────────── */
  // Ground truth pulled strictly from the PinForge AI site.
  const KNOWLEDGE = {
    whatIs:
      "PinForge AI automates AliExpress affiliate product promotion on Pinterest. It connects your AliExpress affiliate account and Pinterest Business account, then auto-finds trending products, generates affiliate links with your tracking ID, writes AI-optimized pins, and posts them on schedule — so you earn USD commissions on autopilot, safely via the official APIs.",
    features: [
      'AliExpress Trending Products (auto-sourcing)',
      'Auto Affiliate Links (tracking + USD commissions)',
      'AI Content Generation (titles, descriptions, hashtags, alt text)',
      'Smart Scheduling (human-like 15–60 min delays, 15 pins/day cap)',
      'Official AliExpress & Pinterest APIs (OAuth, no scraping)',
      'Multiple Pinterest Accounts (isolated queue/analytics per account)',
      'Bulk Product Import (50+ products)',
      'Commission Analytics',
      'AI Assistant (in-app strategy chat)',
      'Approval Queue + Trust System (safe auto-approve)',
    ],
    pricing:
      "We have three plans: Starter (free forever — 1 Pinterest account, 5 pins/day, basic AI, manual approval), Pro ($19/month, or $15/month annual — up to 5 accounts, 15 pins/day, AliExpress auto-sourcing, auto affiliate links, and more), and Agency ($49/month, or $39/month annual — unlimited accounts, team access, white-label, priority support). Would you like a detailed comparison?",
    howToStart:
      "Getting started is easy: 1) connect your AliExpress affiliate account via the official API, 2) connect your Pinterest Business account, 3) let the system find trending products, generate links, and write pins, 4) approve (or let the trust system auto-approve), 5) it posts on schedule and you earn. You can start free on the Starter plan — no credit card needed. Want me to explain any step in detail?",
    safety:
      "PinForge AI only uses the official AliExpress and Pinterest APIs — no scraping, no bots, no stored passwords. It enforces a 15 pins/day cap and human-like 15–60 minute delays server-side, and the approval queue keeps you in control until the trust system earns your confidence. Safe by design.",
    commission:
      "You connect your own AliExpress affiliate account, and your tracking ID is embedded into every generated link. When a Pinterest user clicks and buys, AliExpress pays your commission in USD directly to your account — we never take a cut. Would you like to know the typical setup steps?",
    businessAccount:
      "Yes — you need a Pinterest Business account to use the official API and access features like analytics and pin creation. You can convert a personal account to Business for free in Pinterest's settings.",
    allowed:
      "Yes, affiliate marketing is allowed on Pinterest as long as you disclose links and follow their policies. PinForge AI keeps you compliant by posting through the official API with safe, human-like limits. Want more detail on the safety side?",
  };

  /* ───────────────────────── Response engine ─────────────────────── */
  function localReply(text) {
    const t = text.toLowerCase();

    if (/(what|who|about).*(pinforge|product|is this|do you)/.test(t)) {
      return { text: KNOWLEDGE.whatIs, chips: ['How do I get started?', 'Pricing?', 'Features'] };
    }
    if (/(price|pricing|cost|plan|how much|subscription|free)/.test(t)) {
      return { text: KNOWLEDGE.pricing, chips: ['Features', 'How do I get started?'] };
    }
    if (/(start|get started|begin|setup|how do i|how to).*(start|use|connect|begin)/.test(t) || /start/.test(t)) {
      return { text: KNOWLEDGE.howToStart, chips: ['Features', 'Pricing?'] };
    }
    if (/(feature|what can|capabilit|does it do|function)/.test(t)) {
      return {
        text:
          'Here are the core features:\n• ' +
          KNOWLEDGE.features.join('\n• ') +
          '\n\nWhich one would you like me to explain?',
        chips: ['Auto affiliate links', 'Approval queue', 'AI content'],
      };
    }
    if (/(link|affiliate link|tracking|commission|earn|money|income|usd|revenue)/.test(t)) {
      return { text: KNOWLEDGE.commission, chips: ['Pricing?', 'How do I get started?'] };
    }
    if (/(safe|ban|ban|risk|complian|scrap|api|allowed|legal|account)/.test(t)) {
      return { text: KNOWLEDGE.safety, chips: ['What is PinForge AI?', 'Features'] };
    }
    if (/(business|account|pinterest account|multiple account|connect)/.test(t)) {
      return { text: KNOWLEDGE.businessAccount, chips: ['How do I get started?', 'Pricing?'] };
    }
    if (/(approve|approval|queue|trust)/.test(t)) {
      return {
        text:
          'The approval queue keeps you in control: you start in manual-approve mode, and as the trust system learns which pins you approve, your trust score rises and it gradually moves toward auto-approve. You always control the threshold. Want to know how it speeds up over time?',
        chips: ['Features', 'Safety'],
      };
    }
    if (/(ai content|title|description|hashtag|alt text|write)/.test(t)) {
      return {
        text:
          'AI (Gemini, GPT, or DeepSeek) auto-generates optimized Pinterest titles (~100 chars), descriptions (~500 chars), 5–8 hashtags, and alt text for every product — so your pins rank and convert better. You can edit everything before it posts.',
        chips: ['Features', 'How do I get started?'],
      };
    }
    if (/(hi|hello|hey|salam|assalam)/.test(t)) {
      return {
        text: 'Hello! 👋 How can I help you with PinForge AI today?',
        chips: ['What is PinForge AI?', 'Pricing?', 'Features'],
      };
    }
    if (/(thank|thanks|great|awesome|shukriya)/.test(t)) {
      return {
        text: "You're welcome! 😊 Anything else I can help you with?",
        chips: ['Features', 'Pricing?', 'Safety'],
      };
    }

    // Fallback with a helpful redirect.
    return {
      text:
        "I'm not 100% sure about that specific question. For the most accurate answer, please check our FAQ or contact the team at hello@pinforgeai.site. In the meantime, is there something else I can help with?",
      chips: ['What is PinForge AI?', 'Features', 'Pricing?', 'How do I get started?'],
    };
  }

  /* ───────────────────────── State ───────────────────────────────── */
  const STORAGE_KEY = 'pinforge-chat-messages';
  let messages = [];
  let open = false;
  let loading = false;
  let unread = 0;
  let showLabel = true;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) messages = JSON.parse(raw);
    } catch (_) {}
    if (!messages.length) {
      messages = [{ role: 'assistant', content: cfg.welcomeMessage, ts: Date.now() }];
    }
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch (_) {}
  }

  /* ───────────────────────── DOM build ───────────────────────────── */
  const css = `
.pf-chat, .pf-chat * { box-sizing: border-box; margin:0; padding:0; }
.pf-chat-launcher { position: fixed; bottom:1rem; right:1rem; z-index:9999; display:flex; flex-direction:column; align-items:flex-end; gap:.5rem; font-family:Inter,system-ui,sans-serif; }
.pf-chat-label { background:${BRAND.elevated}; color:${BRAND.textMuted}; border:1px solid ${BRAND.border}; font-size:.75rem; font-weight:500; padding:.4rem .75rem; border-radius:9999px; cursor:pointer; box-shadow:0 8px 20px rgba(0,0,0,.4); animation:pf-bounce 1.5s infinite; }
.pf-chat-btn { position:relative; width:56px; height:56px; border-radius:9999px; background:${BRAND.gradient}; color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(147,51,234,.35); transition:transform .15s ease; }
.pf-chat-btn:hover { transform:scale(1.05); }
.pf-chat-btn svg { width:26px; height:26px; }
.pf-ping { position:absolute; inset:0; border-radius:9999px; background:${BRAND.primary}; opacity:.3; animation:pf-ping 1.6s cubic-bezier(0,0,.2,1) infinite; z-index:-1; }
.pf-online { position:absolute; top:2px; right:2px; width:12px; height:12px; border-radius:50%; background:#a855f7; border:2px solid #fff; }
.pf-badge { position:absolute; top:-2px; left:-2px; min-width:20px; height:20px; padding:0 5px; border-radius:9999px; background:#ef4444; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.pf-window { position:fixed; bottom:1rem; right:1rem; z-index:9999; width:calc(100vw - 2rem); max-width:384px; height:min(520px,calc(100dvh - 6rem)); display:flex; flex-direction:column; background:${BRAND.surface}; border:1px solid ${BRAND.border}; border-radius:1rem; box-shadow:0 24px 60px rgba(0,0,0,.55); overflow:hidden; font-family:Inter,system-ui,sans-serif; }
.pf-header { display:flex; align-items:center; gap:.75rem; padding:.75rem 1rem; color:#fff; background:${BRAND.gradient}; }
.pf-avatar { width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.22); display:flex; align-items:center; justify-content:center; font-weight:800; position:relative; flex-shrink:0; }
.pf-avatar-dot { position:absolute; bottom:0; right:0; width:10px; height:10px; border-radius:50%; background:#a855f7; border:2px solid rgba(255,255,255,.9); }
.pf-header-txt { flex:1; }
.pf-header-txt b { font-size:.875rem; display:block; line-height:1.2; }
.pf-header-txt span { font-size:.72rem; opacity:.85; }
.pf-hbtn { background:rgba(255,255,255,.15); border:none; color:#fff; width:30px; height:30px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.pf-hbtn:hover { background:rgba(255,255,255,.28); }
.pf-hbtn svg { width:16px; height:16px; }
.pf-body { flex:1; overflow-y:auto; padding:.75rem; background:${BRAND.bg}; display:flex; flex-direction:column; gap:.6rem; }
.pf-row { display:flex; gap:.5rem; align-items:flex-end; }
.pf-row.user { justify-content:flex-end; }
.pf-row.assistant { justify-content:flex-start; }
.pf-botmin { width:26px; height:26px; border-radius:50%; background:${BRAND.gradient}; color:#fff; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.pf-bubble { max-width:82%; padding:.55rem .75rem; border-radius:1rem; font-size:.875rem; line-height:1.5; white-space:pre-wrap; word-break:break-word; position:relative; }
.pf-row.user .pf-bubble { background:${BRAND.primary}; color:#fff; border-bottom-right-radius:.25rem; }
.pf-row.assistant .pf-bubble { background:${BRAND.elevated}; color:${BRAND.textMuted}; border-bottom-left-radius:.25rem; }
.pf-ts { display:block; font-size:.62rem; opacity:.55; margin-top:.25rem; }
.pf-chips { display:flex; flex-wrap:wrap; gap:.4rem; padding:.5rem .75rem; border-top:1px solid ${BRAND.border}; background:${BRAND.surface}; }
.pf-chip { border:1px solid ${BRAND.border}; background:transparent; color:${BRAND.textMuted}; font-size:.75rem; padding:.35rem .7rem; border-radius:9999px; cursor:pointer; transition:background .15s; }
.pf-chip:hover { background:${BRAND.elevated}; color:${BRAND.text}; }
.pf-inputbar { display:flex; gap:.5rem; padding:.6rem .75rem; border-top:1px solid ${BRAND.border}; background:${BRAND.surface}; }
.pf-input { flex:1; background:${BRAND.elevated}; border:1px solid ${BRAND.border}; color:${BRAND.text}; font-size:.875rem; padding:.55rem .9rem; border-radius:9999px; outline:none; font-family:inherit; }
.pf-input:focus { border-color:${BRAND.primary}; }
.pf-send { width:40px; height:40px; border-radius:50%; background:${BRAND.primary}; color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.pf-send:disabled { opacity:.4; cursor:default; }
.pf-send svg { width:17px; height:17px; }
.pf-dots { display:flex; gap:4px; align-items:center; padding:.55rem .75rem; background:${BRAND.elevated}; border-radius:1rem; width:fit-content; }
.pf-dots span { width:6px; height:6px; border-radius:50%; background:${BRAND.textDim}; animation:pf-bounce 1s infinite; }
.pf-dots span:nth-child(2){ animation-delay:.15s; } .pf-dots span:nth-child(3){ animation-delay:.3s; }
.pf-actions { display:flex; gap:.4rem; margin-top:.3rem; }
.pf-acts { background:transparent; border:none; color:${BRAND.textDim}; font-size:.68rem; cursor:pointer; padding:0 .1rem; }
.pf-acts:hover { color:${BRAND.primaryLight}; }
@keyframes pf-ping { 75%,100%{ transform:scale(1.9); opacity:0; } }
@keyframes pf-bounce { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-4px); } }
@media (prefers-reduced-motion: reduce){ .pf-ping,.pf-chat-label{ animation:none; } }
`;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function icon(svg) {
    const span = document.createElement('span');
    span.innerHTML = svg;
    return span.firstChild;
  }

  const ICONS = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>',
    thumbUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2a3.13 3.13 0 012.46.54z"/></svg>',
    thumbDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 01-1.92-2.56l2.33-8A2 2 0 016.5 2H20a2 2 0 012 2v8a2 2 0 01-2 2h-2.76a2 2 0 00-1.79 1.11L12 22a3.13 3.13 0 01-2.46-.54z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  };

  /* ───────────────────────── Widget DOM ──────────────────────────── */
  const cfg = window.PINFORGE_CHAT_CONFIG;
  loadState();

  const root = document.createElement('div');
  root.className = 'pf-chat';
  document.body.appendChild(root);

  // Launcher
  const launcher = document.createElement('div');
  launcher.className = 'pf-chat-launcher';
  launcher.innerHTML = `
    <div class="pf-chat-label">Chat with us 👋</div>
    <button class="pf-chat-btn" aria-label="Open chat"></button>
  `;
  const launchBtn = launcher.querySelector('.pf-chat-btn');
  launchBtn.appendChild(icon(ICONS.chat));
  const ping = document.createElement('span');
  ping.className = 'pf-ping';
  launchBtn.appendChild(ping);
  const online = document.createElement('span');
  online.className = 'pf-online';
  launchBtn.appendChild(online);
  const badge = document.createElement('span');
  badge.className = 'pf-badge';
  badge.textContent = '1';
  badge.style.display = 'none';
  launchBtn.appendChild(badge);
  root.appendChild(launcher);

  // Window
  const win = document.createElement('div');
  win.className = 'pf-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'PinForge AI Assistant chat');
  win.style.display = 'none';
  win.innerHTML = `
    <div class="pf-header">
      <div class="pf-avatar">P<span class="pf-avatar-dot"></span></div>
      <div class="pf-header-txt"><b>${cfg.botName}</b><span>Typically replies instantly</span></div>
      <button class="pf-hbtn" data-act="restart" aria-label="Restart conversation">${ICONS.restart}</button>
      <button class="pf-hbtn" data-act="close" aria-label="Close chat">${ICONS.close}</button>
    </div>
    <div class="pf-body"></div>
    <div class="pf-chips"></div>
    <div class="pf-inputbar">
      <input class="pf-input" type="text" placeholder="Type your message…" aria-label="Message" />
      <button class="pf-send" aria-label="Send message">${ICONS.send}</button>
    </div>
  `;
  root.appendChild(win);

  const body = win.querySelector('.pf-body');
  const chipsEl = win.querySelector('.pf-chips');
  const input = win.querySelector('.pf-input');
  const sendBtn = win.querySelector('.pf-send');

  /* ───────────────────────── Render helpers ──────────────────────── */
  function timeStr(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addBubble(m) {
    const row = document.createElement('div');
    row.className = 'pf-row ' + m.role;

    if (m.role === 'assistant') {
      const mini = document.createElement('div');
      mini.className = 'pf-botmin';
      mini.textContent = 'P';
      row.appendChild(mini);
    }

    const wrap = document.createElement('div');
    const bubble = document.createElement('div');
    bubble.className = 'pf-bubble';
    bubble.textContent = m.content;

    const ts = document.createElement('span');
    ts.className = 'pf-ts';
    ts.textContent = timeStr(m.ts);
    bubble.appendChild(ts);
    wrap.appendChild(bubble);

    // Extra features: copy + feedback on assistant messages only.
    if (m.role === 'assistant') {
      const acts = document.createElement('div');
      acts.className = 'pf-actions';
      const copy = document.createElement('button');
      copy.className = 'pf-acts';
      copy.innerHTML = ICONS.copy;
      copy.setAttribute('aria-label', 'Copy reply');
      copy.title = 'Copy';
      copy.addEventListener('click', () => {
        navigator.clipboard?.writeText(m.content).catch(() => {});
        copy.textContent = '✓';
        setTimeout(() => (copy.innerHTML = ICONS.copy), 1200);
      });
      const up = document.createElement('button');
      up.className = 'pf-acts';
      up.innerHTML = ICONS.thumbUp;
      up.title = 'Helpful';
      up.addEventListener('click', () => {
        up.textContent = '👍';
        setTimeout(() => (up.innerHTML = ICONS.thumbUp), 1200);
      });
      const down = document.createElement('button');
      down.className = 'pf-acts';
      down.innerHTML = ICONS.thumbDown;
      down.title = 'Not helpful';
      down.addEventListener('click', () => {
        down.textContent = '👎';
        setTimeout(() => (down.innerHTML = ICONS.thumbDown), 1200);
      });
      acts.append(copy, up, down);
      wrap.appendChild(acts);
    }

    row.appendChild(wrap);
    body.appendChild(row);
  }

  function setChips(chips) {
    chipsEl.innerHTML = '';
    (chips || []).forEach((c) => {
      const b = document.createElement('button');
      b.className = 'pf-chip';
      b.textContent = c;
      b.addEventListener('click', () => {
        input.value = c;
        send(c);
      });
      chipsEl.appendChild(b);
    });
  }

  function scrollBottom() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    body.scrollTo({ top: body.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'pf-row assistant';
    const mini = document.createElement('div');
    mini.className = 'pf-botmin';
    mini.textContent = 'P';
    row.appendChild(mini);
    const dots = document.createElement('div');
    dots.className = 'pf-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    row.appendChild(dots);
    body.appendChild(row);
    scrollBottom();
    return row;
  }

  /* ───────────────────────── Render all ──────────────────────────── */
  function renderAll() {
    body.innerHTML = '';
    messages.forEach(addBubble);
    scrollBottom();
  }

  /* ───────────────────────── Send logic ──────────────────────────── */
  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    messages.push({ role: 'user', content: trimmed, ts: Date.now() });
    addBubble(messages[messages.length - 1]);
    setChips([]);
    input.value = '';
    input.focus();
    persist();
    scrollBottom();

    loading = true;
    sendBtn.disabled = true;

    const typingRow = showTyping();

    let replyText;
    let chips;

    if (cfg.deepseekEnabled && cfg.endpoint) {
      // Optional live AI path (requires a server proxy).
      try {
        const res = await fetch(cfg.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messages.map((m) => ({ role: m.role, content: m.content })) }),
        });
        if (res.ok) {
          const data = await res.json();
          replyText = data.reply;
        } else {
          const r = localReply(trimmed);
          replyText = r.text;
          chips = r.chips;
        }
      } catch (_) {
        const r = localReply(trimmed);
        replyText = r.text;
        chips = r.chips;
      }
    } else {
      // Local rule-based engine (default, works offline).
      const r = localReply(trimmed);
      replyText = r.text;
      chips = r.chips;
    }

    // Simulate a natural typing delay before showing the reply.
    await new Promise((res) => setTimeout(res, 650 + Math.random() * 500));

    typingRow.remove();
    messages.push({ role: 'assistant', content: replyText, ts: Date.now() });
    addBubble(messages[messages.length - 1]);
    setChips(chips);
    persist();
    scrollBottom();

    loading = false;
    sendBtn.disabled = false;
  }

  function onSubmit() {
    send(input.value);
  }

  /* ───────────────────────── Events ──────────────────────────────── */
  function toggle() {
    open = !open;
    win.style.display = open ? 'flex' : 'none';
    launcher.style.display = open ? 'none' : 'flex';
    if (open) {
      unread = 0;
      updateBadge();
      input.focus();
      renderAll();
      // Hide the label bubble once chat is opened.
      launcher.querySelector('.pf-chat-label').style.display = 'none';
    }
  }

  function updateBadge() {
    if (open || unread === 0) {
      badge.style.display = 'none';
    } else {
      badge.style.display = 'flex';
      badge.textContent = unread > 9 ? '9+' : String(unread);
    }
  }

  launchBtn.addEventListener('click', toggle);
  launcher.querySelector('.pf-chat-label').addEventListener('click', toggle);
  win.querySelector('[data-act="close"]').addEventListener('click', toggle);
  win.querySelector('[data-act="restart"]').addEventListener('click', () => {
    messages = [{ role: 'assistant', content: cfg.welcomeMessage, ts: Date.now() }];
    persist();
    renderAll();
    setChips(['What is PinForge AI?', 'How do I get started?', 'Pricing?', 'Features']);
  });

  sendBtn.addEventListener('click', onSubmit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  });

  // Auto-hide the label bubble after 8 seconds.
  setTimeout(() => {
    launcher.querySelector('.pf-chat-label').style.display = 'none';
  }, 8000);

  /* ───────────────────────── Init ────────────────────────────────── */
  updateBadge();
  // Set the initial quick replies for the welcome message.
  setChips(['What is PinForge AI?', 'How do I get started?', 'Pricing?', 'Features']);
  renderAll();
})();
