'use client'

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

const PRESETS = [
  '#111111',
  '#5c5c5c',
  '#9ca3af',
  '#f7f7f5',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#9d174d',
  '#4a3428',
  '#c4a574',
]

function toHex6(value: unknown) {
  const raw = String(value || '').trim()
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return '#111111'
}

const ColorPicker: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  const hex = toHex6(value)

  return (
    <div className="field-type kap-color-field">
      <FieldLabel label={field.label} path={path} />
      <div className="kap-color-field__row">
        <label className="kap-color-field__picker" title="Abrir paleta de colores">
          <input
            type="color"
            value={hex}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Elegir color"
          />
        </label>
        <div className="kap-color-field__swatches" role="list">
          {PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={`Color ${color}`}
              className={`kap-color-field__swatch${hex === color ? ' is-selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setValue(color)}
            />
          ))}
        </div>
      </div>
      <FieldDescription path={path} description={field.admin?.description} />
    </div>
  )
}

export default ColorPicker
