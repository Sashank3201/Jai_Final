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
    s.skills(p),
    s.arsenal(p),
    s.spread(p),
    s.missions(p),
    s.journey(p),
    s.power(p),
    s.domain(p),
    `</main>`,
    s.end(p),
  ].join('\n')
}
