import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text: string
  id: string
  copiedId: string | null
  onCopy: (text: string, id: string) => void
}

export default function CopyButton({ text, id, copiedId, onCopy }: CopyButtonProps) {
  const isCopied = copiedId === id

  return (
    <button
      onClick={() => onCopy(text, id)}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-bg-secondary hover:bg-border-light text-ink-muted hover:text-ink"
      title="复制代码"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCopied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-accent"
          >
            <Check className="w-3.5 h-3.5" />
            已复制
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            复制代码
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
