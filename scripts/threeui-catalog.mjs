// ThreeUI 社区目录共享解析：读取 repos/threeui/src/data/shaders.tsx 的 READY_SHADERS 数组
// 供 extract-components.mjs 与 generate-previews.mjs 复用

import fs from 'fs'
import path from 'path'

function extractBalanced(source, startIndex, open = '{', close = '}') {
  let depth = 0
  let quote = null
  let escaped = false
  for (let i = startIndex; i < source.length; i++) {
    const ch = source[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }
    if (ch === open) depth++
    if (ch === close) {
      depth--
      if (depth === 0) return source.slice(startIndex, i + 1)
    }
  }
  return null
}

function extractArrayElements(arrText) {
  const elements = []
  let i = arrText.indexOf('{', 0)
  while (i >= 0) {
    const elemText = extractBalanced(arrText, i)
    if (!elemText) break
    const inner = elemText.match(/^\s*\{\s*\.\.\.\{/)
    if (inner) {
      const innerStart = elemText.indexOf('{', elemText.indexOf('...') + 3)
      const innerObj = extractBalanced(elemText, innerStart)
      if (innerObj) elements.push(innerObj)
    } else {
      elements.push(elemText)
    }
    i = arrText.indexOf('{', i + elemText.length)
  }
  return elements
}

export function loadReadyShaders(repoRoot) {
  const shadersPath = path.join(repoRoot, 'src', 'data', 'shaders.tsx')
  if (!fs.existsSync(shadersPath)) return []
  const source = fs.readFileSync(shadersPath, 'utf8')
  const marker = 'export const READY_SHADERS: readonly ReadyShader[] = '
  const idx = source.indexOf(marker)
  if (idx < 0) return []
  const arrStart = source.indexOf('[', idx + marker.length)
  const arrText = extractBalanced(source, arrStart, '[', ']')
  if (!arrText) return []
  const elements = extractArrayElements(arrText)
  const parsed = []
  for (const text of elements) {
    try {
      parsed.push(JSON.parse(text))
    } catch {
      // skip malformed entry
    }
  }
  return parsed
}

export function categoryRouteSlug(category = '') {
  return category
    .toLowerCase()
    .replace(/\.js\b/g, '-js')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function catalogSlug(shader) {
  const id = shader.id || ''
  return id.endsWith('-hero') ? id.slice(0, -'-hero'.length) : id
}

const PORTAL_CATEGORY_MAP = {
  'Landing Pages': 'landing-page',
  Hero: 'hero',
  'Three.js': 'threejs',
  'Motion Design': 'motion-design',
  Sections: 'sections',
  Backgrounds: 'background',
  Buttons: 'button',
  'Text Animation': 'text-animation',
  'UI Elements': 'ui-element',
  CSS: 'css',
}

export function portCategory(category = '') {
  return PORTAL_CATEGORY_MAP[category] || 'threejs'
}

// 在 src/shaders 下按组件导出名定位源码文件（importName.tsx / importName.ts）
export function findShaderSource(repoRoot, importName) {
  const shadersRoot = path.join(repoRoot, 'src', 'shaders')
  if (!fs.existsSync(shadersRoot)) return null
  const queue = [shadersRoot]
  while (queue.length) {
    const dir = queue.shift()
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        queue.push(full)
      } else {
        const stem = entry.replace(/\.(tsx|ts)$/i, '')
        if (stem === importName && /\.(tsx|ts)$/i.test(entry)) return full
      }
    }
  }
  return null
}
