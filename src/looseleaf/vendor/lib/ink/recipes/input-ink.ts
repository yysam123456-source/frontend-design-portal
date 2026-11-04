// @ts-nocheck
import { defineRecipe } from '../../ink/recipes'
import { drawFieldFrame } from '../../ink/recipes/field-frame-ink'

export interface InputParams {
  disabled?: boolean
  invalid?: boolean
  readOnly?: boolean
}

export const inputRecipe = defineRecipe<InputParams>({
  id: 'input',
  kind: 'field',
  layers: ['rest', 'hover', 'focus', 'invalid', 'disabled'],
  lazy: ['focus', 'hover'],
  pad: 12,
  draw(ink, box, params, ctx) {
    drawFieldFrame(ink, box, params, ctx)
  },
})
