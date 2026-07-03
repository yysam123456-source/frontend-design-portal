import fs from 'fs'
import path from 'path'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')

function removeEntry(targetPath) {
  if (!fs.existsSync(targetPath)) return
  const stat = fs.lstatSync(targetPath)
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    for (const entry of fs.readdirSync(targetPath)) {
      removeEntry(path.join(targetPath, entry))
    }
    fs.rmdirSync(targetPath)
    return
  }
  fs.chmodSync(targetPath, 0o666)
  fs.unlinkSync(targetPath)
}

removeEntry(distDir)
