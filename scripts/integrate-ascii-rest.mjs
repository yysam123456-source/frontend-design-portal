/*
 * Integrate ascii.rest (https://github.com/bas3line/ascii, MIT) into the portal
 * catalogue.
 *
 * Source of truth: the self-hosted runtime in public/ascii-rest/ (pieces copied
 * from ascii.rest, see ATTRIBUTION.txt). This script reads each piece module's
 * `export const meta` block and writes:
 *
 *   public/data/ascii-rest.json  full entries (code snippet + demo link)
 *   public/data/index.json       summary entries, stats, total, project list
 *   public/data/ascii-sharks.json  the shark demos join the same ASCII category
 *
 * Run with `node scripts/integrate-ascii-rest.mjs` from the repo root.
 */
import fs from 'fs'
import path from 'path'

const rootDir = process.cwd()
const piecesDir = path.join(rootDir, 'public', 'ascii-rest', 'pieces')
const dataDir = path.join(rootDir, 'public', 'data')
const PROJECT_ID = 'ascii-rest'
const CATEGORY = 'ascii'

const CATEGORY_ORDER = [
  'scenes',
  'ui',
  'data',
  'type',
  'logos',
  'companies',
  'distros',
  'shapes',
  'space',
  'physics',
  'nature',
  'creatures',
  'objects',
  'generative',
  'effects',
]

const CATEGORY_PHRASE = {
  scenes: 'ASCII landscape scene',
  ui: 'ASCII interface study',
  data: 'ASCII data visualization',
  type: 'ASCII type effect',
  logos: 'ASCII logo',
  companies: 'ASCII brand mark',
  distros: 'ASCII operating-system mark',
  shapes: 'ASCII geometry study',
  space: 'ASCII space scene',
  physics: 'ASCII physics simulation',
  nature: 'ASCII nature scene',
  creatures: 'ASCII creature',
  objects: 'ASCII object study',
  generative: 'generative ASCII artwork',
  effects: 'ASCII visual effect',
}

// Brands and acronyms that title-casing would mangle.
const NAME_OVERRIDES = {
  'a0': 'A0',
  agentmail: 'AgentMail',
  almalinux: 'AlmaLinux',
  'arch-linux': 'Arch Linux',
  'alpine-linux': 'Alpine Linux',
  apple: 'Apple',
  'bar-chart': 'Bar Chart',
  'big-text': 'Big Text',
  'black-hole': 'Black Hole',
  'black-prism': 'Black Prism',
  'box-frames': 'Box Frames',
  'boot-log': 'Boot Log',
  c: 'C',
  'c-sharp': 'C#',
  csharp: 'C#',
  cpp: 'C++',
  css: 'CSS',
  centos: 'CentOS',
  clojure: 'Clojure',
  cloudflare: 'Cloudflare',
  coderabbit: 'CodeRabbit',
  collabute: 'Collabute',
  'command-code': 'Command Code',
  'command-city': 'Command City',
  databuddy: 'Databuddy',
  debian: 'Debian',
  deepin: 'Deepin',
  'deep-reef': 'Deep Reef',
  'digital-clock': 'Digital Clock',
  'dna-helix': 'DNA Helix',
  doc: 'Doc',
  'doom-fire': 'Doom Fire',
  'double-pendulum': 'Double Pendulum',
  'elementary-os': 'elementary OS',
  eldoraui: 'Eldora UI',
  elixir: 'Elixir',
  elm: 'Elm',
  endeavouros: 'EndeavourOS',
  erlang: 'Erlang',
  'falling-sand': 'Falling Sand',
  fedora: 'Fedora',
  'ferris-wheel': 'Ferris Wheel',
  'file-tree': 'File Tree',
  'flow-field': 'Flow Field',
  'form-controls': 'Form Controls',
  'fractal-tree': 'Fractal Tree',
  gentoo: 'Gentoo',
  glxgears: 'glxgears',
  go: 'Go',
  greptile: 'Greptile',
  'hawa-mahal': 'Hawa Mahal',
  haskell: 'Haskell',
  heartbeat: 'Heartbeat',
  heatmap: 'Heatmap',
  helixdb: 'HelixDB',
  helmcode: 'Helmcode',
  'hilbert-curve': 'Hilbert Curve',
  html: 'HTML',
  'icosahedron': 'Icosahedron',
  java: 'Java',
  javascript: 'JavaScript',
  julia: 'Julia',
  'kali-linux': 'Kali Linux',
  keiki: 'Keiki',
  kite: 'Kite',
  kotlin: 'Kotlin',
  'kyoto-dusk': 'Kyoto Dusk',
  'langtons-ant': "Langton's Ant",
  'lava-lamp': 'Lava Lamp',
  'linux-mint': 'Linux Mint',
  lua: 'Lua',
  manjaro: 'Manjaro',
  mandelbrot: 'Mandelbrot',
  'matrix-rain': 'Matrix Rain',
  mintlify: 'Mintlify',
  'mobius-strip': 'Möbius Strip',
  nixos: 'NixOS',
  ocaml: 'OCaml',
  omarchy: 'Omarchy',
  opensuse: 'openSUSE',
  orchid: 'Orchid',
  php: 'PHP',
  'planet-scale': 'PlanetScale',
  'pop-os': 'Pop!_OS',
  planet: 'Planet',
  planetscale: 'PlanetScale',
  playstation: 'PlayStation',
  polar: 'Polar',
  'progress-bar': 'Progress Bar',
  python: 'Python',
  r: 'R',
  'reaction-diffusion': 'Reaction Diffusion',
  'red-hat': 'Red Hat',
  'rocky-linux': 'Rocky Linux',
  'rule-30': 'Rule 30',
  ruby: 'Ruby',
  rust: 'Rust',
  saptarishi: 'Saptarishi',
  scala: 'Scala',
  sierpinski: 'Sierpiński',
  'split-flap': 'Split Flap',
  supabase: 'Supabase',
  supermemory: 'Supermemory',
  svelte: 'Svelte',
  swift: 'Swift',
  'three-body': 'Three-Body',
  typescript: 'TypeScript',
  tux: 'Tux',
  ubuntu: 'Ubuntu',
  'uptime-bar': 'Uptime Bar',
  vercel: 'Vercel',
  'void-linux': 'Void Linux',
  'wave-text': 'Wave Text',
  zig: 'Zig',
  'zorin-os': 'Zorin OS',
}

const SORT_OVERRIDES = {
  c: 0,
  cpp: 1,
  csharp: 2,
  css: 3,
  html: 4,
  java: 5,
  javascript: 6,
  typescript: 7,
  python: 8,
  go: 9,
  rust: 10,
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function metaOf(fileName) {
  const source = fs.readFileSync(path.join(piecesDir, fileName), 'utf8')
  const block = source.match(/export\s+const\s+meta\s*=\s*\{([\s\S]*?)\};/)
  if (!block) throw new Error(`no meta block in ${fileName}`)
  const body = block[1]
  const string = (key) => {
    const m = body.match(new RegExp(`${key}\\s*:\\s*("(?:[^"\\\\]|\\\\.)*")`))
    return m ? JSON.parse(m[1]) : undefined
  }
  const number = (key) => {
    const m = body.match(new RegExp(`${key}\\s*:\\s*([0-9.]+)`))
    return m ? Number(m[1]) : undefined
  }
  return {
    name: string('name'),
    category: string('category'),
    note: string('note'),
    cols: number('cols') || 80,
    rows: number('rows') || 24,
    fps: number('fps') || 30,
    cell: number('cell') || 2,
    palette: /\bpalette\s*:/.test(body),
    still: number('still') || 0,
  }
}

function displayName(slug) {
  if (NAME_OVERRIDES[slug]) return NAME_OVERRIDES[slug]
  return slug
    .split('-')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
}

function sentence(text) {
  const value = String(text || '').trim()
  if (!value) return ''
  const capital = value[0].toUpperCase() + value.slice(1)
  return capital.endsWith('.') ? capital : `${capital}.`
}

const files = fs
  .readdirSync(piecesDir)
  .filter((file) => file.endsWith('.js'))
  .sort()

const pieces = files.map((file) => {
  const slug = file.replace(/\.js$/, '')
  return { slug, ...metaOf(file) }
})

const entries = pieces
  .sort((a, b) => {
    const order = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
    if (order !== 0) return order
    const sa = SORT_OVERRIDES[a.slug]
    const sb = SORT_OVERRIDES[b.slug]
    if (sa !== undefined || sb !== undefined) return (sa ?? 999) - (sb ?? 999) || a.slug.localeCompare(b.slug)
    return a.slug.localeCompare(b.slug)
  })
  .map((piece) => {
    const id = `${PROJECT_ID}-${piece.slug}`
    const name = displayName(piece.slug)
    const phrase = CATEGORY_PHRASE[piece.category] || 'ASCII art piece'
    const style = ['ascii-art', 'animated', piece.category, piece.palette ? 'canvas' : 'text']
    const techStack = piece.palette
      ? ['JavaScript', 'Web Components', 'Canvas API']
      : ['JavaScript', 'Web Components']
    const description = `${sentence(piece.note)} An animated ${phrase} from ascii.rest — one <ascii-art> tag, no build step, MIT licensed.`
    const code = [
      '<script type="module" src="/ascii-rest/ascii-art.js"></script>',
      `<style>ascii-art{display:block;font-size:calc((100vw - 48px) / ${piece.cols} / 0.6);line-height:1.05}</style>`,
      `<ascii-art piece="${piece.slug}"></ascii-art>`,
    ].join('\n')
    return {
      id,
      project: PROJECT_ID,
      name,
      category: CATEGORY,
      style,
      techStack,
      description,
      language: 'html',
      demoUrl: `https://ascii.rest/${piece.slug}/`,
      // Renderer hints for the ASCII showcase (not part of the shared ComponentEntry contract).
      cols: piece.cols,
      rows: piece.rows,
      fps: piece.fps,
      cell: piece.cell,
      pieceCategory: piece.category,
      palette: piece.palette,
      codeSnippet: { language: 'html', source: code },
    }
  })

const summaries = entries.map(({ id, project, name, category, style, techStack, description, language }) => ({
  id,
  project,
  name,
  category,
  style,
  techStack,
  description,
  language,
}))

writeJson(path.join(dataDir, `${PROJECT_ID}.json`), entries)
console.log(`wrote ${entries.length} ascii.rest entries`)

// ── index.json: replace this project's slice, keep everything else ──────────
const index = readJson(path.join(dataDir, 'index.json'))
const components = (index.components || [])
  .filter((component) => component.project !== PROJECT_ID)
  .map((component) => {
    if (component.project !== 'ascii-sharks') return component
    return {
      ...component,
      category: CATEGORY,
      style: component.style.map((item) => (item === 'official-demo' ? 'ascii' : item)),
    }
  })

const merged = [...components, ...summaries]
const stats = {}
for (const component of merged) {
  stats[component.project] = (stats[component.project] || 0) + 1
}

writeJson(path.join(dataDir, 'index.json'), {
  ...index,
  projects: [...new Set([...(index.projects || []).filter((id) => id !== PROJECT_ID), PROJECT_ID])],
  stats,
  total: merged.length,
  components: merged,
})
console.log(`index.json now holds ${merged.length} components (ascii category ${merged.filter((c) => c.category === 'ascii').length})`)

// ── ascii-sharks.json: same category as ascii.rest ──────────────────────────
const sharksFile = path.join(dataDir, 'ascii-sharks.json')
const sharks = readJson(sharksFile)
const retagged = sharks.map((entry) => ({
  ...entry,
  category: CATEGORY,
  style: entry.style.map((item) => (item === 'official-demo' ? 'ascii' : item)),
}))
writeJson(sharksFile, retagged)
console.log(`ascii-sharks.json: ${retagged.length} entries moved to the ${CATEGORY} category`)
