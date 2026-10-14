import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/unbounded'
import '@fontsource/shippori-mincho/500.css'
import '@fontsource/shippori-mincho/700.css'
import '@fontsource/shippori-mincho/800.css'
import '@fontsource/yuji-boku'
import './styles/main.css'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

import { prefersReducedMotion } from './lib/utils.js'
import { initScroll } from './lib/scroll.js'
import { runLoader } from './sections/loader.js'
import { initCursor, initChapters, initNav } from './sections/chrome.js'
import { initChapterHeads } from './sections/reveal.js'
import { onFastScroll } from './fx/glitch.js'
import { initHero } from './sections/hero.js'
import { initAbout } from './sections/about.js'
import { initSkills } from './sections/skills.js'
import { initArsenal } from './sections/arsenal.js'
import { initSpread } from './sections/spread.js'
import { initMissions } from './sections/missions.js'
import { initJourney } from './sections/journey.js'
import { initPower } from './sections/power.js'
import { initDomain } from './sections/domain.js'
import { initEnd } from './sections/end.js'

gsap.registerPlugin(ScrollTrigger, SplitText)
// Mobile toolbars resize the viewport as they collapse; don't re-lay out pinned scenes for that.
ScrollTrigger.config({ ignoreMobileResize: true })
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

const reduce = prefersReducedMotion()
const opts = { reduce }

initScroll(reduce)
initCursor(opts)
initNav(opts)

// Sections are initialised in reading order so pinned scenes stack correctly.
const hero = initHero(opts)
if (!reduce) {
  initChapterHeads()
  // A fast flick of the scroll tears every glitch headline on screen.
  let tear = null
  const scrollWatch = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: () => tear?.() })
  tear = onFastScroll(() => scrollWatch.getVelocity())
}
initAbout(opts)
initSkills(opts)
initArsenal(opts)
initSpread(opts)
initMissions(opts)
initJourney(opts)
initPower(opts)
initDomain(opts)
initEnd(opts)
initChapters()

// The loader holds at 100 while the heavy one-off work runs (building the sword, measuring
// every scroll scene), then opens on the hero. Re-measuring while it counts would stutter it.
let opened = false
runLoader(opts, {
  beforeOpen: async () => {
    await hero.prepare()
    ScrollTrigger.refresh()
  },
  onOpen: () => hero.intro(),
}).then(() => (opened = true))

document.fonts?.ready.then(() => opened && ScrollTrigger.refresh())
window.addEventListener('load', () => opened && ScrollTrigger.refresh())
