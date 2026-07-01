import { useEffect, useMemo, useState } from 'react'
import type { ComponentEntry, ComponentSummary, ProjectMeta } from '../types'

const projectCache = new Map<string, Promise<ComponentEntry[]>>()

function loadProjectComponents(project: string) {
  if (!projectCache.has(project)) {
    projectCache.set(
      project,
      fetch(`/data/${project}.json`).then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${project}`)
        return res.json()
      })
    )
  }
  return projectCache.get(project)!
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtmlPreview(source: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; min-height: 100%; }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 22px;
      background:
        radial-gradient(circle at top left, rgba(99,102,241,.12), transparent 30%),
        linear-gradient(135deg, #fbfbfb, #f1f5f9);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
      transform: scale(.86);
      transform-origin: center;
    }
  </style>
</head>
<body>${source}</body>
</html>`
}

function buildFallbackPreview(component: ComponentSummary, projectMeta?: ProjectMeta) {
  const accent = projectMeta?.accentColor || '#6366f1'
  const tags = [...(component.style || []), ...(component.techStack || [])].slice(0, 4)
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; }
    body {
      height: 100vh;
      display: grid;
      place-items: center;
      padding: 18px;
      background:
        radial-gradient(circle at 20% 20%, ${accent}28, transparent 30%),
        radial-gradient(circle at 80% 80%, ${accent}18, transparent 28%),
        linear-gradient(135deg, #0f172a, #111827);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #fff;
      overflow: hidden;
    }
    .card {
      width: min(88%, 320px);
      min-height: 116px;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 18px;
      background: rgba(255,255,255,.08);
      box-shadow: 0 24px 80px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12);
      backdrop-filter: blur(14px);
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      animation: float 3.4s ease-in-out infinite;
    }
    .dot { width: 10px; height: 10px; border-radius: 999px; background: ${accent}; box-shadow: 0 0 24px ${accent}; }
    .top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: rgba(255,255,255,.62); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    h1 { margin: 0; font-size: 21px; line-height: 1.08; letter-spacing: -.04em; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 14px; }
    .tag { padding: 4px 7px; border-radius: 999px; background: rgba(255,255,255,.1); color: rgba(255,255,255,.72); font-size: 10px; }
    @keyframes float { 0%, 100% { transform: translateY(4px) scale(1); } 50% { transform: translateY(-4px) scale(1.015); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="top"><span class="dot"></span>${escapeHtml(projectMeta?.name || component.project)}</div>
    <h1>${escapeHtml(component.name)}</h1>
    <div class="tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
  </div>
</body>
</html>`
}

interface ComponentThumbnailPreviewProps {
  component: ComponentSummary
  projectMeta?: ProjectMeta
}

export default function ComponentThumbnailPreview({
  component,
  projectMeta,
}: ComponentThumbnailPreviewProps) {
  const [source, setSource] = useState<string | null>(null)
  const [language, setLanguage] = useState(component.language)

  useEffect(() => {
    let mounted = true
    if (component.language !== 'html') {
      setSource(null)
      setLanguage(component.language)
      return () => {
        mounted = false
      }
    }

    loadProjectComponents(component.project)
      .then((items) => {
        if (!mounted) return
        const full = items.find((item) => item.id === component.id)
        setSource(full?.codeSnippet.source || null)
        setLanguage(full?.codeSnippet.language || component.language)
      })
      .catch(() => {
        if (mounted) setSource(null)
      })

    return () => {
      mounted = false
    }
  }, [component.id, component.language, component.project])

  const srcDoc = useMemo(() => {
    if (language === 'html' && source) return buildHtmlPreview(source)
    return buildFallbackPreview(component, projectMeta)
  }, [component, language, projectMeta, source])

  return (
    <iframe
      srcDoc={srcDoc}
      title={`${component.name} 预览`}
      loading="lazy"
      sandbox="allow-scripts"
      className="absolute inset-0 w-full h-full border-0 pointer-events-none bg-white"
    />
  )
}
