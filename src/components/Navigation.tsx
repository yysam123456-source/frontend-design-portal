import { useState, useEffect } from 'react'
import { Code2, Layers } from 'lucide-react'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-6 lg:px-12 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          <span className="font-display font-semibold text-sm tracking-tight">
            Frontend Gallery
          </span>
        </a>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/yysam123456-source/frontend-design-portal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-ink transition-colors"
          >
            <Code2 className="w-4 h-4" />
          </a>
        </div>
      </div>
    </nav>
  )
}
