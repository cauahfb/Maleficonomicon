
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import MainLayout from './components/layout/MainLayout'

import Dashboard from './pages/Dashboard'
import Essences from './pages/Essences'
import Contracts from './pages/Contracts'
import Subjugations from './pages/Subjugations'
import Backup from './pages/Backup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/essencias" element={<Essences />} />
          <Route path="/contratos" element={<Contracts />} />
          <Route path="/subjugacao" element={<Subjugations />} />
          <Route path="/backup" element={<Backup />} />

          {/* Redireciona endereços desconhecidos */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
