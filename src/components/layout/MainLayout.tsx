
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-dvh overflow-hidden bg-[#09090B] text-[#F4F4F5]">
      <div className="flex h-full min-h-0">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <main className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain lg:ml-[270px]">
          <Header
            onOpenMenu={() => setMobileMenuOpen(true)}
          />

          <div className="mx-auto min-h-[calc(100vh-128px)] max-w-[1500px] p-5 md:p-10">
            <Outlet />
          </div>

          <footer className="mx-auto max-w-[1500px] border-t border-[#27272A] px-5 py-5 md:px-10">
            <div className="flex flex-col justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-[#71717A] sm:flex-row">
              <span>Maleficonomicon · Registro de Essências</span>
              <span>Conhecimento tem seu preço.</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
