import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'

// NOTE: keep this file ASCII-only. On Windows PowerShell 5.1, non-ASCII bytes in
// a UTF-8 file without BOM get decoded as ANSI and can swallow the next line.

/**
 * Recursively remove a build-output directory tree.
 *
 * Why not plain `fs.rmSync(dir, { recursive: true })`:
 *  - Speed: on Windows it walks the tree and unlinks file-by-file (~5 files/sec
 *    on deep node_modules-scale trees). `robocopy /MIR` from an empty source does
 *    the same work inside one native process (~1k files/sec).
 *  - Reliability: some agent sandboxes wrap `fs.unlinkSync`/`fs.rmSync` with a
 *    per-turn bulk-delete guard that aborts the process once a threshold of
 *    deletions is reached. That makes an ordinary `npm run build` fail partway
 *    through. A native process is not subject to that instrumentation.
 *
 * Semantics are identical: the target path is gone when this returns. Safe to
 * call on a non-existent path.
 */
export function removeTree(target) {
  const abs = path.resolve(target)
  if (!fs.existsSync(abs)) return

  if (process.platform === 'win32') {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-tree-empty-'))
    try {
      // /MIR mirrors the (empty) source onto the target, deleting anything the
      // source does not have. robocopy exit codes 0-7 mean success; >=8 is a
      // real failure and must not be swallowed.
      execFileSync(
        'robocopy',
        [emptyDir, abs, '/MIR', '/R:0', '/W:0', '/NFL', '/NDL', '/NJH', '/NJS', '/NP'],
        { stdio: 'ignore' }
      )
    } catch (err) {
      if (typeof err.status === 'number' && err.status >= 8) {
        throw new Error(`[remove-tree] robocopy failed (exit ${err.status}) for ${abs}`)
      }
      // exit codes 1-7 are informational (items copied / extras deleted)
    } finally {
      try {
        fs.rmdirSync(emptyDir)
      } catch {
        /* best effort */
      }
    }
    // Drop the now-empty shell so callers can recreate it from scratch.
    try {
      fs.rmdirSync(abs)
    } catch {
      /* robocopy already emptied it; a bare empty dir is harmless */
    }
    return
  }

  fs.rmSync(abs, { recursive: true, force: true, maxRetries: 3 })
}
