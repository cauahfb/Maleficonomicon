
import { Bell, Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'

interface HeaderProps {
  onOpenMenu: () => void
}

const pageTitles: Record<string, string> = {
  '/': 'Painel Principal',
  '/essencias': 'Registro de Essências',
  '/contratos': 'Contratos Infernais',
  '/subjugacao': 'Ritual de Subjugação',
  '/backup': 'Backup',
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const location = useLocation()
  const activeTitle = pageTitles[location.pathname] ?? 'Maleficonomicon'

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

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-md border border-[#27272A] bg-[#09090B] px-3 py-2 md:flex">
          <Search size={16} className="text-[#71717A]" />
          <span className="text-xs text-[#71717A]">
            Pesquisar no grimório...
          </span>
        </div>

        <button
          className="text-[#A1A1AA] transition hover:text-white"
          aria-label="Notificações"
        >
          <Bell size={19} />
        </button>
      </div>
    </header>
  )
}
