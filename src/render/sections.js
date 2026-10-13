import { chapterById } from '../data/chapters.js'
import { esc, picture, chapterHead, seal, arrow, external, volleyball, shuriken } from './helpers.js'

// ── 序章 Prologue ──────────────────────────────────────────────────────────────
const KANJI_DIGITS = '〇一二三四五六七八九'
const kanjiYear = (y) => [...String(y)].map((d) => KANJI_DIGITS[d]).join('')

export function hero(p) {
  const next = chapterById.about
  const words = p.name.trim().split(/\s+/)
  const name = words
    .map((w) => `<span class="hero__line"><span class="hero__word">${esc(w)}</span></span>`)
    .join(' ')
  const resume = p.resume
    ? `<a class="btn btn--ghost" href="${esc(p.resume)}" target="_blank" rel="noopener" data-cursor="Open">Résumé ${external}</a>`
    : ''
  return `<section class="hero" id="prologue" data-chapter="prologue" aria-label="Introduction">
    <div class="hero__stage">
      <div class="hero__card" aria-hidden="true">
        <p class="kicker"><span class="jp">${esc(next.no)}</span><span>${esc(next.num)}</span></p>
        <span class="hero__card-title">${esc(next.label)}</span>
        <span class="hero__card-sub">${esc(next.title)}</span>
      </div>
      <div class="hero__fallback">
        ${picture('meadow-day', { alt: 'A sunlit meadow of rolling green hills under towering white clouds', eager: true })}
      </div>
      <canvas class="hero__canvas" aria-hidden="true"></canvas>
      <canvas class="hero__petals" aria-hidden="true"></canvas>
      <div class="hero__shade" aria-hidden="true"></div>
      <div class="hero__content">
        <p class="hero__eyebrow kicker"><span>Vol.01</span><span class="rule"></span><span>Portfolio ${new Date().getFullYear()}</span></p>
        <div class="hero__main">
          <p class="hero__role kicker"><span>${esc(p.role)}</span><span class="jp">${esc(p.roleJP ?? '')}</span></p>
          <div class="hero__title">
            <h1 class="hero__name">${name}</h1>
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

// ── 第2話 Fly High — Skills (Haikyuu!!) ───────────────────────────────────────
function hexagon(values) {
  const R = 120
  const n = values.length
  const pt = (i, r) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180)
    return [+(Math.cos(a) * r).toFixed(2), +(Math.sin(a) * r).toFixed(2)]
  }
  const ring = (f) => values.map((_, i) => pt(i, R * f).join(',')).join(' ')
  const rings = [0.25, 0.5, 0.75, 1]
    .map((f) => `<polygon class="hex__ring${f === 1 ? ' hex__ring--outer' : ''}" points="${ring(f)}"/>`)
    .join('')
  const axes = values.map((_, i) => `<line class="hex__axis" x1="0" y1="0" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}"/>`).join('')
  const dataPts = values.map((v, i) => pt(i, (R * v.value) / 100))
  const dots = dataPts
    .map(
      ([x, y], i) => `<g class="hex__vertex" data-i="${i}" tabindex="0" role="img" aria-label="${esc(values[i].label)}: ${values[i].value} out of 100">
        <circle class="hex__hit" cx="${x}" cy="${y}" r="16"/>
        <circle class="hex__dot" cx="${x}" cy="${y}" r="5"/>
      </g>`,
    )
    .join('')
  const labels = values
    .map((v, i) => {
      const [x, y] = pt(i, R + 26)
      const anchor = Math.abs(x) < 4 ? 'middle' : x > 0 ? 'start' : 'end'
      const dy = Math.abs(x) < 4 ? (y < 0 ? -6 : 18) : 5
      return `<text class="hex__label" x="${x}" y="${y + dy}" text-anchor="${anchor}">${esc(v.label)} <tspan class="hex__val">${v.value}</tspan></text>`
    })
    .join('')
  return `<svg class="hex" viewBox="-250 -175 500 350" role="img" aria-labelledby="hex-title">
    <title id="hex-title">Skill stats: ${values.map((v) => `${esc(v.label)} ${v.value}`).join(', ')}</title>
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
        <span class="meter__track"><span class="meter__fill" style="--v:${v.value / 100}"></span></span>
        <span class="meter__val">${v.value}</span>
      </li>`,
    )
    .join('')
  return `<section class="chapter skills" id="skills" data-chapter="skills">
    <svg class="skills__court" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="120" y="140" width="1360" height="620" />
      <line x1="800" y1="110" x2="800" y2="790" class="net"/>
      <line x1="573" y1="140" x2="573" y2="760"/>
      <line x1="1027" y1="140" x2="1027" y2="760"/>
    </svg>
    <p class="skills__bigjp" aria-hidden="true">飛べ</p>
    <div class="skills__pin">
      ${chapterHead('skills')}
      <div class="skills__grid">
        <div class="player">
          <div class="player__jersey" aria-hidden="true"><span>${esc(String(s.number))}</span></div>
          <div class="player__meta">
            <span class="player__k">Position</span>
            <strong class="player__pos">${esc(s.position)}</strong>
            <span class="player__k">Number</span>
            <strong class="player__pos">#${esc(String(s.number))} · ${esc(p.name)}</strong>
          </div>
          <ul class="meters" aria-label="Skill levels out of 100">${meters}</ul>
        </div>
        <div class="hexwrap">
          ${hexagon(s.values)}
          <div class="hex__tip" role="tooltip" hidden></div>
          <span class="sfx sfx--spike" aria-hidden="true">ドゴッ<b>!</b></span>
          <span class="hexwrap__impact" aria-hidden="true"></span>
        </div>
      </div>
      <div class="skills__ball" aria-hidden="true">${volleyball}</div>
    </div>
  </section>`
}

// ── 第3話 Bankai — Tech arsenal (Bleach) ──────────────────────────────────────
export function arsenal(p) {
  const a = p.arsenal
  const blades = a.weapons
    .map(
      (w, i) => `<li class="blade blade--${w.form === 'Bankai' ? 'bankai' : 'shikai'}" tabindex="0" style="--i:${i}">
        <span class="blade__form">${w.form === 'Bankai' ? 'Bankai · 卍解' : 'Shikai · 始解'}</span>
        <h3 class="blade__name">${esc(w.name)}</h3>
        <p class="blade__cmd">“${esc(w.command)}”</p>
        <span class="blade__wrap" aria-hidden="true"></span>
        <span class="blade__slash" aria-hidden="true"></span>
      </li>`,
    )
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
      <p class="arsenal__hint">Hover or tap a blade to release it.</p>
      <ul class="blades">${blades}</ul>
    </div>
  </section>`
}

// ── 巻頭カラー Colour spread ──────────────────────────────────────────────────
export function spread() {
  return `<section class="spread" id="spread" data-chapter="spread" aria-label="Colour spread">
    <div class="spread__pin">
      <div class="spread__frame">
        ${picture('meadow-peaks', { alt: 'A flower meadow beneath snow-capped mountains on a bright afternoon' })}
        <canvas class="spread__petals" aria-hidden="true"></canvas>
      </div>
      <p class="spread__label"><span aria-hidden="true">巻頭カラー</span> Colour Spread</p>
      <blockquote class="spread__quote">
        <span>Every great journey</span>
        <span>looks impossible</span>
        <span>from the <em>first page.</em></span>
      </blockquote>
    </div>
  </section>`
}

// ── 第4話 Mission Log — Projects (Naruto) ─────────────────────────────────────
export function missions(p) {
  const cards = p.projects
    .map((m, i) => {
      const art = m.image
        ? `<img src="${esc(m.image)}" alt="Screenshot of ${esc(m.title)}" loading="lazy" decoding="async">`
        : `<span class="mission__glyph" aria-hidden="true">${esc(m.title.charAt(0))}</span><span class="mission__kanji" aria-hidden="true">任務</span>`
      const links = [
        m.live && `<a href="${esc(m.live)}" target="_blank" rel="noopener" data-cursor="Visit">Live ${external}</a>`,
        m.code && `<a href="${esc(m.code)}" target="_blank" rel="noopener" data-cursor="Code">Code ${external}</a>`,
      ]
        .filter(Boolean)
        .join('')
      return `<li class="mission rank-${esc(m.rank)}">
        <span class="mission__rod" aria-hidden="true"></span>
        <article class="mission__paper">
          <header class="mission__head">
            <span class="mission__rank" aria-label="Rank ${esc(m.rank)}">${esc(m.rank)}</span>
            <span class="mission__type">${esc(m.rank)}-Rank Mission</span>
            <span class="mission__no">No.${String(i + 1).padStart(3, '0')} · ${esc(m.year)}</span>
          </header>
          <div class="mission__art">${art}</div>
          <h3 class="mission__title">${esc(m.title)}</h3>
          <p class="mission__sum">${esc(m.summary)}</p>
          <p class="mission__k">Jutsu used</p>
          <ul class="mission__jutsu">${m.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="mission__links">${links}</div>
        </article>
        <span class="mission__rod" aria-hidden="true"></span>
      </li>`
    })
    .join('')
  const total = String(p.projects.length).padStart(2, '0')
  return `<section class="chapter missions" id="projects" data-chapter="projects">
    <div class="missions__pin">
      <div class="missions__lines" aria-hidden="true"></div>
      ${chapterHead('projects')}
      <div class="missions__viewport">
        <ol class="missions__track">
          ${cards}
          <li class="missions__more"><span aria-hidden="true">次回へ…</span><p>More missions in the next volume.</p></li>
        </ol>
      </div>
      <div class="missions__progress" aria-hidden="true">
        ${shuriken}
        <span class="missions__count"><b>01</b> / ${total}</span>
        <span class="missions__bar"><i></i></span>
      </div>
    </div>
  </section>`
}

// ── 第5話 Arise — Journey (Solo Leveling) ─────────────────────────────────────
export function journey(p) {
  const items = p.journey
    .map(
      (j, i) => `<li class="syswin" style="--i:${i}">
        <p class="syswin__type">[ ${esc(j.type)} ]</p>
        <p class="syswin__year">${esc(j.year)}</p>
        <h3 class="syswin__title">${esc(j.title)}</h3>
        <p class="syswin__place">${esc(j.place)}</p>
        <p class="syswin__text">${esc(j.text)}</p>
      </li>`,
    )
    .join('')
  return `<section class="chapter journey" id="journey" data-chapter="journey">
    <div class="journey__bg" aria-hidden="true"></div>
    ${chapterHead('journey', { light: true })}
    <div class="journey__grid">
      <aside class="status" aria-label="Status window">
        <p class="status__head">[ Status ]</p>
        <dl class="status__rows">
          <div><dt>Name</dt><dd>${esc(p.name)}</dd></div>
          <div><dt>Level</dt><dd class="status__level">1</dd></div>
          <div><dt>Rank</dt><dd class="status__rank">E</dd></div>
          <div><dt>Title</dt><dd class="status__title">${esc(p.journey[0]?.title ?? '')}</dd></div>
        </dl>
        <p class="status__k">EXP</p>
        <span class="status__exp"><i></i></span>
      </aside>
      <ol class="journey__list" data-titles='${esc(JSON.stringify(p.journey.map((j) => j.title)))}'>${items}</ol>
    </div>
    <p class="journey__final syswin syswin--final">[ System ] You have become an <b>S-Rank</b> developer. <span>Arise.</span></p>
  </section>`
}

// ── 第6話 Over 9000 — Numbers (Dragon Ball) ──────────────────────────────────
export function power(p) {
  const stats = p.power
    .map((s) => `<div class="power__stat"><dt>${esc(s.label)}</dt><dd data-count="${s.value}">${s.value.toLocaleString('en-US')}</dd></div>`)
    .join('')
  return `<section class="chapter power" id="power" data-chapter="power">
    <div class="power__aura" aria-hidden="true"></div>
    ${chapterHead('power')}
    <div class="power__grid">
      <div class="scouter" aria-hidden="true">
        <div class="scouter__lens">
          <span class="scouter__reticle"></span>
          <span class="scouter__scan"></span>
          <span class="scouter__read">SCANNING…</span>
          <span class="scouter__num">0000</span>
          <svg class="scouter__crack" viewBox="0 0 200 140"><path d="M120 20 104 52l22 10-30 26 16 6-20 30M104 52 70 44M126 62l38-6M96 88 60 98"/></svg>
        </div>
        <span class="scouter__arm"></span>
      </div>
      <dl class="power__stats">${stats}</dl>
    </div>
    <p class="power__total">Power level <strong data-power="9001">9,001</strong></p>
    <p class="power__over" aria-hidden="true"><span>IT'S OVER</span> <b>9000!!</b></p>
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
        ${picture('valley-night', { alt: 'A valley of glowing wildflowers beneath a dark, star-lit sky' })}
      </div>
      <canvas class="domain__sparkles" aria-hidden="true"></canvas>
      <span class="domain__ring" aria-hidden="true"></span>
      <div class="domain__intro" aria-hidden="true">
        <p class="domain__kanji"><span>領</span><span>域</span><span>展</span><span>開</span></p>
        <p class="domain__en kicker">Domain Expansion</p>
      </div>
      <div class="domain__card">
        <p class="kicker"><span class="jp">${esc(ch.no)}</span><span>${esc(ch.num)}</span><span class="rule"></span><span>${esc(ch.label)}</span></p>
        <h2 class="domain__heading">${esc(c.heading)}</h2>
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
        <h2 class="end__thanks">Thank you for reading.</h2>
        <p class="end__note">Volume 02 is being written. If you’d like to be in it, <a href="mailto:${esc(p.contact.email)}">say hello</a>.</p>
      </div>
      <a class="end__top" href="#prologue" data-goto="prologue" data-cursor="Top">Back to the first page <span aria-hidden="true">↑</span></a>
    </div>
    <p class="end__fine kicker"><span>© ${year} ${esc(p.name)}</span><span class="rule"></span><span><span class="jp">愛蔵版</span> Collector’s Edition</span></p>
  </footer>`
}
