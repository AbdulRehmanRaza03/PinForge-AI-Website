/**
 * build.js — Copies the static site files into a `public/` directory so that
 * Vercel has an expected output directory to deploy.
 *
 * This is a zero-dependency Node script (no npm install required). It copies
 * all static assets (HTML, CSS, JS, images, manifest, etc.) into `public/`.
 * The `api/` directory stays at the project root so Vercel recognizes
 * `api/chat.js` as a serverless function.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'public');

// Static asset extensions to copy to public/.
const STATIC_EXT = [
  '.html', '.css', '.js', '.json', '.svg', '.png', '.jpg', '.jpeg',
  '.webp', '.gif', '.ico', '.xml', '.txt', '.webmanifest',
];

// Files to skip (should not be treated as static pages).
const SKIP = new Set([
  'build.js',
  'package.json',
  'package-lock.json',
  'vercel.json',
  '.env.local',
  '.env.example',
  '.gitignore',
  'README.md',
  '.dev-server.js',
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      // Never recurse into node_modules, .git, .next, or the output itself.
      if (['node_modules', '.git', '.next', 'public', '.vercel'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  ensureDir(OUT);

  // Copy root-level static files.
  for (const entry of fs.readdirSync(ROOT)) {
    const full = path.join(ROOT, entry);
    if (fs.statSync(full).isDirectory()) continue; // skip dirs at root
    if (SKIP.has(entry)) continue;

    const ext = path.extname(entry).toLowerCase();
    if (STATIC_EXT.includes(ext) || entry === 'favicon.svg' || entry === 'robots.txt' || entry === 'sitemap.xml') {
      fs.copyFileSync(full, path.join(OUT, entry));
    }
  }

  console.log('Built static site into public/');
}

main();
