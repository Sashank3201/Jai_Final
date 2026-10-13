import { chapters } from '../data/chapters.js'
import { esc } from './helpers.js'

export function loader(p) {
  return `<div class="loader" data-loader aria-hidden="true">
    <div class="loader__shard loader__shard--1"></div>
    <div class="loader__shard loader__shard--2"></div>
    <div class="loader__shard loader__shard--3"></div>
    <div class="loader__cover">
      <p class="loader__top kicker"><span>Vol.01</span><span class="rule"></span><span class="jp">第一巻</span></p>
      <p class="loader__name" style="--chars:${p.name.length}">${esc(p.name)}</p>
      <p class="loader__role kicker">${esc(p.role)}</p>
      <div class="loader__bar"><i></i></div>
      <p class="loader__count kicker"><span>Loading</span><span class="loader__num">000</span></p>
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
  <p class="nav__vol" aria-hidden="true">${esc(p.name)} <span class="nav__role">— ${esc(p.role)}</span></p>`
}

export function hud() {
  const total = String(chapters.length).padStart(2, '0')
  return `<div class="hud" aria-hidden="true">
    <span class="hud__no">序章</span>
    <span class="hud__title">Prologue</span>
    <span class="hud__rule"><i></i></span>
    <span class="hud__page"><b class="hud__page-n">01</b>/${total}</span>
  </div>`
}

export function menu() {
  const items = chapters
    .map(
      (c, i) => `<li>
        <a href="#${c.id}" data-goto="${c.id}">
          <span class="menu__num">${esc(c.num)}</span>
          <span class="menu__label">${esc(c.label)}</span>
          <span class="menu__sub"><span class="menu__no">${esc(c.no)}</span> ${c.title !== c.label ? esc(c.title) : ''}</span>
          <span class="menu__page">p.${String(i + 1).padStart(2, '0')}</span>
        </a>
      </li>`,
    )
    .join('')
  return `<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Table of contents" hidden>
    <div class="menu__bg" aria-hidden="true"></div>
    <div class="menu__inner">
      <p class="menu__title kicker"><span class="jp">目次</span><span>Contents</span><span class="rule"></span><span>Vol.01</span></p>
      <ol class="menu__list">${items}</ol>
    </div>
  </div>`
}

export function cursor() {
  return `<div class="cursor" aria-hidden="true">
    <div class="cursor__ring"></div>
    <div class="cursor__dot"></div>
    <span class="cursor__label"></span>
  </div>`
}
