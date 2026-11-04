// @ts-nocheck

import type { ArtDef } from '../../../ink/art/types'
import { emptyScenes } from '../../../ink/art/scenes/empty-scenes'

export const sceneBatches = { emptyScenes } as const
export const scenes = { ...emptyScenes } satisfies Record<string, ArtDef>
export type SceneName = keyof typeof scenes
