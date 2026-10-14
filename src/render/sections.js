import { chapterById } from '../data/chapters.js'
import { esc, picture, chapterHead, glitchText, seal, arrow, external, COVER_SIZES, HERO_PORTRAIT, portraitArt } from './helpers.js'

// ── 序章 Prologue ──────────────────────────────────────────────────────────────
const KANJI_DIGITS = '〇一二三四五六七八九'
const kanjiYear = (y) => [...String(y)].map((d) => KANJI_DIGITS[d]).join('')

export function hero(p) {
  const next = chapterById.about
  const resume = p.resume
    ? `<a class="btn btn--ghost" href="${esc(p.resume)}" target="_blank" rel="noopener" data-cursor="Open">Résumé ${external}</a>`
    : ''
  return `<section class="hero" id="prologue" data-chapter="prologue" aria-label="Introduction">
    <div class="hero__stage">
      <div class="hero__fallback">
        ${picture('meadow-day', { alt: 'A sunlit meadow of rolling green hills under towering white clouds', eager: true, sizes: COVER_SIZES, art: HERO_PORTRAIT })}
      </div>
      <canvas class="hero__canvas" aria-hidden="true"></canvas>
      <div class="hero__shade" aria-hidden="true"></div>
      <canvas class="hero__sword" data-guard="${esc(p.sword?.guard ?? 'manji')}" aria-hidden="true"></canvas>
      <div class="hero__card" aria-hidden="true">
        <p class="kicker"><span class="jp">${esc(next.no)}</span><span>${esc(next.num)}</span></p>
        <span class="hero__card-title"><span class="glitch" data-text="${esc(next.label)}">${esc(next.label)}</span></span>
        <span class="hero__card-sub">${esc(next.title)}</span>
      </div>
      <canvas class="hero__petals" aria-hidden="true"></canvas>
      <div class="hero__content">
        <p class="hero__eyebrow kicker"><span>Vol.01</span><span class="rule"></span><span>Portfolio ${new Date().getFullYear()}</span></p>
        <div class="hero__main">
          <p class="hero__role kicker"><span>${esc(p.role)}</span><span class="jp">${esc(p.roleJP ?? '')}</span></p>
          <div class="hero__title">
            <h1 class="hero__name">${glitchText(p.name, { dark: true })}</h1>
            ${seal(p.nameJP, 58, 'hero__seal')}
          </div>
          <p class="hero__tagline">${esc(p.tagline)}</p>
          <div class="hero__cta">
            <a class="btn btn--light" href="#projects" data-goto="projects" data-cursor="Work">View work ${arrow}</a>
            <a class="btn btn--ghost" href="#contact" data-goto="contact" data-cursor="Say hi">Contact</a>
            ${resume}
          </div>
        </div>
        <p class="hero__vert" aria-hidden="true">愛蔵版<i></i>第一巻<i></i>${kanjiYear(new Date().getFullYear())}</p>
        <p class="hero__scroll kicker" aria-hidden="true"><span>Scroll</span><i></i></p>
      </div>
    </div>
  </section>`
}

// ── 第一話 Romance Dawn — Profile ─────────────────────────────────────────────
export function about(p) {
  const a = p.about
  const facts = [...a.facts, ...(p.location ? [{ label: 'Based in', value: p.location }] : [])]
    .map((f) => `<div class="databook__row"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)
    .join('')
  const resume = p.resume
    ? `<a class="btn btn--ghost-ink" href="${esc(p.resume)}" target="_blank" rel="noopener" data-cursor="Open">Résumé ${external}</a>`
    : ''
  const [lead, ...rest] = a.bio
  return `<section class="chapter about paper" id="about" data-chapter="about">
    ${chapterHead('about')}
    <div class="about__grid">
      <figure class="about__figure">
        <div class="about__frame">
          ${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)} meditating in a golden field at sunset" style="object-position:${esc(p.photoPosition || '50% 50%')}" loading="lazy" decoding="async">` : ''}
        </div>
        <figcaption class="about__caption kicker"><span>Fig. 01</span><span class="rule"></span><span>${esc(p.name)}</span></figcaption>
        <p class="about__vert" aria-hidden="true">自己紹介</p>
      </figure>
      <div class="about__body">
        <p class="about__lead" data-lines>${esc(lead ?? '')}</p>
        ${rest.map((t) => `<p class="about__text" data-lines>${esc(t)}</p>`).join('')}
        <div class="about__sign">
          ${seal(p.nameJP, 54, 'about__seal')}
          <div>
            <p class="kicker">Also known as</p>
            <p class="about__signature">${esc(a.signature ?? '')}</p>
          </div>
        </div>
        <dl class="databook">${facts}</dl>
        <div class="about__focus">
          <p class="kicker">Focus areas</p>
          <ul class="chips">${a.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        </div>
        ${resume}
      </div>
    </div>
  </section>`
}

// ── 第二話 Fly High — Capabilities ────────────────────────────────────────────
// A Haikyuu-style stat hexagon, drawn as a fine-line chart. One series, one hue;
// the meters beside it carry the same numbers as text.
function hexagon(values) {
  const R = 120
  const n = values.length
  const pt = (i, r) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180)
    return [+(Math.cos(a) * r).toFixed(2), +(Math.sin(a) * r).toFixed(2)]
  }
  const ring = (f) => values.map((_, i) => pt(i, R * f).join(',')).join(' ')
  const rings = [0.25, 0.5, 0.75, 1]
    .map((f) => `<polygon class="hex__ring${f === 1 ? ' hex__ring--outer' : ''}" points="${ring(f)}" pathLength="1"/>`)
    .join('')
  const axes = values.map((_, i) => `<line class="hex__axis" x1="0" y1="0" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}" pathLength="1"/>`).join('')
  const dataPts = values.map((v, i) => pt(i, (R * v.value) / 100))
  const dots = dataPts
    .map(
      ([x, y], i) => `<g class="hex__vertex" data-i="${i}" tabindex="0" role="img" aria-label="${esc(values[i].label)}: ${values[i].value} out of 100">
        <circle class="hex__hit" cx="${x}" cy="${y}" r="16"/>
        <circle class="hex__dot" cx="${x}" cy="${y}" r="3.5"/>
      </g>`,
    )
    .join('')
  const labels = values
    .map((v, i) => {
      const [x, y] = pt(i, R + 22)
      const anchor = Math.abs(x) < 4 ? 'middle' : x > 0 ? 'start' : 'end'
      const dy = Math.abs(x) < 4 ? (y < 0 ? -6 : 16) : 4
      return `<text class="hex__label" x="${x}" y="${y + dy}" text-anchor="${anchor}">${esc(v.label)} <tspan class="hex__val">${v.value}</tspan></text>`
    })
    .join('')
  return `<svg class="hex" viewBox="-250 -165 500 330" role="img" aria-labelledby="hex-title">
    <title id="hex-title">Capability map: ${values.map((v) => `${esc(v.label)} ${v.value}`).join(', ')}</title>
    <g class="hex__grid">${rings}${axes}</g>
    <polygon class="hex__shape" points="${dataPts.map((d) => d.join(',')).join(' ')}" data-points='${JSON.stringify(dataPts)}'/>
    ${dots}
    ${labels}
  </svg>`
}

export function skills(p) {
  const s = p.stats
  const meters = s.values
    .map(
      (v) => `<li class="meter">
        <span class="meter__label">${esc(v.label)}</span>
        <span class="meter__val">${v.value}</span>
        <span class="meter__track"><span class="meter__fill" style="--v:${v.value / 100}"></span></span>
      </li>`,
    )
    .join('')
  return `<section class="chapter skills paper" id="skills" data-chapter="skills">
    ${chapterHead('skills')}
    <p class="section-vert" aria-hidden="true">飛べ<i></i>能力</p>
    <div class="skills__grid">
      <figure class="radar">
        ${hexagon(s.values)}
        <div class="hex__tip" role="tooltip" hidden></div>
        <figcaption class="kicker"><span>Fig. 02</span><span class="rule"></span><span>Capability map · out of 100</span></figcaption>
      </figure>
      <div class="skills__side">
        <p class="skills__spec kicker"><span>Position</span><span class="rule"></span><span>${esc(s.position)} · № ${esc(String(s.number))}</span></p>
        <ul class="meters" aria-label="Capability levels out of 100">${meters}</ul>
      </div>
    </div>
  </section>`
}

// ── 第三話 Bankai — Core Stack ────────────────────────────────────────────────
export function arsenal(p) {
  const a = p.arsenal
  const rows = a.weapons
    .map((w, i) => {
      const bankai = w.form === 'Bankai'
      return `<li class="stack__row${bankai ? ' stack__row--bankai' : ''}" tabindex="0">
        <span class="stack__idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="stack__main">
          <span class="stack__name">${esc(w.name)}</span>
          <span class="stack__cmd">“${esc(w.command)}”</span>
        </span>
        <span class="stack__form">${bankai ? 'Bankai · 卍解' : 'Shikai · 始解'}</span>
        <span class="stack__sweep" aria-hidden="true"></span>
      </li>`
    })
    .join('')
  return `<section class="chapter arsenal" id="arsenal" data-chapter="arsenal">
    <canvas class="arsenal__reiatsu" aria-hidden="true"></canvas>
    <div class="arsenal__intro">
      <p class="arsenal__vol" aria-hidden="true">第三話</p>
      <blockquote class="poem">${a.poem.map((l) => `<span class="poem__line">${esc(l)}</span>`).join('')}</blockquote>
      <p class="poem__sign">— ${esc(p.name)}</p>
    </div>
    <div class="arsenal__body">
      <p class="arsenal__kanji" aria-hidden="true"><span>卍</span><span>解</span><em class="arsenal__bankai">${esc(p.nameJP)}</em></p>
      ${chapterHead('arsenal', { light: true })}
      <p class="stack__legend kicker"><span><b>Bankai 卍解</b> — production-grade</span><span><b>Shikai 始解</b> — working knowledge</span></p>
      <ol class="stack">${rows}</ol>
    </div>
  </section>`
}

// ── 巻頭カラー Colour spread ──────────────────────────────────────────────────
export function spread() {
  return `<section class="spread" id="spread" data-chapter="spread" aria-label="Colour spread">
    <div class="spread__pin">
      <div class="spread__frame">
        ${picture('meadow-peaks', { alt: 'A flower meadow beneath snow-capped mountains on a bright afternoon', sizes: COVER_SIZES, art: portraitArt('meadow-peaks') })}
        <canvas class="spread__petals" aria-hidden="true"></canvas>
      </div>
      <p class="spread__label kicker"><span class="jp">巻頭カラー</span><span>Colour Spread</span></p>
      <blockquote class="spread__quote">
        <span>Every great journey</span>
        <span>looks impossible</span>
        <span>from the <em>first page.</em></span>
      </blockquote>
    </div>
  </section>`
}

// ── 第四話 Mission Log — Selected Work ────────────────────────────────────────
const realLink = (url) => url && url !== '#'

export function missions(p) {
  const cards = p.projects
    .map((m, i) => {
      const no = String(i + 1).padStart(2, '0')
      const cover = m.image
        ? `<img src="${esc(m.image)}" alt="Screenshot of ${esc(m.title)}" loading="lazy" decoding="async">`
        : `<span class="work__num" aria-hidden="true">${no}</span><span class="work__kanji" aria-hidden="true">任務</span>`
      const links = [
        realLink(m.live) && `<a class="work__link" href="${esc(m.live)}" target="_blank" rel="noopener" data-cursor="Visit">Live ${external}</a>`,
        realLink(m.code) && `<a class="work__link" href="${esc(m.code)}" target="_blank" rel="noopener" data-cursor="Code">Code ${external}</a>`,
      ]
        .filter(Boolean)
        .join('')
      return `<li class="work">
        <article class="work__card">
          <div class="work__cover${m.rank === 'S' ? ' work__cover--s' : ''}">
            ${cover}
            <span class="work__rank">${esc(m.rank)}-Rank</span>
          </div>
          <div class="work__body">
            <p class="work__meta kicker"><span>No.${String(i + 1).padStart(3, '0')}</span><span class="rule"></span><span>${esc(m.year)}</span></p>
            <h3 class="work__title">${esc(m.title)}</h3>
            <p class="work__sum">${esc(m.summary)}</p>
            ${m.impact ? `<p class="work__impact"><span class="kicker">Impact</span>${esc(m.impact)}</p>` : ''}
            <ul class="work__stack chips">${m.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            ${links ? `<div class="work__links">${links}</div>` : ''}
          </div>
        </article>
      </li>`
    })
    .join('')
  const total = String(p.projects.length).padStart(2, '0')
  return `<section class="chapter missions paper" id="projects" data-chapter="projects">
    <div class="missions__pin">
      ${chapterHead('projects')}
      <div class="missions__viewport">
        <ol class="missions__track">
          ${cards}
          <li class="missions__more">
            <p class="kicker"><span class="jp">次回へ</span><span>To be continued</span></p>
            <p class="missions__more-text">More missions in Volume 02.</p>
          </li>
        </ol>
      </div>
      <div class="missions__progress" aria-hidden="true">
        <span class="kicker"><b class="missions__count">01</b>&nbsp;/ ${total}</span>
        <span class="missions__bar"><i></i></span>
        <span class="kicker">Scroll</span>
      </div>
    </div>
  </section>`
}

// ── 第五話 Arise — Journey ────────────────────────────────────────────────────
// The System's numbers: levels climb faster as the story goes on, and the rank follows.
const RANKS = [[95, 'S'], [70, 'A'], [45, 'B'], [25, 'C'], [10, 'D'], [0, 'E']]
const levelAt = (i, n) => Math.round(1 + 98 * (n > 1 ? i / (n - 1) : 1) ** 1.6)
const rankOf = (level) => RANKS.find(([min]) => level >= min)[1]
const pad2 = (v) => String(v).padStart(2, '0')

export function journey(p) {
  const n = p.journey.length
  const quests = p.journey
    .map((j, i) => {
      const level = levelAt(i, n)
      return `<li class="quest" data-level="${level}" data-rank="${rankOf(level)}">
        <span class="quest__ghost" aria-hidden="true">${esc(j.year)}</span>
        <article class="quest__window">
          <span class="quest__glow" aria-hidden="true"></span>
          <p class="quest__head"><span class="quest__icon" aria-hidden="true">!</span><span class="quest__type">${esc(j.type)}</span><span class="quest__year">${esc(j.year)}</span></p>
          <h3 class="quest__title">${esc(j.title)}</h3>
          <p class="quest__place">${esc(j.place)}</p>
          <p class="quest__text">${esc(j.text)}</p>
          <p class="quest__reward"><span>Reward</span><span>Lv. ${pad2(level)} · Rank ${rankOf(level)}</span></p>
        </article>
      </li>`
    })
    .join('')
  // The road ends on an open quest: the reader's invitation to get in touch.
  const top = levelAt(n - 1, n)
  const offer = `<li class="quest quest--offer" data-level="${top}" data-rank="${rankOf(top)}">
        <span class="quest__ghost" aria-hidden="true">Next</span>
        <article class="quest__window">
          <span class="quest__glow" aria-hidden="true"></span>
          <p class="quest__head"><span class="quest__icon" aria-hidden="true">!</span><span class="quest__type">Quest available</span><span class="quest__year">Now</span></p>
          <h3 class="quest__title">Join the next raid</h3>
          <p class="quest__text">${esc(p.contact.blurb)}</p>
          <p class="quest__accept"><a class="btn btn--light" href="#contact" data-goto="contact" data-cursor="Accept">Accept quest ${arrow}</a></p>
        </article>
      </li>`
  const nodes = [...p.journey.map((j) => [j.year, j.type]), ['Next', 'Your team']]
    .map(([year, type], i) => `<li style="--at:${i / n}"><button type="button" class="journey__node" data-step="${i}"><span class="journey__node-year">${esc(year)}</span><span class="journey__node-type">${esc(type)}</span></button></li>`)
    .join('')
  return `<section class="chapter journey" id="journey" data-chapter="journey">
    <div class="journey__bg" aria-hidden="true"></div>
    ${chapterHead('journey', { light: true })}
    <div class="journey__stage">
      <canvas class="journey__mana" aria-hidden="true"></canvas>
      <div class="journey__hud" aria-hidden="true">
        <p class="journey__lv"><span>Lv.</span><b class="journey__level">${pad2(levelAt(0, n))}</b></p>
        <p class="journey__rank"><span>Rank</span><b class="journey__rank-letter">${rankOf(levelAt(0, n))}</b></p>
        <p class="journey__xp"><span>EXP</span><span class="journey__xp-bar"><i></i></span></p>
        <p class="journey__player kicker"><span>Player</span><span class="rule"></span><span>${esc(p.name)}</span></p>
        <p class="journey__levelup">Level up!</p>
      </div>
      <div class="journey__viewport">
        <ol class="journey__track">${quests}${offer}</ol>
      </div>
      <nav class="journey__axis" aria-label="Journey milestones">
        <span class="journey__axis-line" aria-hidden="true"><i></i></span>
        <ol>${nodes}</ol>
      </nav>
    </div>
  </section>`
}

// ── 第六話 Over 9000 — Impact ─────────────────────────────────────────────────
export function power(p) {
  const stats = p.power
    .map((s) => `<div class="impact__item"><dt>${esc(s.label)}</dt><dd data-count="${s.value}">${s.value.toLocaleString('en-US')}</dd></div>`)
    .join('')
  return `<section class="chapter power paper" id="power" data-chapter="power">
    ${chapterHead('power')}
    <dl class="impact">${stats}</dl>
    <p class="impact__note kicker"><span>Readings · ${new Date().getFullYear()}</span><span class="rule"></span><span>Scouter calibrated</span></p>
  </section>`
}

// ── 第7話 Domain Expansion — Contact (Jujutsu Kaisen) ─────────────────────────
export function domain(p) {
  const c = p.contact
  const ch = chapterById.contact
  const links = [
    ...c.socials.map((s) => `<a class="btn btn--ghost" href="${esc(s.url)}" target="_blank" rel="noopener" data-cursor="Open">${esc(s.label)} ${external}</a>`),
    p.resume ? `<a class="btn btn--ghost" href="${esc(p.resume)}" target="_blank" rel="noopener" data-cursor="Open">Résumé ${external}</a>` : '',
  ].join('')
  return `<section class="domain" id="contact" data-chapter="contact">
    <div class="domain__stage">
      <div class="domain__image">
        ${picture('valley-night', { alt: 'A valley of glowing wildflowers beneath a dark, star-lit sky', sizes: COVER_SIZES, art: portraitArt('valley-night') })}
      </div>
      <canvas class="domain__sparkles" aria-hidden="true"></canvas>
      <span class="domain__ring" aria-hidden="true"></span>
      <div class="domain__intro" aria-hidden="true">
        <p class="domain__kanji"><span>領</span><span>域</span><span>展</span><span>開</span></p>
        <p class="domain__en kicker">Domain Expansion</p>
      </div>
      <div class="domain__card">
        <p class="kicker"><span class="jp">${esc(ch.no)}</span><span>${esc(ch.num)}</span><span class="rule"></span><span>${esc(ch.label)}</span></p>
        <h2 class="domain__heading">${glitchText(c.heading, { dark: true })}</h2>
        <p class="domain__blurb">${esc(c.blurb)}</p>
        ${p.status ? `<p class="domain__status"><i aria-hidden="true"></i>${esc(p.status)}</p>` : ''}
        <div class="domain__mail">
          <a class="domain__email" href="mailto:${esc(c.email)}" data-cursor="Write">${esc(c.email)}</a>
          <button class="domain__copy" type="button" data-copy="${esc(c.email)}" data-cursor="Copy">Copy</button>
        </div>
        ${links ? `<div class="domain__links">${links}</div>` : ''}
      </div>
    </div>
  </section>`
}

// ── 完 The End ────────────────────────────────────────────────────────────────
export function end(p) {
  const year = new Date().getFullYear()
  return `<footer class="end paper" id="end" data-chapter="end">
    <div class="end__inner">
      <p class="end__kan" aria-hidden="true">完</p>
      <div class="end__text">
        <h2 class="end__thanks">${glitchText('Thank you for reading.')}</h2>
        <p class="end__note">Volume 02 is being written. If you’d like to be in it, <a href="mailto:${esc(p.contact.email)}">say hello</a>.</p>
      </div>
      <a class="end__top" href="#prologue" data-goto="prologue" data-cursor="Top">Back to the first page <span aria-hidden="true">↑</span></a>
    </div>
    <p class="end__fine kicker"><span>© ${year} ${esc(p.name)}</span><span class="rule"></span><span><span class="jp">愛蔵版</span> Collector’s Edition</span></p>
  </footer>`
}
