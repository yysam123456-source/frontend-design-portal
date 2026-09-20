import path from 'path'
import { removeTree } from './lib/remove-tree.mjs'

// NOTE: keep this file ASCII-only. On Windows PowerShell 5.1, non-ASCII bytes in
// a UTF-8 file without BOM get decoded as ANSI and can swallow the next line.

removeTree(path.join(process.cwd(), 'dist'))
console.log('[clean] dist/ removed')
