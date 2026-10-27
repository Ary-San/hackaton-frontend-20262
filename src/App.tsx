import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { GuestRoute, PrivateRoute } from './components/RouteGuards'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NewsDetailModal from './pages/NewsDetailModal'
import NewsFeedPage from './pages/NewsFeedPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'
import WantedDetailPage from './pages/WantedDetailPage'
import WantedListPage from './pages/WantedListPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wanted" element={<WantedListPage />} />
          <Route path="/wanted/:id" element={<WantedDetailPage />} />
          {/* El detalle va anidado: el feed sigue montado debajo y conserva lo cargado y su scroll. */}
          <Route path="/news" element={<NewsFeedPage />}>
            <Route path=":id" element={<NewsDetailModal />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
