export interface CodeSnippet {
  language: string
  source: string
  dependencies: string[]
}

export interface ComponentEntry {
  id: string
  project: string
  name: string
  category: string
  style: string[]
  techStack: string[]
  description: string
  codeSnippet: CodeSnippet
  demoUrl?: string
}

export interface ComponentSummary {
  id: string
  project: string
  name: string
  category: string
  style: string[]
  techStack: string[]
  description: string
  language: string
}

export interface ProjectMeta {
  id: string
  name: string
  github: string
  demoBaseUrl: string
  description: string
  accentColor: string
  tags: string[]
  techStack: string[]
  category: string
}

export interface FilterState {
  search: string
  projects: string[]
  techStack: string[]
  style: string[]
  category: string[]
}

export type PreviewMode = 'iframe' | 'code' | 'info'
