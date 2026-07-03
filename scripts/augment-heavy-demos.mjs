import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const dataDir = path.join(rootDir, 'public', 'data')
const publicAssetsDir = path.join(rootDir, 'public', 'demo-assets')

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function slugify(value) {
  return String(value)
    .replace(/\.[^.]+$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function titleize(value) {
  return slugify(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function copyAsset(sourcePath, targetRelativePath) {
  const targetPath = path.join(rootDir, 'public', targetRelativePath)
  ensureDir(path.dirname(targetPath))
  if (!fs.existsSync(targetPath) || fs.statSync(sourcePath).size !== fs.statSync(targetPath).size) {
    fs.copyFileSync(sourcePath, targetPath)
  }
  return `/${targetRelativePath.replace(/\\/g, '/')}`
}

function copyDirectory(sourceDir, targetRelativeDir) {
  const targetDir = path.join(rootDir, 'public', targetRelativeDir)
  ensureDir(targetDir)
  if (!fs.existsSync(sourceDir)) return
  for (const entry of fs.readdirSync(sourceDir)) {
    const source = path.join(sourceDir, entry)
    const targetRelative = path.join(targetRelativeDir, entry).replace(/\\/g, '/')
    if (fs.statSync(source).isDirectory()) {
      copyDirectory(source, targetRelative)
    } else {
      copyAsset(source, targetRelative)
    }
  }
}

function imageHtml({ title, src, fit = 'contain', background = '#080b12' }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 20px;
      background: ${background};
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }
    .frame {
      width: min(100%, 960px);
      height: min(100vh - 40px, 620px);
      display: grid;
      place-items: center;
      border-radius: 24px;
      overflow: hidden;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.12);
      box-shadow: 0 30px 90px rgba(0,0,0,.35);
    }
    img { width: 100%; height: 100%; object-fit: ${fit}; display: block; }
    .label {
      position: fixed;
      left: 18px;
      top: 14px;
      padding: 6px 10px;
      border-radius: 999px;
      color: white;
      background: rgba(0,0,0,.45);
      font-size: 12px;
      backdrop-filter: blur(12px);
    }
  </style>
</head>
<body>
  <div class="label">${escapeHtml(title)}</div>
  <div class="frame"><img src="${src}" alt="${escapeHtml(title)}" /></div>
</body>
</html>`
}

function videoHtml({ title, src, background = '#050816' }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 20px;
      background: ${background};
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }
    video {
      max-width: 100%;
      max-height: calc(100vh - 40px);
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,.12);
      box-shadow: 0 30px 90px rgba(0,0,0,.35);
      background: black;
    }
    .label {
      position: fixed;
      left: 18px;
      top: 14px;
      padding: 6px 10px;
      border-radius: 999px;
      color: white;
      background: rgba(0,0,0,.45);
      font-size: 12px;
      backdrop-filter: blur(12px);
    }
  </style>
</head>
<body>
  <div class="label">${escapeHtml(title)}</div>
  <video src="${src}" autoplay loop muted playsinline controls></video>
</body>
</html>`
}

function upsertComponents(projectFileName, additions) {
  const filePath = path.join(dataDir, projectFileName)
  const existing = readJson(filePath, [])
  const byId = new Map(existing.map((item) => [item.id, item]))
  for (const item of additions) byId.set(item.id, item)
  const next = Array.from(byId.values())
  writeJson(filePath, next)
  return next
}

function upsertIndex(additionsByProject) {
  const indexPath = path.join(dataDir, 'index.json')
  const index = readJson(indexPath, { projects: [], stats: {}, total: 0, components: [] })
  const additions = Object.values(additionsByProject).flat()
  const byId = new Map(index.components.map((item) => [item.id, item]))
  for (const item of additions) {
    byId.set(item.id, {
      id: item.id,
      project: item.project,
      name: item.name,
      category: item.category,
      style: item.style,
      techStack: item.techStack,
      description: item.description,
      language: item.codeSnippet.language,
    })
  }
  index.components = Array.from(byId.values())
  index.stats = index.components.reduce((acc, item) => {
    acc[item.project] = (acc[item.project] || 0) + 1
    return acc
  }, {})
  index.total = index.components.length
  writeJson(indexPath, index)
}

function buildPixel2MotionDemos() {
  const additions = []
  const gifsDir = path.join(rootDir, 'repos', 'pixel2motion', 'docs', 'gifs')
  if (fs.existsSync(gifsDir)) {
    for (const file of fs.readdirSync(gifsDir).filter((name) => name.endsWith('.gif'))) {
      const slug = slugify(file.replace(/^claude-/, ''))
      const title = `Pixel2Motion ${titleize(slug)} Motion`
      const src = copyAsset(path.join(gifsDir, file), `demo-assets/pixel2motion/gifs/${file}`)
      additions.push({
        id: `p2m-gif-${slug}`,
        project: 'pixel2motion',
        name: title,
        category: 'official-demo',
        style: ['motion', 'svg', 'showcase', 'official-demo'],
        techStack: ['HTML', 'SVG', 'GIF'],
        description: `Pixel2Motion official motion output demo: ${titleize(slug)}`,
        sourceUrl: 'https://github.com/ZeroGravitasAI/pixel2motion',
        codeSnippet: {
          language: 'html',
          source: imageHtml({ title, src, background: 'radial-gradient(circle at top, #172554, #020617 62%)' }),
          dependencies: [],
        },
      })
    }
  }

  const pixelsDir = path.join(rootDir, 'repos', 'pixel2motion', 'docs', 'pixels')
  if (fs.existsSync(pixelsDir)) {
    for (const file of fs.readdirSync(pixelsDir).filter((name) => name.endsWith('.png'))) {
      const slug = slugify(file.replace(/-pixel\.png$/, ''))
      const title = `Pixel2Motion ${titleize(slug)} Pixel Source`
      const src = copyAsset(path.join(pixelsDir, file), `demo-assets/pixel2motion/pixels/${file}`)
      additions.push({
        id: `p2m-pixel-${slug}`,
        project: 'pixel2motion',
        name: title,
        category: 'official-demo',
        style: ['pixel-art', 'source-image', 'official-demo'],
        techStack: ['PNG', 'HTML'],
        description: `Pixel2Motion official pixel input asset: ${titleize(slug)}`,
        sourceUrl: 'https://github.com/ZeroGravitasAI/pixel2motion',
        codeSnippet: {
          language: 'html',
          source: imageHtml({ title, src, fit: 'contain', background: 'linear-gradient(135deg, #111827, #1f2937)' }),
          dependencies: [],
        },
      })
    }
  }

  return additions
}

function buildZeldaShowcaseDemos() {
  const additions = []
  const showcaseDir = path.join(rootDir, 'repos', 'zelda-hyrule-ui', 'docs', 'showcase')
  if (fs.existsSync(showcaseDir)) {
    for (const file of fs.readdirSync(showcaseDir).filter((name) => /\.(png|gif|jpg|jpeg|webp)$/i.test(name))) {
      const slug = slugify(file)
      const title = `Zelda Hyrule UI ${titleize(slug)} Showcase`
      const src = copyAsset(path.join(showcaseDir, file), `demo-assets/zelda-hyrule-ui/showcase/${file}`)
      additions.push({
        id: `zh-showcase-${slug}`,
        project: 'zelda-hyrule-ui',
        name: title,
        category: 'official-showcase',
        style: ['zelda', 'game-ui', 'showcase', 'official-demo'],
        techStack: ['React', 'Less', 'HTML'],
        description: `Zelda Hyrule UI official heavy showcase: ${titleize(slug)}`,
        sourceUrl: 'https://github.com/ganeshtyjo/zelda-hyrule-ui',
        codeSnippet: {
          language: 'html',
          source: imageHtml({ title, src, background: 'radial-gradient(circle at center, #12302f, #020617 65%)' }),
          dependencies: [],
        },
      })
    }
  }

  const publicShowcaseDir = path.join(rootDir, 'repos', 'zelda-hyrule-ui', 'public', 'showcase')
  if (fs.existsSync(publicShowcaseDir)) {
    copyDirectory(publicShowcaseDir, 'demo-assets/zelda-hyrule-ui/public-showcase')
    for (const file of fs.readdirSync(publicShowcaseDir).filter((name) => /\.html$/i.test(name))) {
      const slug = slugify(file)
      const title = `Zelda Hyrule UI ${titleize(slug)} Official Page`
      const html = fs.readFileSync(path.join(publicShowcaseDir, file), 'utf-8')
        .replace(/(["'(])\/showcase\//g, '$1/demo-assets/zelda-hyrule-ui/public-showcase/')
        .replace(/(["'(])\.\/([^"'()]+\.(?:png|jpg|jpeg|gif|webp|svg))/gi, '$1/demo-assets/zelda-hyrule-ui/public-showcase/$2')
      additions.push({
        id: `zh-public-showcase-${slug}`,
        project: 'zelda-hyrule-ui',
        name: title,
        category: 'official-showcase',
        style: ['zelda', 'game-ui', 'html', 'official-demo'],
        techStack: ['HTML', 'CSS', 'PNG'],
        description: `Zelda Hyrule UI official public showcase static page: ${titleize(slug)}`,
        sourceUrl: 'https://github.com/ganeshtyjo/zelda-hyrule-ui',
        codeSnippet: {
          language: 'html',
          source: html,
          dependencies: [],
        },
      })
    }
  }
  return additions
}

function buildEldoraOfficialDemos() {
  const additions = []
  const publicDir = path.join(rootDir, 'repos', 'eldoraui', 'apps', 'www', 'public')
  for (const videoName of ['portfolio.mp4', 'dev.mp4']) {
    const source = path.join(publicDir, videoName)
    if (!fs.existsSync(source)) continue
    const slug = slugify(videoName)
    const title = `Eldora UI ${titleize(slug)} Official Video`
    const src = copyAsset(source, `demo-assets/eldoraui/videos/${videoName}`)
    additions.push({
      id: `ed-video-${slug}`,
      project: 'eldoraui',
      name: title,
      category: 'official-showcase',
      style: ['eldora', 'video', 'showcase', 'official-demo'],
      techStack: ['MP4', 'HTML'],
      description: `Eldora UI official video demo: ${titleize(slug)}`,
      sourceUrl: 'https://github.com/karthikmudunuri/eldoraui',
      codeSnippet: {
        language: 'html',
        source: videoHtml({ title, src }),
        dependencies: [],
      },
    })
  }

  const examplesDir = path.join(publicDir, 'examples')
  if (fs.existsSync(examplesDir)) {
    for (const dir of fs.readdirSync(examplesDir)) {
      const image = path.join(examplesDir, dir, 'dark.png')
      if (!fs.existsSync(image)) continue
      const slug = slugify(dir)
      const title = `Eldora UI ${titleize(slug)} Official Demo`
      const src = copyAsset(image, `demo-assets/eldoraui/examples/${dir}/dark.png`)
      additions.push({
        id: `ed-official-${slug}`,
        project: 'eldoraui',
        name: title,
        category: 'official-demo',
        style: ['eldora', 'screenshot', 'showcase', 'official-demo'],
        techStack: ['React', 'Tailwind CSS', 'PNG'],
        description: `Eldora UI official example screenshot demo: ${titleize(slug)}`,
        sourceUrl: 'https://github.com/karthikmudunuri/eldoraui',
        codeSnippet: {
          language: 'html',
          source: imageHtml({ title, src, background: 'linear-gradient(135deg, #020617, #111827)' }),
          dependencies: [],
        },
      })
    }
  }
  return additions
}

function buildReactBitsOfficialDemos() {
  const additions = []
  const videoDir = path.join(publicAssetsDir, 'react-bits', 'video')
  if (fs.existsSync(videoDir)) {
    const seenSlugs = new Set()
    for (const file of fs.readdirSync(videoDir).filter((name) => name.endsWith('.mp4'))) {
      const slug = slugify(file)
      if (seenSlugs.has(slug)) continue
      seenSlugs.add(slug)
      const title = `React Bits ${titleize(slug)} Official Demo`
      const webmFile = file.replace(/\.mp4$/i, '.webm')
      const webmExists = fs.existsSync(path.join(videoDir, webmFile))
      const srcMp4 = `/demo-assets/react-bits/video/${file}`
      const srcWebm = webmExists ? `/demo-assets/react-bits/video/${webmFile}` : undefined
      const videoSources = srcWebm
        ? `<source src="${srcWebm}" type="video/webm" /><source src="${srcMp4}" type="video/mp4" />`
        : `<source src="${srcMp4}" type="video/mp4" />`
      additions.push({
        id: `rb-official-${slug}`,
        project: 'react-bits',
        name: title,
        category: 'official-demo',
        style: ['react-bits', 'video', 'showcase', 'official-demo'],
        techStack: ['MP4', 'WebM', 'HTML'],
        description: `React Bits official video demo: ${titleize(slug)}`,
        sourceUrl: 'https://github.com/DavidHDev/react-bits',
        codeSnippet: {
          language: 'html',
          source: `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #050816; }
    body { display: grid; place-items: center; min-height: 100vh; padding: 20px; }
    video { max-width: 100%; max-height: calc(100vh - 40px); border-radius: 24px; border: 1px solid rgba(255,255,255,.12); box-shadow: 0 30px 90px rgba(0,0,0,.35); background: black; }
    .label { position: fixed; left: 18px; top: 14px; padding: 6px 10px; border-radius: 999px; color: white; background: rgba(0,0,0,.45); font-size: 12px; backdrop-filter: blur(12px); }
  </style>
</head>
<body>
  <div class="label">${escapeHtml(title)}</div>
  <video autoplay loop muted playsinline controls>${videoSources}</video>
</body>
</html>`,
          dependencies: [],
        },
      })
    }
  }
  return additions
}

function main() {
  ensureDir(publicAssetsDir)
  const additionsByProject = {
    pixel2motion: buildPixel2MotionDemos(),
    'zelda-hyrule-ui': buildZeldaShowcaseDemos(),
    eldoraui: buildEldoraOfficialDemos(),
    'react-bits': buildReactBitsOfficialDemos(),
  }

  upsertComponents('pixel2motion.json', additionsByProject.pixel2motion)
  upsertComponents('zelda-hyrule-ui.json', additionsByProject['zelda-hyrule-ui'])
  upsertComponents('eldoraui.json', additionsByProject.eldoraui)
  upsertComponents('react-bits.json', additionsByProject['react-bits'])
  upsertIndex(additionsByProject)

  console.log('=== Heavy Demo Augmentation Results ===')
  for (const [project, items] of Object.entries(additionsByProject)) {
    console.log(`  ${project}: ${items.length} official demo entries`)
  }
}

main()
