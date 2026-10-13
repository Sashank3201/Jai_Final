import { chapters } from '../data/chapters.js'
import { esc, volleyball, shuriken } from './helpers.js'

export function loader(p) {
  return `<div class="loader" data-loader aria-hidden="true">
    <div class="loader__shard loader__shard--1"></div>
    <div class="loader__shard loader__shard--2"></div>
    <div class="loader__shard loader__shard--3"></div>
    <div class="loader__cover">
      <span class="loader__vol">VOL.<b>01</b></span>
      <span class="loader__jp">第一巻</span>
      <span class="loader__name" style="--chars:${p.name.length}">${esc(p.name)}</span>
      <span class="loader__role">${esc(p.role)}</span>
      <span class="loader__bar"><i></i></span>
      <span class="loader__count">000</span>
    </div>
  </div>`
}

export function nav(p) {
  return `<header class="nav">
    <a class="nav__seal" href="#prologue" data-goto="prologue" aria-label="${esc(p.name)} — back to the first page" data-cursor="Top">
      <span>${esc(p.initial)}</span>
    </a>
    <span class="nav__spacer"></span>
    <button class="nav__menu" type="button" aria-expanded="false" aria-controls="menu" data-cursor="Open">
      <span class="nav__menu-jp" aria-hidden="true">目次</span><span class="nav__menu-en">Index</span>
      <span class="nav__burger" aria-hidden="true"><i></i><i></i></span>
    </button>
  </header>
  <p class="nav__vol" aria-hidden="true"><span>VOL.01</span> ${esc(p.name)} <span class="nav__role">— ${esc(p.role)}</span></p>`
}

export function hud() {
  const total = String(chapters.length).padStart(2, '0')
  return `<div class="hud" aria-hidden="true">
    <div class="hud__kanji"><span>序</span></div>
    <div class="hud__meta">
      <span class="hud__no">序章</span>
      <span class="hud__title">Prologue</span>
    </div>
    <div class="hud__page">P.<span class="hud__page-n">01</span>/${total}</div>
  </div>
  <div class="progress" aria-hidden="true"><span></span></div>`
}

export function menu() {
  const items = chapters
    .map(
      (c, i) => `<li style="--accent:${c.accent}">
        <a href="#${c.id}" data-goto="${c.id}">
          <span class="menu__no">${esc(c.no)}</span>
          <span class="menu__name">${esc(c.title)}</span>
          <span class="menu__dots" aria-hidden="true"></span>
          <span class="menu__page">p.${String(i + 1).padStart(2, '0')}</span>
          <span class="menu__sub">${esc(c.sub)}</span>
        </a>
      </li>`,
    )
    .join('')
  return `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Table of contents" hidden>
    <div class="menu__bg" aria-hidden="true"></div>
    <div class="menu__inner">
      <p class="menu__title"><span aria-hidden="true">目次</span> Contents</p>
      <ol class="menu__list">${items}</ol>
      <p class="menu__foot" aria-hidden="true">— 第1巻 —</p>
    </div>
  </div>`
}

export function cursor() {
  return `<div class="cursor" aria-hidden="true">
    <div class="cursor__ring">${volleyball}${shuriken}</div>
    <div class="cursor__dot"></div>
    <span class="cursor__label"></span>
  </div>`
}
