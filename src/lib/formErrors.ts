import type { ApiError } from '../api/client'

export interface FormErrors<F extends string> {
  fieldErrors: Partial<Record<F, string>>
  formError: string | null
}

// Reparte el error del servidor: lo que corresponde a un campo va junto a ese campo, el resto arriba del formulario.
export function splitApiError<F extends string>(
  err: ApiError,
  fields: readonly F[],
  fieldByCode: Partial<Record<string, F>> = {},
): FormErrors<F> {
  const fieldErrors: Partial<Record<F, string>> = {}
  const codeField = fieldByCode[err.code]
  if (codeField) {
    fieldErrors[codeField] = err.message
    return { fieldErrors, formError: null }
  }

  let formError: string | null = null
  for (const detail of err.details) {
    const name = detail.field.split('.').pop()
    const field = fields.find((f) => f === name)
    if (field) fieldErrors[field] ??= detail.message
    else formError = detail.message
  }
  if (Object.keys(fieldErrors).length === 0 && formError === null) formError = err.message
  return { fieldErrors, formError }
}
