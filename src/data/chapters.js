// The reading order of the volume. Each entry drives the HUD, the 目次 index,
// the per-chapter accent colour and the per-chapter cursor.
export const chapters = [
  { id: 'prologue', no: '序章', mark: '序', title: 'Prologue', sub: 'The story begins', accent: '#e1251b', theme: 'prologue' },
  { id: 'about', no: '第一話', mark: '1', title: 'Romance Dawn', sub: 'About me · 自己紹介', accent: '#e1251b', theme: 'onepiece' },
  { id: 'skills', no: '第二話', mark: '2', title: 'Fly High', sub: 'Skills · 能力', accent: '#ff6b00', theme: 'haikyuu' },
  { id: 'arsenal', no: '第三話', mark: '3', title: 'Bankai', sub: 'Tech arsenal · 卍解', accent: '#ff4b2b', theme: 'bleach' },
  { id: 'spread', no: '巻頭カラー', mark: '彩', title: 'Colour Spread', sub: 'Interlude', accent: '#ffb703', theme: 'spread' },
  { id: 'projects', no: '第四話', mark: '4', title: 'Mission Log', sub: 'Projects · 任務', accent: '#ff7a00', theme: 'naruto' },
  { id: 'journey', no: '第五話', mark: '5', title: 'Arise', sub: 'Journey · 経験値', accent: '#4cc9ff', theme: 'sololeveling' },
  { id: 'power', no: '第六話', mark: '6', title: 'Over 9000', sub: 'By the numbers · 戦闘力', accent: '#ffc531', theme: 'dragonball' },
  { id: 'contact', no: '第七話', mark: '7', title: 'Domain Expansion', sub: 'Contact · 領域展開', accent: '#9b5cff', theme: 'jjk' },
  { id: 'end', no: '完', mark: '完', title: 'The End', sub: 'Thank you for reading', accent: '#e1251b', theme: 'end' },
]

export const chapterById = Object.fromEntries(chapters.map((c, i) => [c.id, { ...c, page: i + 1 }]))
