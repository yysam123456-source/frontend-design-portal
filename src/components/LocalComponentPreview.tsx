import { type ReactNode, useEffect, useRef, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { motion } from 'motion/react'
import { BatteryMediumIcon } from 'lucide-react'
import type { ComponentEntry } from '../types'

interface LocalComponentPreviewProps {
  component: Pick<ComponentEntry, 'id'>
  compact?: boolean
}

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ')
}

interface FAQItem {
  id: number
  question: string
  answer: string
  icon?: string
  iconPosition?: string
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: 'How late does the internet close?',
    answer: "The internet doesn't close. It's available 24/7.",
    icon: '❤️',
    iconPosition: 'right',
  },
  {
    id: 2,
    question: 'Do I need a license to browse this website?',
    answer: "No, you don't need a license to browse this website.",
  },
  {
    id: 3,
    question: 'What flavour are the cookies?',
    answer: "Our cookies are digital, not edible. They're used for website functionality.",
  },
  {
    id: 4,
    question: 'Can I get lost here?',
    answer: 'Yes, but we do have a return policy',
    icon: '⭐',
    iconPosition: 'left',
  },
  {
    id: 5,
    question: 'What if I click the wrong button?',
    answer: 'Don’t worry, you can always go back or refresh the page.',
  },
]

function FaqSection({ data }: { data: FAQItem[] }) {
  const [openItem, setOpenItem] = useState<string | null>('1')

  return (
    <div
      className="mx-auto w-full max-w-[700px] rounded-lg bg-white p-4 shadow-sm"
      style={{ minWidth: 560 }}
    >
      <div className="mb-4 text-sm text-gray-500">Every day, 9:01 AM</div>

      <Accordion.Root
        type="single"
        collapsible
        value={openItem || ''}
        onValueChange={(value) => setOpenItem(value)}
      >
        {data.map((item) => (
          <Accordion.Item value={item.id.toString()} key={item.id} className="mb-2">
            <Accordion.Header>
              <Accordion.Trigger
                className="flex w-full items-center justify-start gap-x-4 text-left"
                style={{ width: '100%' }}
              >
                <div
                  className="relative flex items-center space-x-2 rounded-xl bg-gray-100 p-2 hover:bg-[#E0F7FA]"
                  style={{
                    backgroundColor: openItem === item.id.toString() ? '#E0F7FA' : '',
                  }}
                >
                  {item.icon && (
                    <span
                      className={`absolute bottom-6 ${
                        item.iconPosition === 'right' ? 'right-0' : 'left-0'
                      }`}
                      style={{
                        transform:
                          item.iconPosition === 'right' ? 'rotate(7deg)' : 'rotate(-4deg)',
                      }}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="font-medium text-gray-700">{item.question}</span>
                </div>

                <span className="cursor-pointer text-lg font-bold text-gray-400">
                  {openItem === item.id.toString() ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="#7CB9E8"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3 10.5a.75.75 0 0 0 0-1.5H9a.75.75 0 0 0 0 1.5h6Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content asChild forceMount style={{ display: 'block' }}>
              <motion.div
                initial="collapsed"
                animate={openItem === item.id.toString() ? 'open' : 'collapsed'}
                variants={{
                  open: { opacity: 1, height: 'auto' },
                  collapsed: { opacity: 0, height: 0 },
                }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%', overflow: 'hidden' }}
              >
                <div
                  className="ml-7 mt-1 rounded-lg p-3 text-white md:ml-16"
                  style={{
                    borderRadius: '12px',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div className="relative max-w-xs rounded-2xl bg-blue-500 px-4 py-2 text-white">
                    {item.answer}
                    <div className="absolute bottom-0 right-0 h-0 w-0 border-l-[10px] border-t-[10px] border-l-transparent border-t-blue-500" />
                  </div>
                </div>
              </motion.div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  )
}

function Spinner({
  className,
  outerSize = 'h-8 w-8',
  childSize = 'h-6 w-6',
}: {
  className?: string
  outerSize?: string
  childSize?: string
}) {
  return (
    <div
      className={cn(
        'm-2 animate-spin items-center justify-center rounded-full bg-linear-to-bl from-pink-500 to-blue-600 p-0.5',
        className,
        outerSize,
      )}
    >
      <div className={cn('rounded-full bg-white', childSize)} />
    </div>
  )
}

function Battery({ className, level = 50 }: { className?: string; level?: number }) {
  const circumference = 2 * Math.PI * 40
  const gap = ((100 - level) / 100) * circumference
  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.transition = 'stroke-dashoffset 0.3s linear'
      circleRef.current.style.strokeDashoffset = String(gap)
    }
  }, [gap])

  return (
    <div
      className={cn(
        'relative flex size-52 flex-col rounded-3xl bg-linear-to-br from-sky-600/90 to-sky-400/80 p-4 font-sans shadow-md',
        className,
      )}
    >
      <div className="relative size-14 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
          <circle cx={50} cy={50} r={40} className="stroke-white/25" strokeWidth={8} fill="none" />
          <circle
            ref={circleRef}
            cx={50}
            cy={50}
            r={40}
            className="stroke-white"
            strokeWidth={8}
            fill="none"
            strokeDashoffset={circumference}
            strokeDasharray={circumference}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <BatteryMediumIcon className="text-white/90" size={22} strokeWidth={1.75} />
        </div>
      </div>

      <div className="mt-auto flex items-baseline gap-0.5 text-white">
        <span className="text-[34px] font-normal leading-none tabular-nums tracking-tight">{level}</span>
        <span className="pb-1 text-[15px] font-medium leading-none">%</span>
      </div>
    </div>
  )
}

function Blinker() {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const interval = setInterval(() => setShow((prev) => !prev), 500)
    return () => clearInterval(interval)
  }, [])
  return <span className={show ? '' : 'opacity-0'}>|</span>
}

function TypingText({
  text,
  delay = 32,
  repeat = true,
  cursor = <Blinker />,
  alwaysVisibleCount = 1,
  waitTime = 1000,
}: {
  text: string
  delay?: number
  repeat?: boolean
  cursor?: ReactNode
  alwaysVisibleCount?: number
  waitTime?: number
}) {
  const [index, setIndex] = useState(0)
  const directionRef = useRef<1 | -1>(1)
  const total = text.length

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined

    const start = () => {
      interval = setInterval(() => {
        setIndex((current) => {
          const next = current + directionRef.current
          if (directionRef.current === 1 && next >= total) {
            if (!repeat) {
              if (interval) clearInterval(interval)
              return total
            }
            if (interval) clearInterval(interval)
            timeout = setTimeout(() => {
              directionRef.current = -1
              start()
            }, waitTime)
            return total
          }
          if (directionRef.current === -1 && next <= 0) {
            if (interval) clearInterval(interval)
            timeout = setTimeout(() => {
              directionRef.current = 1
              start()
            }, waitTime)
            return 0
          }
          return next
        })
      }, delay)
    }

    start()
    return () => {
      if (interval) clearInterval(interval)
      if (timeout) clearTimeout(timeout)
    }
  }, [delay, repeat, text, total, waitTime])

  const visibleText = text.slice(0, Math.max(index, Math.min(text.length, alwaysVisibleCount)))

  return (
    <div className="relative font-mono">
      <div className="invisible">{text}</div>
      <div className="absolute inset-0 h-full w-full">
        {visibleText}
        {cursor}
      </div>
    </div>
  )
}

const shiftTabLabels = ['Issues', 'Pull Requests', 'Actions', 'Projects']

function ShiftTabsPreview() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <nav aria-label="Shift tabs" className="overflow-visible">
      <div role="tablist" className="flex flex-wrap items-center justify-center gap-4">
        {shiftTabLabels.map((label, index) => {
          const selected = activeIndex === index
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={label}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'rounded-lg transition-colors duration-200 active:scale-[0.97]',
                selected ? 'border-b-2 border-b-indigo-500 bg-slate-200' : 'bg-transparent hover:bg-slate-100',
              )}
            >
              <span
                className={cn(
                  'flex h-10 items-center justify-center rounded-md border-2 bg-white px-4 font-mono text-sm font-medium transition-transform duration-200 ease-out',
                  selected
                    ? 'rotate-0 border-indigo-500 text-indigo-600'
                    : 'origin-top-right border-slate-300 text-slate-700 hover:rotate-6',
                )}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

const LOCAL_PREVIEW_IDS = ['at-faq', 'at-spinner', 'at-typing-text', 'at-battery', 'at-shift-tabs']

export function hasLocalPreviewId(id?: string | null) {
  return Boolean(id && LOCAL_PREVIEW_IDS.includes(id))
}

export function hasLocalPreview(component: Pick<ComponentEntry, 'id'> | null) {
  return hasLocalPreviewId(component?.id)
}

function previewShell(compact: boolean | undefined, bg: string, children: ReactNode) {
  if (compact) {
    return (
      <div className={`flex h-full w-full items-center justify-center overflow-hidden ${bg}`}>
        <div style={{ transform: 'scale(0.45)', transformOrigin: 'center' }}>{children}</div>
      </div>
    )
  }

  return <div className={`flex min-h-[360px] w-full items-center justify-center overflow-auto p-8 ${bg}`}>{children}</div>
}

export default function LocalComponentPreview({ component, compact }: LocalComponentPreviewProps) {
  if (component.id === 'at-faq') {
    return previewShell(compact, 'bg-slate-100', <FaqSection data={faqData} />)
  }

  if (component.id === 'at-spinner') {
    return previewShell(
      compact,
      'bg-slate-950',
      <Spinner className="bg-linear-to-bl from-black to-blue-400" outerSize="h-16 w-16" childSize="h-12 w-12" />,
    )
  }

  if (component.id === 'at-typing-text') {
    return previewShell(
      compact,
      'bg-slate-950',
        <div className="min-w-96 max-w-96 rounded-sm bg-gray-800 px-4 py-2 text-yellow-400 shadow-lg">
          <TypingText
            text="> yarn add @animata/awesomeness"
            delay={32}
            repeat
            alwaysVisibleCount={1}
            waitTime={1000}
          />
        </div>,
    )
  }

  if (component.id === 'at-battery') {
    return previewShell(compact, 'bg-slate-100', <Battery level={50} />)
  }

  if (component.id === 'at-shift-tabs') {
    return previewShell(compact, 'bg-white', <ShiftTabsPreview />)
  }

  return (
    <div className="flex min-h-[360px] w-full items-center justify-center bg-bg-secondary">
      <p className="text-sm text-ink-muted">This component does not have a local preview adapter yet.</p>
    </div>
  )
}
