import { useEffect, useState, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './looseleaf.css'
import './preview.css'
import { looseleafExamples } from './registry'

type ExampleComponent = ComponentType

function Preview() {
  const [slug] = useState(() => new URLSearchParams(location.search).get('s') || 'button')
  const [Example, setExample] = useState<ExampleComponent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loader = looseleafExamples[`./examples/${slug}.tsx`]
    if (!loader) {
      setError(`Unknown Looseleaf example: ${slug}`)
      return
    }
    let mounted = true
    loader()
      .then((mod) => {
        if (mounted) setExample(() => mod.default)
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      mounted = false
    }
  }, [slug])

  if (error) {
    return (
      <div data-ll-scope className="ll-stage">
        <p className="ll-stage-error">{error}</p>
      </div>
    )
  }

  return (
    <div data-ll-scope data-density="comfortable" className="ll-stage">
      <div className="ll-demo">{Example ? <Example /> : null}</div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
