
import { useState } from 'react'
import {
  BookOpen,
  Skull,
  FileText,
  Flame,
  Shield,
  X,
  History,
  Database,
  ChevronDown,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  mobileMenuOpen: boolean
  onClose: () => void
}

const navigation = [
  { label: 'Painel Principal', path: '/', icon: BookOpen },
  { label: 'Registro de Essências', path: '/essencias', icon: Skull },
  { label: 'Contratos Infernais', path: '/contratos', icon: FileText },
  { label: 'Ritual de Subjugação', path: '/subjugacao', icon: Flame },
]

const adminNavigation = [
  { label: 'Histórico Administrativo', path: '/historico', icon: History },
  { label: 'Backup', path: '/backup', icon: Database },
]

export default function Sidebar({
  mobileMenuOpen,
  onClose,
}: SidebarProps) {
  const location = useLocation()
  const { isAdmin } = useAuth()

  const isAdminRoute = adminNavigation.some(
    (item) => item.path === location.pathname,
  )

  const [adminExpanded, setAdminExpanded] = useState<boolean | null>(null)

  const isAdminExpanded = adminExpanded ?? isAdminRoute

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[270px] max-w-[85vw] flex-col overflow-hidden border-r border-[#27272A] bg-[#111113] transition-transform duration-300 lg:w-[270px] lg:max-w-none lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Identidade */}
        <div className="relative flex shrink-0 flex-col items-center justify-center border-b border-[#27272A] px-4 py-7 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#52525B] bg-[#18181B]">
            <BookOpen size={25} className="text-[#D4D4D8]" />
          </div>

          <h1 className="whitespace-nowrap font-serif text-[15px] font-semibold tracking-[0.12em] text-[#F4F4F5]">
            MALEFICONOMICON
          </h1>

          <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-[#71717A]">
            Grimório de Essências
          </p>

          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[#A1A1AA] transition hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegação com rolagem independente */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Biblioteca pública */}
          <div className="px-4 pt-8">
          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#71717A]">
            Biblioteca
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-sm transition ${
                      isActive
                        ? 'border-[#52525B] bg-[#27272A] text-white'
                        : 'border-transparent text-[#A1A1AA] hover:bg-[#1F1F23] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={
                          isActive ? 'text-white' : 'text-[#71717A]'
                        }
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
          </div>
        </div>

        {/* Área administrativa: somente administradores */}
        {isAdmin && (
          <div className="mt-auto border-t border-[#27272A] p-5">
            <button
              type="button"
              onClick={() => setAdminExpanded(!isAdminExpanded)}
              aria-expanded={isAdminExpanded}
              className="flex w-full items-center gap-3 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#52525B] bg-[#27272A]">
                <Shield size={16} className="text-[#D4D4D8]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#E4E4E7]">
                  Área administrativa
                </p>

                <p className="text-xs text-[#71717A]">
                  Acesso restrito
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`shrink-0 text-[#71717A] transition-transform duration-200 ${
                  isAdminExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className={`grid transition-all duration-300 ${
                isAdminExpanded
                  ? 'mt-4 grid-rows-[1fr] opacity-100'
                  : 'mt-0 grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <nav className="space-y-1 border-l border-[#3F3F46] pl-3">
                  {adminNavigation.map((item) => {
                    const Icon = item.icon

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-xs transition ${
                            isActive
                              ? 'border-[#52525B] bg-[#27272A] text-white'
                              : 'border-transparent text-[#A1A1AA] hover:bg-[#1F1F23] hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={16}
                              className={
                                isActive ? 'text-white' : 'text-[#71717A]'
                              }
                            />

                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Fundo do menu mobile */}
      <button
        className={`fixed inset-0 z-40 bg-black/75 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen
            ? 'visible opacity-100'
            : 'invisible opacity-0'
        }`}
        onClick={onClose}
        aria-label="Fechar menu"
      />
    </>
  )
}
