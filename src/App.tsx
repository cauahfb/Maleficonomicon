
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './components/layout/MainLayout'
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute'

import Dashboard from './pages/Dashboard'
import Essences from './pages/Essences'
import Contracts from './pages/Contracts'
import Subjugations from './pages/Subjugations'
import Backup from './pages/Backup'
import AuditHistory from './pages/AuditHistory'
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Biblioteca pública */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/essencias" element={<Essences />} />
            <Route path="/contratos" element={<Contracts />} />
            <Route path="/subjugacao" element={<Subjugations />} />

            {/* Área administrativa protegida */}
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/backup" element={<Backup />} />
              <Route path="/historico" element={<AuditHistory />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
