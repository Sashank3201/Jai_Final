// ────────────────────────────────────────────────────────────────────────────
//  YOUR CONTENT LIVES HERE.
//  The HTML is generated from this file at build time (see vite.config.js).
//  Anything marked "placeholder" was filled in at random — swap it for the real thing.
// ────────────────────────────────────────────────────────────────────────────

export const profile = {
  name: 'Jai Karthik',
  nameJP: '天逆鉾', // Ama no Sakahoko, Toji's Inverted Spear of Heaven — shown on the red seals
  initial: 'J',
  role: 'AI Developer',
  roleJP: 'AI開発者',
  tagline: 'I design and ship AI systems — LLM agents, retrieval pipelines and computer vision — from first experiment to production.',
  location: '', // e.g. 'Hyderabad, India' — shown in the profile when set
  status: 'Open to AI engineering roles · 2026',
  photo: 'images/me.webp',
  photoPosition: '50% 92%', // which part of the photo the profile frame shows
  resume: '', // e.g. 'resume.pdf' in /public — adds a Résumé button when set

  about: {
    // DRAFT bio — replace with your own 2–3 sentences.
    bio: [
      'I’m Jai Karthik, an AI developer and 2026 graduate. I build LLM agents, retrieval systems and computer-vision tools.',
      'What I care about is the part most demos skip — making models reliable, fast and simple enough that people actually use them.',
    ],
    signature: '', // optional nickname, written in brush beneath the bio, next to your seal
    focus: ['LLM agents', 'Retrieval (RAG)', 'Computer vision', 'MLOps'],
    facts: [
      { label: 'Role', value: 'AI Developer' },
      { label: 'Education', value: 'Undergraduate · Class of 2026' },
      { label: 'Status', value: 'Open to roles' },
    ],
  },

  // Technical skills. level: 'Expert' (production-grade) or 'Proficient' (working knowledge).
  // Placeholder list — swap in what you really use.
  arsenal: {
    stack: [
      { name: 'Python', level: 'Expert', use: 'Everything from data wrangling to model serving' },
      { name: 'PyTorch', level: 'Expert', use: 'Training, fine-tuning and evaluating models' },
      { name: 'Hugging Face', level: 'Expert', use: 'Transformers, datasets and model hub' },
      { name: 'LangChain', level: 'Proficient', use: 'LLM agents, tools and retrieval chains' },
      { name: 'TensorFlow', level: 'Proficient', use: 'Classic deep-learning pipelines' },
      { name: 'OpenCV', level: 'Proficient', use: 'Real-time image and video processing' },
      { name: 'FastAPI', level: 'Proficient', use: 'Serving models behind clean APIs' },
      { name: 'React', level: 'Proficient', use: 'Front ends for AI products' },
    ],
    // Closes the chapter, after the stack.
    poem: [
      'We fear the blank page',
      'because it shows us nothing.',
      'So I learned to draw the first line —',
      'and the rest followed.',
    ],
  },

  // Projects, newest first. Placeholder projects — swap in your real ones.
  projects: [
    {
      title: 'AI Study Agent',
      year: '2026',
      summary: 'An LLM agent that turns lecture notes into flashcards, quizzes and a study plan that adapts to how you learn.',
      stack: ['Python', 'LangChain', 'FastAPI', 'React'],
      live: '#',
      code: '#',
      image: '',
    },
    {
      title: 'Real-time Vision Tracker',
      year: '2025',
      summary: 'Real-time object detection and pose tracking from a webcam, running at 30 fps on a laptop GPU.',
      stack: ['PyTorch', 'YOLO', 'OpenCV'],
      live: '#',
      code: '#',
      image: '',
    },
    {
      title: 'Chat with your PDFs',
      year: '2025',
      summary: 'Chat with your PDFs: retrieval-augmented answers with page-level citations and zero hallucinated sources.',
      stack: ['LlamaIndex', 'Vector DB', 'Next.js'],
      live: '#',
      code: '#',
      image: '',
    },
    {
      title: 'Community Sentiment Monitor',
      year: '2024',
      summary: 'A sentiment and toxicity reader for online community threads, fine-tuned on real comments.',
      stack: ['Transformers', 'FastAPI', 'Docker'],
      live: '#',
      code: '#',
      image: '',
    },
  ],

  // Experience timeline, oldest first. Only the 2026 graduation is real — the rest is placeholder.
  journey: [
    { year: '2022', type: 'Education', title: 'Began my undergraduate journey', place: 'UG · Year 1', text: 'Picked up Python and never put it down.' },
    { year: '2023', type: 'Milestone', title: 'Trained my first neural network', place: 'Self-taught', text: 'Started with handwritten digits and kept going.' },
    { year: '2025', type: 'Projects', title: 'AI projects & hackathons', place: 'Side projects', text: 'LLM agents, RAG pipelines and computer-vision builds.' },
    { year: '2026', type: 'Graduation', title: 'Graduated — UG, Class of 2026', place: 'Undergraduate degree', text: 'Wrapped up my degree with a focus on applied AI.' },
    { year: '2026', type: 'Today', title: 'AI Developer', place: 'Now', text: 'Building intelligent things — and looking for my next team.' },
  ],

  contact: {
    email: 'mylapurjaikarthik@gmail.com',
    heading: 'Let’s build something intelligent.',
    blurb: 'Roles, collaborations or an idea worth testing — write to me and I’ll reply within a day or two.',
    socials: [], // e.g. { label: 'GitHub', url: 'https://github.com/you' }
  },
}
