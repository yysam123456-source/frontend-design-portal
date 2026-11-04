// @ts-nocheck

import type { ArtDef } from '../../../ink/art/types'
import { poses } from '../../../ink/art/mascots/poses'
import * as mascotBody from '../../../ink/art/mascots/body'
import * as mascotProps from '../../../ink/art/mascots/props'

export const mascotBatches = { poses } as const
export const mascot = { ...poses } satisfies Record<string, ArtDef>
export type MascotPose = keyof typeof mascot
export { mascotBody }
export { mascotProps }
