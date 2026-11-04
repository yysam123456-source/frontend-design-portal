// @ts-nocheck

import type { StickerDef } from '../../../ink/art/types'
import { statusPointers } from '../../../ink/art/stickers/status-pointers'
import { spaceWeather } from '../../../ink/art/stickers/space-weather'
import { foodDrink } from '../../../ink/art/stickers/food-drink'
import { officeDesk } from '../../../ink/art/stickers/office-desk'
import { natureAnimals } from '../../../ink/art/stickers/nature-animals'
import { facesCelebrate } from '../../../ink/art/stickers/faces-celebrate'
import { badgesStamps } from '../../../ink/art/stickers/badges-stamps'

export const stickerBatches = { statusPointers, spaceWeather, foodDrink, officeDesk, natureAnimals, facesCelebrate, badgesStamps } as const
export const stickers = { ...statusPointers, ...spaceWeather, ...foodDrink, ...officeDesk, ...natureAnimals, ...facesCelebrate, ...badgesStamps } satisfies Record<string, StickerDef>
export type StickerName = keyof typeof stickers
