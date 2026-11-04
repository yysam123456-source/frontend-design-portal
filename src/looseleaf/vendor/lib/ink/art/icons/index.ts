// @ts-nocheck

import type { ArtDef } from '../../../ink/art/types'
import { arrows } from '../../../ink/art/icons/arrows'
import { marks } from '../../../ink/art/icons/marks'
import { status } from '../../../ink/art/icons/status'
import { layout } from '../../../ink/art/icons/layout'
import { files } from '../../../ink/art/icons/files'
import { comms } from '../../../ink/art/icons/comms'
import { devData } from '../../../ink/art/icons/dev-data'
import { textNatureMisc } from '../../../ink/art/icons/text-nature-misc'
import { media } from '../../../ink/art/icons/media'
import { commerceTime } from '../../../ink/art/icons/commerce-time'

export const iconBatches = { arrows, marks, status, layout, files, comms, devData, textNatureMisc, media, commerceTime } as const
export const icons = { ...arrows, ...marks, ...status, ...layout, ...files, ...comms, ...devData, ...textNatureMisc, ...media, ...commerceTime } satisfies Record<string, ArtDef>
export type IconName = keyof typeof icons
export * from '../../../ink/art/icons/aliases'
