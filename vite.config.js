import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { profile } from './src/data/profile.js'
import { renderApp } from './src/render/index.js'
import { esc, heroPreload } from './src/render/helpers.js'

// The hanko-seal favicon, stamped with your initial.
const favicon = (initial) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#e1251b"/><rect x="9" y="9" width="46" height="46" rx="5" fill="none" stroke="#fff4ec" stroke-width="3"/><text x="32" y="45" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="34" fill="#fff4ec">${esc(initial)}</text></svg>`,
  )

// The link-preview card (public/og.jpg, a 1200×630 shot of the hero). Most scrapers only
// follow an absolute URL, so it's made absolute once `site` is set in profile.js.
const share = (site) => {
  const base = site ? site.replace(/\/+$/, '') + '/' : ''
  return [
    base && `<meta property="og:url" content="${esc(base)}" />`,
    `<meta property="og:image" content="${esc(base)}og.jpg" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(profile.name)} — ${esc(profile.role)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
  ]
    .filter(Boolean)
    .join('\n    ')
}

// Pre-renders the whole portfolio from src/data/profile.js into index.html,
// so the content is in the HTML (fast first paint, SEO) and the JS only animates.
const renderPortfolio = () => ({
  name: 'render-portfolio',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) =>
      html
        .replace('<!--app-->', renderApp(profile))
        .replaceAll('%NAME%', esc(profile.name))
        .replaceAll('%ROLE%', esc(profile.role))
        .replaceAll('%TAGLINE%', esc(profile.tagline))
        .replace('%FAVICON%', favicon(profile.initial))
        .replace('%PRELOAD%', heroPreload())
        .replace('%SHARE%', share(profile.site)),
  },
})

// ── First paint ─────────────────────────────────────────────────────────────
// The page can't paint until its stylesheet has arrived, and the Japanese fonts alone
// declared ~490 @font-face ranges (most of the stylesheet's weight) for characters the site
// never shows. So, after the build: keep only the ranges for characters the page or its
// scripts actually contain, inline what's left into the HTML (the dark loader paints with
// the HTML itself), and preload the two fonts the loader's type is set in.
const LOADER_FONTS = [/unbounded-latin-wght-normal-.*\.woff2$/, /geist-mono-latin-wght-normal-.*\.woff2$/]

function parseRanges(value) {
  return value.split(',').map((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, '').split('-')
    const lo = parseInt(a.replace(/\?/g, '0'), 16)
    const hi = parseInt((b ?? a).replace(/\?/g, 'F'), 16)
    return [lo, hi]
  })
}

const firstPaint = () => ({
  name: 'first-paint',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const html = bundle['index.html']
    const css = Object.values(bundle).find((a) => a.type === 'asset' && a.fileName.endsWith('.css'))
    if (!html || !css) return
    const text = String(html.source) + Object.values(bundle).map((c) => (c.type === 'chunk' ? c.code : '')).join('')
    const used = new Set([...text].map((ch) => ch.codePointAt(0)))
    const covers = (ranges) => [...used].some((cp) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi))
    // The loader's own faces stay in <head> and wait for their (preloaded) files instead of
    // flashing a fallback face; every other face is declared at the end of <body>, so the
    // head (and with it the first paint) stays small.
    const forLoader = (rule) => LOADER_FONTS.some((re) => re.test(rule.match(/url\(\.\/([^)]+\.woff2)\)/)?.[1] ?? ''))
    const lateFaces = []
    const styles = String(css.source)
      .replace(/url\(\.\//g, 'url(./assets/') // the rules now live in the page, one folder up
      .replace(/@font-face\{[^}]*\}/g, (rule) => {
        const range = rule.match(/unicode-range:([^;}]+)/)
        if (range && !covers(parseRanges(range[1]))) return ''
        if (forLoader(rule.replace('./assets/', './'))) return rule.replace('font-display:swap', 'font-display:block')
        lateFaces.push(rule)
        return ''
      })
    const preloads = Object.keys(bundle)
      .filter((f) => LOADER_FONTS.some((re) => re.test(f)))
      .map((f) => `<link rel="preload" as="font" type="font/woff2" href="./${f}" crossorigin>`)
      .join('\n    ')
    const link = new RegExp(`<link rel="stylesheet"[^>]*href="\\./${css.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`)
    html.source = String(html.source)
      .replace(link, () => `<style>${styles}</style>`)
      .replace('</title>', () => `</title>\n    ${preloads}`)
      .replace('</body>', () => `<style>${lateFaces.join('')}</style>\n  </body>`)
    delete bundle[css.fileName]
  },
})

// ── PWA ─────────────────────────────────────────────────────────────────────
// Installable (a manifest and icons from scripts/make_icons.py) and readable offline: a
// service worker (src/pwa/sw.js) that saves this build's page, scripts and the loader's
// fonts, and keeps the paintings as they're viewed.
const NIGHT = '#07080c'

const pwa = () => ({
  name: 'pwa',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const manifest = {
      id: './',
      name: `${profile.name} — ${profile.role}`,
      short_name: profile.name,
      description: profile.tagline,
      start_url: './',
      scope: './',
      display: 'standalone',
      orientation: 'any',
      background_color: NIGHT,
      theme_color: NIGHT,
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }
    this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: JSON.stringify(manifest, null, 2) })

    const files = Object.keys(bundle)
    const precache = [
      './',
      ...files.filter((f) => f.endsWith('.js') || LOADER_FONTS.some((re) => re.test(f))).map((f) => `./${f}`),
      './manifest.webmanifest',
      './icons/icon-192.png',
      './icons/icon-512.png',
    ]
    // A new version whenever any file name (content-hashed) or the page itself changes.
    const version = createHash('sha1')
      .update(files.sort().join('|') + String(bundle['index.html']?.source ?? ''))
      .digest('hex')
      .slice(0, 10)
    const sw = readFileSync(new URL('./src/pwa/sw.js', import.meta.url), 'utf8')
      .replace("'__VERSION__'", JSON.stringify(version))
      .replace('__PRECACHE__', JSON.stringify(precache))
    this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw })
  },
})

export default defineConfig({
  base: './',
  plugins: [renderPortfolio(), firstPaint(), pwa()],
  build: { target: 'es2020', assetsInlineLimit: 0 },
})
