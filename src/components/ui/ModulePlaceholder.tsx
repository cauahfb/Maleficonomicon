
import { ScrollText, ChevronRight } from 'lucide-react'

interface ModulePlaceholderProps {
  title: string
  description: string
}

export default function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <section>
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#A1A1AA]">
          <ScrollText size={15} />
          <span>Biblioteca do Maleficonomicon</span>
        </div>

        <h1 className="font-serif text-3xl text-white md:text-4xl">
          {title}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
          {description}
        </p>

        <div className="mt-6 h-px w-full bg-gradient-to-r from-[#71717A] via-[#3F3F46] to-transparent" />
      </div>

      <div className="flex min-h-[350px] flex-col items-center justify-center rounded-lg border border-dashed border-[#3F3F46] bg-[#111113] px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#52525B] bg-[#18181B]">
          <ScrollText size={28} className="text-[#A1A1AA]" />
        </div>

        <h2 className="font-serif text-xl text-[#E4E4E7]">
          Este capítulo ainda não foi escrito.
        </h2>

        <p className="mt-3 max-w-md text-sm leading-6 text-[#71717A]">
          Este módulo está reservado e será implementado nas próximas
          etapas do desenvolvimento do Maleficonomicon.
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[#A1A1AA]">
          Em desenvolvimento
          <ChevronRight size={14} />
        </div>
      </div>
    </section>
  )
}
