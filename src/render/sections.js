import { chapterById } from '../data/chapters.js'
import { esc, picture, chapterHead, arrow, external, volleyball, shuriken } from './helpers.js'

// ── 序章 Prologue ──────────────────────────────────────────────────────────────
// One line per word; every line shares the size that fits the longest word.
function heroName(name) {
  const words = name.trim().split(/\s+/).slice(0, 3)
  const vh = [20, 14, 10][words.length - 1]
  const chars = Math.max(3, ...words.map((w) => w.length))
  return words
    .map(
      (w) => `<span class="hero__line" style="--chars:${chars};--vh:${vh}vh">${[...w]
        .map((ch) => `<span class="hero__char" data-text="${esc(ch)}" aria-hidden="true">${esc(ch)}</span>`)
        .join('')}</span>`,
    )
    .join('')
}

export function hero(p) {
  const next = chapterById.about
  return `<section class="hero" id="prologue" data-chapter="prologue" aria-label="Prologue">
    <div class="hero__stage">
      <div class="hero__card" aria-hidden="true">
        <span class="hero__card-no">${esc(next.no)}</span>
        <span class="hero__card-title">${esc(next.title)}</span>
        <span class="hero__card-sub">— the adventure begins —</span>
      </div>
      <div class="hero__fallback">
        ${picture('meadow-day', { alt: 'A sunlit meadow of rolling green hills under towering white clouds', eager: true })}
      </div>
      <canvas class="hero__canvas" aria-hidden="true"></canvas>
      <canvas class="hero__lines" aria-hidden="true"></canvas>
      <canvas class="hero__petals" aria-hidden="true"></canvas>
      <div class="hero__content">
        <p class="hero__eyebrow"><span>VOL.01</span><span aria-hidden="true">序章</span><span>Prologue</span></p>
        <h1 class="hero__name" aria-label="${esc(p.name)}">${heroName(p.name)}</h1>
        <div class="hero__seal" aria-hidden="true"><span>${esc(p.nameJP)}</span></div>
        <div class="hero__sfx sfx" aria-hidden="true">ドン<b>!</b></div>
        <div class="hero__caption narr">
          <p class="hero__role">${esc(p.role)}</p>
          <p class="hero__tagline">${esc(p.tagline)}</p>
        </div>
        <a class="hero__tbc" href="#about" data-goto="about" data-cursor="Read">
          <span>To Be Continued</span>${arrow}
        </a>
        <p class="hero__scroll" aria-hidden="true"><span>スクロール</span><i></i></p>
      </div>
    </div>
  </section>`
}

// ── 第1話 Romance Dawn — About (One Piece) ────────────────────────────────────
const strawHatSilhouette = `<svg class="wanted__silhouette" viewBox="0 0 200 220" aria-hidden="true">
  <path d="M20 220c6-48 40-74 80-74s74 26 80 74Z" fill="#2b2420"/>
  <ellipse cx="100" cy="98" rx="44" ry="52" fill="#2b2420"/>
  <ellipse cx="100" cy="66" rx="86" ry="18" fill="#e9c46a" stroke="#2b2420" stroke-width="5"/>
  <path d="M58 64c0-30 18-44 42-44s42 14 42 44Z" fill="#e9c46a" stroke="#2b2420" stroke-width="5"/>
  <path d="M59 56c26 6 56 6 82 0v10c-26 6-56 6-82 0Z" fill="#c1121f"/>
</svg>`

export function about(p) {
  const a = p.about
  const photo = p.photo
    ? `<img src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}" style="object-position:${esc(p.photoPosition || '50% 50%')}" loading="lazy" decoding="async">`
    : strawHatSilhouette
  const facts = a.facts
    .map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)
    .join('')
  // A short line is shouted in a spiky manga burst; longer text sits in a narration box.
  const panel = (t, lg) =>
    t.length <= 28
      ? `<div class="shout" data-pop><p class="shout__text" style="--chars:${Math.max(...t.split(/\s+/).map((w) => w.length))}">${esc(t)}</p></div>`
      : `<div class="narr${lg ? ' narr--lg' : ''}" data-pop><p>${esc(t)}</p></div>`
  const resume = p.resume
    ? `<a class="btn" href="${esc(p.resume)}" target="_blank" rel="noopener" data-cursor="Open">Read the full log ${external}</a>`
    : ''
  return `<section class="chapter about paper" id="about" data-chapter="about">
    ${chapterHead('about')}
    <div class="about__grid">
      <div class="about__poster">
        <span class="sfx sfx--don" aria-hidden="true">ドン<b>!</b></span>
        <article class="wanted" aria-label="Wanted poster for ${esc(p.name)}" data-tilt>
          <span class="wanted__nail" aria-hidden="true"></span>
          <h3 class="wanted__title">WANTED</h3>
          <div class="wanted__photo">${photo}</div>
          <p class="wanted__doa"><s>DEAD</s><span class="wanted__hire" aria-label="hire">HIRE</span> OR ALIVE</p>
          <p class="wanted__name" style="--chars:${p.name.length}">${esc(p.name)}</p>
          <p class="wanted__bounty"><span class="berry" aria-hidden="true">B</span><span data-bounty="${a.bounty}">${a.bounty.toLocaleString('en-US')}</span>-</p>
          <p class="wanted__fine">${esc(p.role)} · ${esc(p.location)}</p>
        </article>
      </div>
      <div class="about__story">
        ${a.paragraphs[0] ? panel(a.paragraphs[0], true) : ''}
        <div class="bubble" data-pop><p>${esc(a.bubble)}</p></div>
        ${a.paragraphs.slice(1).map((t) => panel(t, false)).join('')}
        <div class="thought" data-pop><p>${esc(a.thought)}</p></div>
        <dl class="facts" data-pop>${facts}</dl>
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
  const socials = c.socials
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener" data-cursor="Go">${esc(s.label)} ${external}</a></li>`)
    .join('')
  return `<section class="domain" id="contact" data-chapter="contact">
    <div class="domain__stage">
      <div class="domain__image">
        ${picture('valley-night', { alt: 'A valley of glowing wildflowers beneath a dark, star-lit sky' })}
      </div>
      <canvas class="domain__sparkles" aria-hidden="true"></canvas>
      <span class="domain__ring" aria-hidden="true"></span>
      <div class="domain__intro">
        <h2 class="domain__title">
          <span class="domain__kanji" aria-hidden="true"><span>領</span><span>域</span><span>展</span><span>開</span></span>
          <span class="domain__en">Domain Expansion</span>
        </h2>
        <p class="domain__name"><span aria-hidden="true">${esc(c.domainJP)}</span> ${esc(c.domain)}</p>
      </div>
      <div class="domain__card">
        <p class="domain__blurb">${esc(c.blurb)}</p>
        <div class="domain__mail">
          <a class="domain__email" href="mailto:${esc(c.email)}" data-cursor="Write">${esc(c.email)}</a>
          <button class="domain__copy" type="button" data-copy="${esc(c.email)}" data-cursor="Copy">Copy</button>
        </div>
        ${socials ? `<ul class="domain__socials">${socials}</ul>` : ''}
      </div>
    </div>
  </section>`
}

// ── 完 The End ────────────────────────────────────────────────────────────────
export function end(p) {
  const year = new Date().getFullYear()
  return `<footer class="end paper" id="end" data-chapter="end">
    <p class="end__kan" aria-hidden="true">完</p>
    <h2 class="end__thanks">Thank you for reading <em>Vol.01</em></h2>
    <div class="end__preview narr">
      <p class="end__k"><span aria-hidden="true">次回予告</span> Next volume</p>
      <p>${esc(p.name)} is still writing the next chapter. Stay tuned — or better, be in it.</p>
    </div>
    <a class="end__again" href="#prologue" data-goto="prologue" data-cursor="Again">Read again <span aria-hidden="true">↺</span></a>
    <p class="end__fine">© ${year} ${esc(p.name)} · Drawn in ink &amp; code · All anime motifs are original fan homages.</p>
  </footer>`
}
