import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Code2 } from 'lucide-react'
import CopyButton from './CopyButton'
import type { ComponentEntry } from '../types'

interface CodeDrawerProps {
  component: ComponentEntry
  copiedId: string | null
  onCopy: (text: string, id: string) => void
}

export default function CodeDrawer({ component, copiedId, onCopy }: CodeDrawerProps) {
  const [open, setOpen] = useState(false)
  const codeId = `${component.id}-code`
  const hasCode = !!component.codeSnippet

  if (!hasCode) return null

  const { language, source } = component.codeSnippet!

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors"
      >
        <Code2 className="w-3.5 h-3.5" />
        <span>查看代码</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-border bg-bg-secondary overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-tertiary">
                <span className="text-xs font-mono text-ink-subtle">{language}</span>
                <CopyButton text={source} id={codeId} copiedId={copiedId} onCopy={onCopy} />
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-ink-secondary max-h-80 overflow-y-auto">
                <code>{source}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
