<div align="center">

# PinForge AI — Official Website

**Pinterest automation, built on the official API. No scraping, no bots, no risk.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-95%2B-00C853?style=flat-square&logo=lighthouse&logoColor=white)](https://developer.chrome.com/docs/lighthouse)
[![No Build Step](https://img.shields.io/badge/Build%20Step-None-success?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Maintained](https://img.shields.io/badge/Maintained-Yes-brightgreen?style=flat-square)](#)
[![Status](https://img.shields.io/badge/Status-Early%20Access-9333ea?style=flat-square)](#)

[Live Site](https://pinforgeai.site) · [Report a Bug](mailto:abdulrehmanraza60@gmail.com) · [Request a Feature](mailto:abdulrehmanraza60@gmail.com)

</div>

---

## Overview

This repository contains the complete, production-ready marketing website for **PinForge AI** — an AI-powered Pinterest automation platform built exclusively on Pinterest's official API v5. Zero frameworks, zero build tools, zero dependencies. Just fast, semantic, accessible static HTML that deploys anywhere in minutes.

**Founder:** Abdul Rehman

---

## Table of Contents

- [Pages](#pages)
- [Design System](#design-system)
- [Interactive Features](#interactive-features)
- [Forms — Email Delivery](#forms--email-delivery)
- [Deploy in 5 Minutes](#deploy-in-5-minutes)
- [Pre-Launch Checklist](#pre-launch-checklist)
- [SEO](#seo-features-included)
- [Performance](#performance-targets)
- [Browser Support](#browser-support)
- [Accessibility](#accessibility)
- [Project Structure](#project-structure)
- [License](#license)

---

## Pages

| Page | Description |
|---|---|
| `index.html` | Homepage — hero, trust badges, how it works, use cases, pricing teaser, newsletter, CTA |
| `features.html` | Full feature breakdown — AI engine, scheduling, bulk upload, analytics, competitor comparison table |
| `pricing.html` | Starter / Pro / Agency plans, monthly-annual toggle, **interactive plan calculator** |
| `about.html` | Founder story, mission, values, honest trust badges (no fabricated stats) |
| `blog.html` | Blog index — Pinterest strategy, API compliance, and content guides |
| `blog-*.html` | 3 published articles (API compliance, AI pin descriptions, posting cadence) |
| `faq.html` | 30+ searchable questions with category filter and FAQPage structured data |
| `contact.html` | Contact form, response times, support channels |
| `waitlist.html` | Early access signup — name + email, live email delivery |
| `coming-soon.html` | Dashboard placeholder shown until the app is public |
| `thanks.html` | Dynamic thank-you page for all three forms |
| `privacy-policy.html` | GDPR-aware privacy policy |
| `terms-of-service.html` | Terms covering AI content, Pinterest API compliance, liability |
| `404.html` | Custom error page |
| `style.css` | Full design system — tokens, dark/light mode, all components |
| `script.js` | Theme toggle, nav, FAQ accordion, scroll reveals, pricing toggle, forms, exit-intent popup |

---

## Design System

### Colors
```css
--bg:         #070712   /* Deep space background */
--primary:    #9333ea   /* Violet */
--fuchsia:    #e879f9   /* Fuchsia accent */
--gold:       #f59e0b   /* Gold CTA */
--cyan:       #06b6d4   /* Data / analytics */
--green:      #10b981   /* Success */
```

### Typography
- **Font:** Inter, weights 300–900, loaded via Google Fonts with `display=swap`

### Dark / Light Mode
Controlled by `data-theme="dark|light"` on `<html>`. Preference persisted to `localStorage`. Toggle any element with `data-theme-toggle`.

---

## Interactive Features

- 🧮 **Pricing calculator** — slider-based plan recommendation on `pricing.html`
- 👋 **Exit-intent popup** — waitlist prompt on mouse-leave, once per session, skips funnel pages
- 🌗 **Dark / light theme toggle** — instant, persisted across visits
- ✨ **Scroll-reveal animations** — IntersectionObserver-driven, no library
- 🔍 **FAQ search + filter** — instant client-side matching
- 📊 **Feature comparison table** — PinForge AI vs. named competitors

---

## Forms — Email Delivery

All three forms (`contact.html`, `waitlist.html`, newsletter block on `index.html`) submit via **native HTML POST** to [FormSubmit.co](https://formsubmit.co) — no signup, no backend, no CORS issues (works from `file://` too).

**Destination:** `abdulrehmanraza60@gmail.com`

**One-time setup:** submit any form once after going live. FormSubmit sends a confirmation email to that address — click it once, and every future submission delivers straight to the inbox.

Anti-spam: honeypot field (`_honey`) + captcha disabled for a frictionless AJAX-free flow. Each form redirects to `thanks.html?type=contact|waitlist|newsletter` with a tailored confirmation message.

---

## Deploy in 5 Minutes

### Option 1 — GitHub Pages (current target)
```bash
git init
git add .
git commit -m "feat: PinForge AI website"
git remote add origin https://github.com/yourusername/pinforge-website.git
git push -u origin main
```
Repo → **Settings → Pages → Source: `main` → `/ (root)`**. All paths are relative — no config needed.

### Option 2 — Vercel
```bash
npm i -g vercel
vercel --prod
```

### Option 3 — Netlify
Drag the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

### Option 4 — Any static host / CDN
Upload all files as-is. No server-side processing required.

---

## Pre-Launch Checklist

- [x] Domain consistent across canonical, OG, sitemap, robots — `pinforgeai.site`
- [x] Real OG image (`og-image.png`, 1200×630) for social share previews
- [x] PWA manifest + icons (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`)
- [x] Contact, waitlist, and newsletter forms deliver real email
- [x] No dead `href="#"` links anywhere in the site
- [x] No fabricated stats, testimonials, or tech-stack exposure
- [ ] Click the FormSubmit confirmation email after first live submission
- [ ] Swap `coming-soon.html` for the real dashboard once the app ships
- [ ] Connect real social accounts (currently disabled with "Coming soon")
- [ ] Update `sitemap.xml` `<lastmod>` dates as content changes

---

## SEO Features Included

- Semantic HTML5 landmarks (`<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- `<title>`, meta description, canonical URL on every page
- Open Graph + Twitter Card tags on every page
- JSON-LD structured data — `SoftwareApplication`, `FAQPage`, `BlogPosting`
- `robots.txt` with sitemap reference
- `sitemap.xml` covering every public page, including the blog
- 3 SEO-driven blog articles targeting Pinterest automation search intent

---

## Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | 95+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 95+ |
| Lighthouse SEO | 100 |
| External JS dependencies | None |
| CSS frameworks | None |
| Font loading | `display=swap`, Google Fonts CDN |

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 88+ | ✅ Full |
| Firefox 87+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 88+ | ✅ Full |
| Mobile Safari | ✅ Full |
| Chrome Android | ✅ Full |

---

## Accessibility

- WCAG 2.1 AA-oriented design
- Full keyboard navigation on every interactive element
- ARIA labels on buttons, forms, and navigation landmarks
- Skip-to-content link on every page
- Visible focus indicators
- Color contrast ratio 4.5:1+ on body text

---

## Project Structure

```
pinforge-website/
├── index.html
├── features.html
├── pricing.html
├── about.html
├── blog.html
├── blog-pinterest-api-compliance.html
├── blog-ai-pin-descriptions.html
├── blog-posting-schedule.html
├── faq.html
├── contact.html
├── waitlist.html
├── coming-soon.html
├── thanks.html
├── privacy-policy.html
├── terms-of-service.html
├── 404.html
├── style.css
├── script.js
├── manifest.json
├── favicon.svg
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
├── og-image.png
├── robots.txt
├── sitemap.xml
└── README.md
```

---

## License

MIT © 2026 PinForge AI — Founder: Abdul Rehman
