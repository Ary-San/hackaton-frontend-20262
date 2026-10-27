interface FieldProps {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
}

export function Field({ name, label, value, onChange, error, type = 'text', autoComplete }: FieldProps) {
  const errorId = `${name}-error`
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-amber-400 ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
