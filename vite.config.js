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
        .replace('%PRELOAD%', heroPreload()),
  },
})

export default defineConfig({
  base: './',
  plugins: [renderPortfolio()],
  build: { target: 'es2020', assetsInlineLimit: 0 },
})
