// @ts-nocheck

import type { ArtDef } from '../../../ink/art/types'
import { nature } from '../../../ink/art/doodles/nature'
import { things } from '../../../ink/art/doodles/things'
import { marks } from '../../../ink/art/doodles/marks'

export const doodleBatches = { nature, things, marks } as const
export const doodles = { ...nature, ...things, ...marks } satisfies Record<string, ArtDef>
export type DoodleName = keyof typeof doodles
