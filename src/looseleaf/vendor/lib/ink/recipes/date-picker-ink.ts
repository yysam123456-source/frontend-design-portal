// @ts-nocheck
import { defineRecipe } from '../../ink/recipes'
import { drawSelectFrame } from '../../ink/recipes/select-frame-ink'

export interface DatePickerParams {
  disabled?: boolean
  invalid?: boolean
  cell?: number
}

export const datePickerRecipe = defineRecipe<DatePickerParams>({
  id: 'date-picker',
  kind: 'field',
  layers: ['rest', 'hover', 'focus', 'open', 'invalid', 'disabled'],
  lazy: ['focus', 'hover'],
  pad: 12,
  draw(ink, box, params, ctx) {
    drawSelectFrame(ink, box, { ...params, openable: true }, ctx)
  },
})
