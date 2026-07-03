export type PreviewKind =
  | 'html-live'
  | 'react-generated'
  | 'js-demo'
  | 'media-video'
  | 'media-image'
  | 'screenshot'
  | 'unsupported'

export type PreviewStatus = 'ready' | 'unsupported' | 'error'

export interface PreviewManifestRecord {
  id: string
  project: string
  kind: PreviewKind
  status: PreviewStatus
  entry?: string
  media?: {
    mp4?: string
    webm?: string
    poster?: string
    label?: string
  }
  reason?: string
}
