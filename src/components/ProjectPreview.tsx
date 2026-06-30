import { motion } from 'framer-motion'
import { ExternalLink, Terminal } from 'lucide-react'
import LivePreview from './LivePreview'
import type { ProjectMeta } from '../types'

interface ProjectPreviewProps {
  project: ProjectMeta
}

const fallbackProjects = new Set(['react-bits', 'animejs', 'eldoraui', 'animata'])

export default function ProjectPreview({ project }: ProjectPreviewProps) {
  if (!fallbackProjects.has(project.id)) {
    return <LivePreview url={project.demoBaseUrl} title={`${project.name} Demo`} />
  }

  return (
    <div className="relative w-full aspect-[16/10] bg-ink text-white rounded-lg overflow-hidden border border-border">
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,77,0,.5), transparent 30%), radial-gradient(circle at 80% 60%, rgba(255,255,255,.18), transparent 28%)',
          }}
        />
      </div>

      <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
              本地可视化预览
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold mt-1">
              {project.name}
            </h3>
          </div>
          <a
            href={project.demoBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            官方站点
          </a>
        </div>

        <PreviewBody projectId={project.id} accentColor={project.accentColor} />
      </div>
    </div>
  )
}

function PreviewBody({
  projectId,
  accentColor,
}: {
  projectId: string
  accentColor: string
}) {
  if (projectId === 'react-bits') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex gap-2">
          {'React Bits'.split('').map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              initial={{ opacity: 0, filter: 'blur(10px)', y: 14 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              className="font-display text-3xl sm:text-5xl font-bold"
              style={{ color: index % 2 === 0 ? '#fff' : accentColor }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>
        <div className="h-1 w-full bg-white/10 overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accentColor }}
            initial={{ width: '0%' }}
            animate={{ width: '78%' }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
          />
        </div>
      </div>
    )
  }

  if (projectId === 'animejs') {
    return (
      <div className="flex items-end gap-3 h-32">
        {Array.from({ length: 9 }).map((_, index) => (
          <motion.div
            key={index}
            className="w-8 rounded-md"
            style={{ backgroundColor: index % 2 ? '#fff' : accentColor }}
            animate={{
              height: [28, 104, 48, 86, 28],
              rotate: [0, 8, -8, 0],
              y: [0, -18, 0],
            }}
            transition={{
              duration: 1.8,
              delay: index * 0.08,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    )
  }

  if (projectId === 'eldoraui') {
    return (
      <div className="max-w-xl rounded-xl bg-black/50 border border-white/10 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <Terminal className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-xs text-white/50 font-mono">eldoraui terminal</span>
        </div>
        <div className="p-4 font-mono text-sm space-y-3">
          <p>
            <span style={{ color: accentColor }}>$</span> npm install eldoraui
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8 }}
            className="text-white/70"
          >
            + component registry ready_
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4 max-w-xl">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={index}
          className="h-20 rounded-xl bg-white/10 border border-white/10"
          whileHover={{ scale: 1.05, y: -6 }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            y: {
              duration: 1.8,
              repeat: Infinity,
              delay: index * 0.12,
            },
          }}
        />
      ))}
    </div>
  )
}
