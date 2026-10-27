import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-black text-amber-400">404</p>
      <h1 className="text-xl font-semibold">Esta isla no aparece en ningún mapa</h1>
      <p className="text-slate-400">La ruta que buscas no existe.</p>
      <Link
        to="/dashboard"
        className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-400"
      >
        Volver al dashboard
      </Link>
    </main>
  )
}
