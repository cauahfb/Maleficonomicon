
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedUserRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B]">
        <p className="text-sm text-[#A1A1AA]">
          Verificando acesso...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/acesso-restrito" replace />
  }

  return <Outlet />
}
