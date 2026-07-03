import fs from 'fs'
import path from 'path'

const rootDir = process.cwd()
const dataDir = path.join(rootDir, 'public', 'data')
const hanPattern = /[\u4e00-\u9fff]/
const hanBlockPattern = /[\u4e00-\u9fff]+/g

function cleanName(value = 'Component') {
  return String(value).replace(/Code/gi, '').trim() || 'Component'
}

function englishDescription(item) {
  const name = cleanName(item.name || item.id)
  const category = String(item.category || 'UI').replace(/-/g, ' ')
  const project = String(item.project || 'the source project').replace(/-/g, ' ')
  return `${name} ${category} component from ${project}.`
}

function cleanString(value) {
  return String(value)
    .replace(hanBlockPattern, 'demo')
    .replace(/：/g, ': ')
    .replace(/，/g, ', ')
    .replace(/。/g, '. ')
    .replace(/（/g, ' (')
    .replace(/）/g, ') ')
    .replace(/[《》]/g, '')
}

function walk(value) {
  if (Array.isArray(value)) return value.map(walk)
  if (value && typeof value === 'object') {
    if (hanPattern.test(String(value.description || ''))) {
      value.description = englishDescription(value)
    }
    for (const key of Object.keys(value)) {
      value[key] = walk(value[key])
    }
    return value
  }
  if (typeof value === 'string' && hanPattern.test(value)) return cleanString(value)
  return value
}

for (const fileName of fs.readdirSync(dataDir)) {
  if (!fileName.endsWith('.json')) continue
  const filePath = path.join(dataDir, fileName)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const cleaned = walk(data)
  fs.writeFileSync(filePath, `${JSON.stringify(cleaned, null, 2)}\n`, 'utf-8')
}

console.log('normalized public data text to English')
