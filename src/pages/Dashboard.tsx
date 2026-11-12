
import {
  ScrollText,
  Skull,
  Flame,
  FileText,
  Shield,
  Activity,
} from 'lucide-react'

const indicators = [
  {
    label: 'Demônios registrados',
    value: '—',
    description: 'Essências demoníacas',
    icon: Skull,
    color: 'purple',
  },
  {
    label: 'Diabos registrados',
    value: '—',
    description: 'Essências infernais',
    icon: Flame,
    color: 'red',
  },
  {
    label: 'Contratos ativos',
    value: '—',
    description: 'Atualmente em vigor',
    icon: FileText,
    color: 'red',
  },
  {
    label: 'Demônios subjugados',
    value: '—',
    description: 'Sob seu domínio',
    icon: Shield,
    color: 'purple',
  },
]

export default function Dashboard() {
  return (
    <>
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#A1A1AA]">
          <ScrollText size={15} />
          <span>Registro de conhecimentos proibidos</span>
        </div>

        <h1 className="font-serif text-3xl text-white md:text-4xl">
          Painel Principal
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
          Toda essência possui um nome. Todo nome carrega um poder.
          Todo poder exige um preço.
        </p>

        <div className="mt-6 h-px w-full bg-gradient-to-r from-[#71717A] via-[#3F3F46] to-transparent" />
      </div>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-serif text-lg text-[#E4E4E7]">
            Registro de Essências
          </h3>

          <span className="text-[10px] uppercase tracking-widest text-[#71717A]">
            Visão geral
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicators.map((item) => {
            const Icon = item.icon
            const isPurple = item.color === 'purple'

            return (
              <div
                key={item.label}
                className={`rounded-lg border p-5 transition ${
                  isPurple
                    ? 'border-[#49266B] bg-[#17101F] hover:border-[#9333EA]'
                    : 'border-[#632329] bg-[#1F1012] hover:border-[#DC2626]'
                }`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-xs text-[#D4D4D8]">
                    {item.label}
                  </p>

                  <Icon
                    size={19}
                    className={
                      isPurple ? 'text-[#A855F7]' : 'text-[#EF4444]'
                    }
                  />
                </div>

                <p className="font-serif text-3xl text-white">
                  {item.value}
                </p>

                <p className="mt-2 text-xs text-[#A1A1AA]">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-[#632329] bg-[#171012] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Shield size={19} className="text-[#EF4444]" />

            <h3 className="font-serif text-lg text-[#F4F4F5]">
              Controle de Contratos
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-[#A1A1AA]">
                Contratos firmados máximos
              </p>
              <p className="mt-2 font-serif text-2xl text-white">—</p>
            </div>

            <div>
              <p className="text-xs text-[#A1A1AA]">
                Contratos ativos permitidos
              </p>
              <p className="mt-2 font-serif text-2xl text-white">—</p>
            </div>
          </div>

          <div className="mt-6 border-t border-[#3F2024] pt-4">
            <p className="text-xs text-[#A1A1AA]">
              Nível atual de Dahlia: não configurado
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[#3F3F46] bg-[#18181B] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Activity size={19} className="text-[#D4D4D8]" />

            <h3 className="font-serif text-lg text-[#F4F4F5]">
              Atividade Recente
            </h3>
          </div>

          <div className="flex min-h-24 flex-col items-center justify-center text-center">
            <ScrollText size={24} className="mb-3 text-[#52525B]" />

            <p className="text-sm text-[#D4D4D8]">
              Nenhum registro de atividade.
            </p>

            <p className="mt-1 text-xs text-[#71717A]">
              As alterações futuras aparecerão aqui.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
