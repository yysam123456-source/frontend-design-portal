import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react'
import type { ComponentEntry } from '../types'

interface SandboxPreviewProps {
  component: ComponentEntry | null
}

const TAILWIND_SETUP = `
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
`

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; }
</style>
</head>
<body>
<div id="root"></div>
</body>
</html>`

const STYLES_CSS = `/* component styles */`

const UTILS_TS = `
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`

function prepareSource(source: string): { code: string; hasCn: boolean } {
  let code = source

  // Remove local path imports (will be replaced with mocks)
  const hasCn = code.includes('cn') && code.includes('@/lib/utils')

  // Replace @/lib/utils with local path
  code = code.replace(/from\s+['"]@\/lib\/utils['"]/g, `from "./lib/utils"`)

  // Remove CSS/LESS/SCSS imports
  code = code.replace(/import\s+['"][^'"]+\.(css|less|scss|sass)['"];?\s*\n?/g, '')

  // Remove other @/ imports that we can't mock
  code = code.replace(
    /import\s+(?:type\s+)?(?:\{[^}]*\}|\w+(?:\s*,\s*\{[^}]*\})?)\s+from\s+['"]@[^'"]+['"];?\s*\n?/g,
    ''
  )

  // Remove relative CSS imports
  code = code.replace(/import\s+['"][.][^'"]+\.(css|less|scss|sass)['"];?\s*\n?/g, '')

  // Remove "use client" / "use server"
  code = code.replace(/["']use\s+(client|server)["'];?\s*\n?/g, '')

  return { code, hasCn }
}

function buildDependencies(deps: string[]): Record<string, string> {
  const result: Record<string, string> = {
    react: '^18.0.0',
    'react-dom': '^18.0.0',
    clsx: '^2.0.0',
    'tailwind-merge': '^2.0.0',
  }

  const knownVersions: Record<string, string> = {
    'framer-motion': '^11.0.0',
    'lucide-react': '^0.400.0',
    classnames: '^2.3.2',
    'class-variance-authority': '^0.7.0',
  }

  for (const dep of deps) {
    const pkg = dep.split('/')[0]!
    if (pkg === 'react' || pkg === 'react-dom') continue
    if (knownVersions[pkg]) {
      result[pkg] = knownVersions[pkg]!
    } else {
      result[pkg] = 'latest'
    }
  }

  return result
}

export default function SandboxPreview({ component }: SandboxPreviewProps) {
  if (!component) {
    return (
      <div className="w-full aspect-[16/10] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
        <p className="text-sm text-ink-muted">Select a component to preview</p>
      </div>
    )
  }

  const isTsx = component.codeSnippet.language === 'tsx'
  const { code, hasCn } = prepareSource(component.codeSnippet.source)

  const files: Record<string, string> = {
    '/index.html': INDEX_HTML,
    '/src/index.tsx': TAILWIND_SETUP,
    '/src/App.tsx': code,
    '/src/styles.css': STYLES_CSS,
  }

  if (hasCn) {
    files['/src/lib/utils.ts'] = UTILS_TS
  }

  const dependencies = buildDependencies(component.codeSnippet.dependencies)

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden bg-bg-secondary">
      <div className="px-3 py-2 border-b border-border bg-bg">
        <span className="text-xs text-ink-subtle font-medium">Sandpack Live Preview</span>
      </div>
      <div className="relative w-full" style={{ height: 360 }}>
        <SandpackProvider
          template={isTsx ? 'react-ts' : 'react'}
          files={files}
          customSetup={{
            dependencies,
          }}
          options={{
            recompileMode: 'delayed',
            recompileDelay: 500,
          }}
        >
          <SandpackPreview
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            showRefreshButton={false}
            showOpenInCodeSandbox={false}
          />
        </SandpackProvider>
      </div>
    </div>
  )
}
