/* ============================================================
   PinForge AI — Main JavaScript
   Vanilla JS only. No dependencies.
   ============================================================ */

'use strict';

/* ── Theme ──────────────────────────────────────────────── */
const THEME_KEY = 'pinforge-theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefer = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const theme = saved || prefer;
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcons(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcons(next);
}

function updateThemeIcons(theme) {
  document.querySelectorAll('[data-theme-icon]').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
    el.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

/* ── Mobile nav ─────────────────────────────────────────── */
function initNav() {
  const toggleBtn = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', open);
    toggleBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
      menu.classList.remove('open');
    }
  });

  // Highlight active page
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile-menu a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Nav shadow on scroll
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.borderBottomColor = window.scrollY > 20
        ? 'rgba(147,51,234,.25)' : 'rgba(255,255,255,.06)';
    }, { passive: true });
  }
}

/* ── Scroll reveal animations ───────────────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-scale');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || 0;
        setTimeout(() => el.classList.add('visible'), Number(delay));
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

/* ── Counter animations ─────────────────────────────────── */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target || el.textContent);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(ease * target);
    el.textContent = prefix + value.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ── FAQ accordion ──────────────────────────────────────── */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      items.forEach(i => {
        i.classList.remove('open');
        const q = i.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      // Open clicked (if was closed)
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    btn.setAttribute('aria-expanded', 'false');
    const answer = item.querySelector('.faq-answer');
    if (answer) {
      const id = 'faq-' + Math.random().toString(36).slice(2, 7);
      answer.id = id;
      btn.setAttribute('aria-controls', id);
    }
  });

  // Category filter
  const catBtns = document.querySelectorAll('.faq-cat-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      items.forEach(item => {
        if (cat === 'all' || item.dataset.cat === cat) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Search
  const searchInput = document.getElementById('faqSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = !q || text.includes(q) ? '' : 'none';
      });
    });
  }
}

/* ── Pricing toggle ─────────────────────────────────────── */
function initPricingToggle() {
  const track = document.getElementById('billingToggle');
  if (!track) return;

  const monthlyEls = document.querySelectorAll('[data-price-monthly]');
  const annualEls  = document.querySelectorAll('[data-price-annual]');
  const labelAnnual = document.getElementById('labelAnnual');
  const labelMonthly = document.getElementById('labelMonthly');
  let isAnnual = false;

  track.addEventListener('click', () => {
    isAnnual = !isAnnual;
    track.classList.toggle('annual', isAnnual);

    monthlyEls.forEach(el => {
      el.textContent = isAnnual ? el.dataset.priceAnnual : el.dataset.priceMonthly;
    });

    if (labelAnnual)  labelAnnual.classList.toggle('active', isAnnual);
    if (labelMonthly) labelMonthly.classList.toggle('active', !isAnnual);
  });
}

/* ── Contact form ───────────────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  // Native form submission to FormSubmit.co — no fetch/AJAX (avoids CORS
  // issues when testing locally via file://). Browser handles the POST
  // and redirects to _next (thanks.html) on success.
  form.addEventListener('submit', () => {
    const btn = form.querySelector('[type="submit"]');
    if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
  });
}

/* ── Newsletter form ────────────────────────────────────── */
function initNewsletterForm() {
  const forms = document.querySelectorAll('.newsletter-form');
  forms.forEach(form => {
    // Native form submission to FormSubmit.co — reliable everywhere,
    // no CORS issues. Redirects to thanks.html via _next on success.
    form.addEventListener('submit', () => {
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.textContent = '…'; btn.disabled = true; }
    });
  });
}

/* ── Smooth scroll for anchor links ─────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ── Copy to clipboard ──────────────────────────────────── */
function initCopyBtns() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });
}

/* ── Keyboard nav for FAQ ────────────────────────────────── */
function initKeyboardNav() {
  const faqList = document.querySelector('.faq-list');
  if (!faqList) return;
  faqList.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.faq-item.open').forEach(item => {
        item.classList.remove('open');
        const btn = item.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/* ── Exit-intent waitlist popup ─────────────────────────── */
function initExitIntent() {
  var skipPages = ['waitlist.html', 'coming-soon.html', 'thanks.html'];
  var path = window.location.pathname.split('/').pop() || 'index.html';
  if (skipPages.indexOf(path) !== -1) return;
  if (sessionStorage.getItem('pf_exit_shown')) return;

  var triggered = false;
  function show() {
    if (triggered) return;
    triggered = true;
    sessionStorage.setItem('pf_exit_shown', '1');

    var overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'exitIntentTitle');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:fadeIn .25s ease';

    var box = document.createElement('div');
    box.className = 'card card-glass';
    box.style.cssText = 'max-width:420px;width:100%;text-align:center;padding:2.25rem 2rem;position:relative;animation:scaleIn .3s ease';
    box.innerHTML =
      '<button aria-label="Close" id="exitIntentClose" style="position:absolute;top:.75rem;right:.75rem;background:none;border:none;color:var(--text-dim);font-size:1.25rem;cursor:pointer;line-height:1;padding:.25rem">✕</button>' +
      '<div style="font-size:2rem;margin-bottom:.75rem" aria-hidden="true">👋</div>' +
      '<h3 id="exitIntentTitle" style="font-size:1.25rem;margin-bottom:.5rem">Before you go —</h3>' +
      '<p style="color:var(--text-muted);font-size:.9375rem;margin-bottom:1.5rem;line-height:1.6">Join early access and we\'ll email you the moment PinForge AI opens up. Takes 10 seconds.</p>' +
      '<a href="waitlist.html" class="btn btn-primary" style="width:100%">Join early access</a>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function close() { overlay.remove(); }
    document.getElementById('exitIntentClose').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  }

  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget && e.clientY < 10) show();
  });
}

/* ── Init all ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initReveal();
  initCounters();
  initFAQ();
  initPricingToggle();
  initContactForm();
  initNewsletterForm();
  initSmoothScroll();
  initCopyBtns();
  initKeyboardNav();
  initExitIntent();

  // Theme toggle buttons
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});
