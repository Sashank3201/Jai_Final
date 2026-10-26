// The reading order of the volume. Each entry drives the chapter headings, the HUD,
// the 目次 index and the per-chapter theme.
//   label — what the section is (what a recruiter scans for)
//   title — the quieter subtitle
export const chapters = [
  { id: 'prologue', no: '序章', num: '00', label: 'Prologue', title: 'Prologue', accent: '#d23c2a', theme: 'prologue' },
  { id: 'about', no: '第一話', num: '01', label: 'Profile', title: 'About me', accent: '#d23c2a', theme: 'onepiece' },
  { id: 'arsenal', no: '第二話', num: '02', label: 'Technical Skills', title: 'Tools I use', accent: '#d23c2a', theme: 'bleach' },
  { id: 'projects', no: '第三話', num: '03', label: 'Projects', title: 'Selected work', accent: '#d23c2a', theme: 'naruto' },
  { id: 'journey', no: '第四話', num: '04', label: 'Experience', title: 'Timeline', accent: '#9fdcff', theme: 'sololeveling' },
  { id: 'contact', no: '第五話', num: '05', label: 'Contact Me', title: 'Get in touch', accent: '#8f7bff', theme: 'jjk' },
  { id: 'end', no: '完', num: '完', label: 'The End', title: 'The End', accent: '#d23c2a', theme: 'end' },
]

export const chapterById = Object.fromEntries(chapters.map((c, i) => [c.id, { ...c, page: i + 1 }]))
