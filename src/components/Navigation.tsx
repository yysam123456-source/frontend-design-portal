import { useState, useEffect } from 'react'
import { Code2, Layers } from 'lucide-react'

type PageView = 'official' | 'components' | 'showcases'

interface NavigationProps {
  activePage: PageView
  onPageChange: (page: PageView) => void
}

const navItems: Array<{ id: PageView; label: string }> = [
  { id: 'official', label: 'OFFICIAL DEMOS' },
  { id: 'components', label: 'COMPONENTS' },
  { id: 'showcases', label: 'SHOWCASES' },
]

export default function Navigation({ activePage, onPageChange }: NavigationProps) {
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
        <button
          type="button"
          onClick={() => onPageChange('official')}
          className="flex items-center gap-2"
        >
          <Layers className="w-5 h-5 text-accent" />
          <span className="font-display font-semibold text-sm tracking-tight">
            Frontend Gallery
          </span>
        </button>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 rounded-full border border-border bg-bg/80 p-1 shadow-sm backdrop-blur">
            {navItems.map((item) => {
              const active = activePage === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPageChange(item.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] transition-all ${
                    active
                      ? 'bg-ink text-white shadow-sm'
                      : 'text-ink-subtle hover:bg-bg-secondary hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
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
      <div className="flex sm:hidden border-t border-border bg-bg/90 px-4 py-2 backdrop-blur">
        <div className="grid w-full grid-cols-3 gap-2">
          {navItems.map((item) => {
            const active = activePage === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPageChange(item.id)}
                className={`rounded-xl px-3 py-2 text-[11px] font-semibold tracking-[0.1em] transition-all ${
                  active
                    ? 'bg-ink text-white shadow-sm'
                    : 'border border-border bg-bg text-ink-subtle'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
