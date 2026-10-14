// Service worker: makes the portfolio installable and readable offline.
// vite.config.js (the pwa plugin) fills in VERSION and PRECACHE at build time and writes
// this file to dist/sw.js.
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const SHELL = `shell-${VERSION}` // the page, scripts and fonts of this build
const RUNTIME = 'runtime' // paintings and photos as they are viewed, kept across builds
const RUNTIME_MAX = 80

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const trim = async (cache) => {
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - RUNTIME_MAX)).map((k) => cache.delete(k)))
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // The page: always the latest from the network, the saved copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(SHELL).then((cache) => cache.put('./', copy))
          }
          return res
        })
        .catch(() => caches.match('./').then((hit) => hit || Response.error())),
    )
    return
  }

  // Build files are content-hashed and never change: the saved copy first.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(SHELL).then((cache) => cache.put(req, copy))
            }
            return res
          }),
      ),
    )
    return
  }

  // Paintings, photos and icons: the saved copy straight away, refreshed in the background.
  event.respondWith(
    caches.open(RUNTIME).then(async (cache) => {
      const hit = await cache.match(req)
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone()).then(() => trim(cache))
          return res
        })
        .catch(() => hit || Response.error())
      return hit || fresh
    }),
  )
})
