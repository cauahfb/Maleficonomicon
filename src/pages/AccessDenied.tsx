
import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'

export default function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090B] px-6 text-[#F4F4F5]">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-red-900/50 bg-red-950/30">
          <LockKeyhole size={34} className="text-red-500" />
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-red-500">
          Acesso restrito
        </p>

        <h1 className="font-serif text-3xl font-semibold">
          Maleficonomicon
        </h1>

        <p className="mt-5 text-sm leading-relaxed text-zinc-400">
          Você não tem acesso a este conteúdo.
          Entre em contato com o mestre da mesa para
          receber um convite de acesso.
        </p>

        <Link
          to="/login"
          className="mt-8 inline-flex items-center justify-center rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-red-800 hover:bg-red-950/30"
        >
          Já tenho acesso — Entrar
        </Link>

        <p className="mt-12 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          Conhecimento tem seu preço.
        </p>
      </div>
    </main>
  )
}
