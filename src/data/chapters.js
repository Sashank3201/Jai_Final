// The reading order of the volume. Each entry drives the chapter headings, the HUD,
// the 目次 index and the per-chapter theme.
//   label — what the section is (what a recruiter scans for)
//   title — the anime chapter name, shown as the quieter subtitle
export const chapters = [
  { id: 'prologue', no: '序章', num: '00', label: 'Prologue', title: 'Prologue', accent: '#d23c2a', theme: 'prologue' },
  { id: 'about', no: '第一話', num: '01', label: 'Profile', title: 'Romance Dawn', accent: '#d23c2a', theme: 'onepiece' },
  { id: 'skills', no: '第二話', num: '02', label: 'Capabilities', title: 'Fly High', accent: '#d23c2a', theme: 'haikyuu' },
  { id: 'arsenal', no: '第三話', num: '03', label: 'Core Stack', title: 'Bankai', accent: '#d23c2a', theme: 'bleach' },
  { id: 'spread', no: '巻頭カラー', num: '—', label: 'Interlude', title: 'Colour Spread', accent: '#d23c2a', theme: 'spread' },
  { id: 'projects', no: '第四話', num: '04', label: 'Selected Work', title: 'Mission Log', accent: '#d23c2a', theme: 'naruto' },
  { id: 'journey', no: '第五話', num: '05', label: 'Journey', title: 'Arise', accent: '#9fdcff', theme: 'sololeveling' },
  { id: 'power', no: '第六話', num: '06', label: 'Impact', title: 'Over 9000', accent: '#d23c2a', theme: 'dragonball' },
  { id: 'contact', no: '第七話', num: '07', label: 'Contact', title: 'Domain Expansion', accent: '#8f7bff', theme: 'jjk' },
  { id: 'end', no: '完', num: '完', label: 'The End', title: 'The End', accent: '#d23c2a', theme: 'end' },
]

export const chapterById = Object.fromEntries(chapters.map((c, i) => [c.id, { ...c, page: i + 1 }]))
