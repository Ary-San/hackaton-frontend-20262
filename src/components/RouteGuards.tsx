import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/authContext'
import { Spinner } from './States'

export function PrivateRoute() {
  const { status, endReason } = useAuth()
  const location = useLocation()

  if (status === 'checking' || status === 'error') return <SessionGate />
  if (status === 'anonymous') {
    // Tras un logout voluntario no hay "a dónde volver"; tras entrar sin sesión o una sesión vencida, sí.
    if (endReason === 'logout') return <Navigate to="/login" replace />
    const from = location.pathname + location.search + location.hash
    return <Navigate to="/login" replace state={{ from }} />
  }
  return <Outlet />
}

export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking' || status === 'error') return <SessionGate />
  if (status === 'authenticated') return <Navigate to={redirectTarget(location.state)} replace />
  return <Outlet />
}

// Solo rutas internas: evita que un state manipulado mande al usuario a otro sitio.
function redirectTarget(state: unknown): string {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from.startsWith('/') &&
    !state.from.startsWith('//')
  ) {
    return state.from
  }
  return '/dashboard'
}

function SessionGate() {
  const { status, retryRestore, logout } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {status === 'checking' ? (
        <div role="status" className="flex items-center gap-3 text-slate-300">
          <Spinner />
          <span>Verificando sesión…</span>
        </div>
      ) : (
        <div role="alert" className="max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
          <p className="font-semibold text-slate-100">No pudimos verificar tu sesión.</p>
          <p className="mt-1 text-sm text-slate-400">El servidor no respondió. Tu sesión sigue guardada.</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={retryRestore}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
