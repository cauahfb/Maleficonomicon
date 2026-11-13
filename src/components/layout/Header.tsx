
import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface HeaderProps {
  onOpenMenu: () => void
}

const pageTitles: Record<string, string> = {
  '/': 'Painel Principal',
  '/essencias': 'Registro de Essências',
  '/contratos': 'Contratos Infernais',
  '/subjugacao': 'Ritual de Subjugação',
  '/backup': 'Backup',
  '/historico': 'Histórico Administrativo',
  '/login': 'Acesso Administrativo',
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, signOut } = useAuth()

  const [signingOut, setSigningOut] = useState(false)

  const activeTitle =
    pageTitles[location.pathname] ?? 'Maleficonomicon'

  async function handleSignOut() {
    setSigningOut(true)

    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="flex h-20 items-center justify-between border-b border-[#27272A] bg-[#111113] px-5 md:px-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMenu}
          className="text-[#A1A1AA] transition hover:text-white lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={23} />
        </button>

        <div>
          <p className="hidden text-xs text-[#71717A] sm:block">
            Grimório / Biblioteca
          </p>

          <h2 className="font-serif text-lg text-[#F4F4F5]">
            {activeTitle}
          </h2>
        </div>
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 rounded-md border border-[#3F3F46] px-3 py-2 text-xs text-[#A1A1AA] transition hover:border-[#71717A] hover:bg-[#27272A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut size={16} />
          <span>
            {signingOut ? 'Saindo...' : 'Sair'}
          </span>
        </button>
      )}
    </header>
  )
}
