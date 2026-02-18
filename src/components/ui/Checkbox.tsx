import React from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Checkbox({
  label,
  error,
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex items-start">
      <div className="flex items-center h-11">
        <input
          id={checkboxId}
          type="checkbox"
          className={`w-5 h-5 rounded border-glass-border bg-glass-bg text-accent-cyan focus:ring-accent-cyan focus:ring-2 checked:shadow-glow-cyan ${className}`}
          {...props}
        />
      </div>
      {label && (
        <div className="ml-3">
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
          {error && (
            <p className="mt-1 text-sm text-accent-pink">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
