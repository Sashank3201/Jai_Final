import * as chrome from './chrome.js'
import * as s from './sections.js'

export function renderApp(p) {
  return [
    chrome.loader(p),
    chrome.cursor(),
    chrome.nav(p),
    chrome.hud(),
    chrome.menu(),
    `<main id="main">`,
    s.hero(p),
    s.about(p),
    s.arsenal(p),
    s.missions(p),
    s.journey(p),
    s.domain(p),
    `</main>`,
    s.end(p),
  ].join('\n')
}
