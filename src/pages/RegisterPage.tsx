import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { toApiError } from '../api/client'
import { useAuth } from '../auth/authContext'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { splitApiError, type FormErrors } from '../lib/formErrors'

const FIELDS = ['teamName', 'email', 'password'] as const
type RegisterField = (typeof FIELDS)[number]

const FIELD_BY_CODE: Partial<Record<string, RegisterField>> = {
  EMAIL_ALREADY_REGISTERED: 'email',
  TEAM_NAME_TAKEN: 'teamName',
}

const NO_ERRORS: FormErrors<RegisterField> = { fieldErrors: {}, formError: null }

export default function RegisterPage() {
  const { register } = useAuth()
  const location = useLocation()
  const [teamName, setTeamName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState(NO_ERRORS)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setErrors(NO_ERRORS)
    try {
      // El registro devuelve el token: la sesión queda iniciada y GuestRoute redirige.
      await register(teamName, email, password)
    } catch (err) {
      setErrors(splitApiError(toApiError(err), FIELDS, FIELD_BY_CODE))
      setSubmitting(false)
    }
  }

  function clearField(field: RegisterField) {
    setErrors((prev) => ({ ...prev, fieldErrors: { ...prev.fieldErrors, [field]: undefined } }))
  }

  return (
    <AuthCard title="Registrar tripulación">
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
          name="teamName"
          label="Nombre de la tripulación"
          autoComplete="organization"
          value={teamName}
          error={errors.fieldErrors.teamName}
          onChange={(v) => {
            setTeamName(v)
            clearField('teamName')
          }}
        />
        <Field
          name="email"
          label="Email"
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
          label="Contraseña (8 a 72 caracteres)"
          type="password"
          autoComplete="new-password"
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
          {submitting ? 'Registrando…' : 'Registrar y zarpar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienen cuenta?{' '}
        <Link to="/login" state={location.state} className="font-medium text-amber-400 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </AuthCard>
  )
}
