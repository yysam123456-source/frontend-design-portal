export interface ProjectMeta {
  id: string;
  name: string;
  github: string;
  demoBaseUrl: string;
  description: string;
  logo?: string;
  accentColor: string;
  tags: string[];
  techStack: string[];
  category: 'animation' | 'ui-library' | 'effect' | 'tool';
}

export interface ComponentEntry {
  id: string;
  project: string;
  name: string;
  category: string;
  style: string[];
  techStack: string[];
  description: string;
  demoUrl: string;
  codeSnippet?: {
    language: string;
    source: string;
    dependencies?: string[];
  };
  previewImage?: string;
}

export interface FilterState {
  search: string;
  techStack: string[];
  style: string[];
  category: string[];
}
