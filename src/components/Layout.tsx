import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/authContext'

export function Layout() {
  const { session, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-amber-400">Log Pose Console</span>
            <nav className="flex gap-4 text-sm">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200')}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/wanted"
                className={({ isActive }) => (isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200')}
              >
                Se Busca
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {session && (
              <span className="text-slate-300">
                {session.team.name} <span className="text-slate-500">· {session.team.code}</span>
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
