import React from 'react'
import { Input } from '@/components/ui/Input'

interface SetInputProps {
  setNumber: number
  value?: number
  onChange: (value: number | undefined) => void
  disabled?: boolean
  placeholder?: string
}

export function SetInput({ setNumber, value, onChange, disabled, placeholder }: SetInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      onChange(undefined)
    } else {
      const num = parseInt(val, 10)
      if (!isNaN(num)) {
        onChange(num)
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-text-secondary min-w-[60px]">
        Set {setNumber}:
      </label>
      <Input
        type="number"
        inputMode="numeric"
        min="0"
        max="100"
        value={value ?? ''}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder || "Reps"}
        className="text-center"
      />
    </div>
  )
}

interface SetInputGroupProps {
  sets: number
  values: {
    set1?: number
    set2?: number
    set3?: number
    set4?: number
    set5?: number
  }
  onChange: (setNumber: number, value: number | undefined) => void
  disabled?: boolean
  placeholders?: {
    set1?: string
    set2?: string
    set3?: string
    set4?: string
    set5?: string
  }
}

export function SetInputGroup({ sets, values, onChange, disabled, placeholders }: SetInputGroupProps) {
  const setNumbers = Array.from({ length: Math.min(sets, 5) }, (_, i) => i + 1)

  const getSetValue = (setNum: number): number | undefined => {
    switch (setNum) {
      case 1:
        return values.set1
      case 2:
        return values.set2
      case 3:
        return values.set3
      case 4:
        return values.set4
      case 5:
        return values.set5
      default:
        return undefined
    }
  }

  const getPlaceholder = (setNum: number): string | undefined => {
    if (!placeholders) return undefined
    switch (setNum) {
      case 1: return placeholders.set1
      case 2: return placeholders.set2
      case 3: return placeholders.set3
      case 4: return placeholders.set4
      case 5: return placeholders.set5
      default: return undefined
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text-primary">Actual Performance</h3>
      {setNumbers.map((setNum) => (
        <SetInput
          key={setNum}
          setNumber={setNum}
          value={getSetValue(setNum)}
          onChange={(value) => onChange(setNum, value)}
          disabled={disabled}
          placeholder={getPlaceholder(setNum)}
        />
      ))}
    </div>
  )
}
