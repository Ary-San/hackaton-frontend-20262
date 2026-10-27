import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { toApiError } from '../api/client'
import { useAuth } from '../auth/authContext'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { splitApiError, type FormErrors } from '../lib/formErrors'

const FIELDS = ['email', 'password'] as const
type LoginField = (typeof FIELDS)[number]

const NO_ERRORS: FormErrors<LoginField> = { fieldErrors: {}, formError: null }

export default function LoginPage() {
  const { login, endReason } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState(NO_ERRORS)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setErrors(NO_ERRORS)
    try {
      // Si sale bien, GuestRoute ve la sesión y redirige a la ruta guardada.
      await login(email, password)
    } catch (err) {
      setErrors(splitApiError(toApiError(err), FIELDS))
      setSubmitting(false)
    }
  }

  function clearField(field: LoginField) {
    setErrors((prev) => ({ ...prev, fieldErrors: { ...prev.fieldErrors, [field]: undefined } }))
  }

  return (
    <AuthCard title="Iniciar sesión">
      {endReason === 'expired' && !errors.formError && (
        <p role="status" className="mb-4 rounded-lg bg-amber-950/60 p-3 text-sm text-amber-200">
          Tu sesión ya no es válida. Inicia sesión de nuevo.
        </p>
      )}
      {errors.formError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-950/60 p-3 text-sm text-red-200">
          {errors.formError}
        </p>
      )}
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Field
          name="email"
          label="Email de la tripulación"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.fieldErrors.email}
          onChange={(v) => {
            setEmail(v)
            clearField('email')
          }}
        />
        <Field
          name="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.fieldErrors.password}
          onChange={(v) => {
            setPassword(v)
            clearField('password')
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-amber-500 py-2 font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Tripulación nueva?{' '}
        <Link to="/register" state={location.state} className="font-medium text-amber-400 hover:underline">
          Registrarla
        </Link>
      </p>
    </AuthCard>
  )
}
