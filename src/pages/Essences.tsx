
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  SlidersHorizontal,
  X,
  Skull,
  Flame,
  CalendarDays,
  UserRoundCheck,
  Eye,
  ArrowUpDown,
  ScrollText,
} from 'lucide-react'

type EssenceNature = 'Demônio' | 'Diabo'

type EssenceStatus =
  | 'Registrado'
  | 'Contratado'
  | 'Subjugado'
  | 'Erradicado'

interface Essence {
  id: string
  name: string
  titles: string[]
  trueName?: string
  nature: EssenceNature
  hierarchy: string
  status: EssenceStatus
  imageUrl?: string
  registrationDate: string
  createdAt: number
  description: string
}

const demoEssences: Essence[] = [
  {
    id: '1',
    name: 'Vrock',
    titles: ['Demônio Abutre'],
    nature: 'Demônio',
    hierarchy: 'Tanar’ri',
    status: 'Subjugado',
    registrationDate: '12/11/2026',
    createdAt: 4,
    description:
      'Uma criatura demoníaca alada, conhecida por sua aparência grotesca e natureza violenta.',
  },
  {
    id: '2',
    name: 'Imp',
    titles: ['Pequeno Tentador'],
    trueName: 'Quasithel',
    nature: 'Diabo',
    hierarchy: 'Nono escalão infernal',
    status: 'Contratado',
    registrationDate: '10/11/2026',
    createdAt: 3,
    description:
      'Uma pequena entidade infernal especializada em espionagem, tentação e manipulação.',
  },
  {
    id: '3',
    name: 'Barlgura',
    titles: ['A Fúria do Abismo'],
    nature: 'Demônio',
    hierarchy: 'Tanar’ri',
    status: 'Registrado',
    registrationDate: '08/11/2026',
    createdAt: 2,
    description:
      'Um poderoso demônio semelhante a um grande símio, movido por violência e destruição.',
  },
  {
    id: '4',
    name: 'Erinyes',
    titles: ['Executora Infernal'],
    trueName: 'Astrael',
    nature: 'Diabo',
    hierarchy: 'Nona Casa dos Infernos',
    status: 'Erradicado',
    registrationDate: '05/11/2026',
    createdAt: 1,
    description:
      'Uma entidade infernal cuja aparência majestosa esconde uma natureza implacável.',
  },
]

type SortOption = 'newest' | 'oldest' | 'az' | 'za'

const statusStyles: Record<EssenceStatus, string> = {
  Registrado: 'border-[#52525B] bg-[#27272A] text-[#D4D4D8]',
  Contratado: 'border-[#7F1D1D] bg-[#350D12] text-[#FCA5A5]',
  Subjugado: 'border-[#6B21A8] bg-[#24103B] text-[#D8B4FE]',
  Erradicado: 'border-[#3F3F46] bg-[#18181B] text-[#71717A]',
}

function AppIcon({ nature }: { nature: EssenceNature }) {
  if (nature === 'Demônio') {
    return <Skull size={17} className="text-[#C084FC]" />
  }

  return <Flame size={17} className="text-[#F87171]" />
}

export default function Essences() {
  const [essences] = useState<Essence[]>(demoEssences)

  const [search, setSearch] = useState('')
  const [natureFilter, setNatureFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [trueNameFilter, setTrueNameFilter] = useState('Todos')
  const [sort, setSort] = useState<SortOption>('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedEssence, setSelectedEssence] =
    useState<Essence | null>(null)

  useEffect(() => {
    if (!selectedEssence) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedEssence(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEssence])

  const filteredEssences = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()

    const result = essences.filter((essence) => {
      const searchableText = [
        essence.name,
        ...essence.titles,
        essence.trueName ?? '',
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = searchableText.includes(normalizedSearch)

      const matchesNature =
        natureFilter === 'Todas' || essence.nature === natureFilter

      const matchesStatus =
        statusFilter === 'Todos' || essence.status === statusFilter

      const matchesTrueName =
        trueNameFilter === 'Todos' ||
        (trueNameFilter === 'Sim' && Boolean(essence.trueName)) ||
        (trueNameFilter === 'Não' && !essence.trueName)

      return (
        matchesSearch &&
        matchesNature &&
        matchesStatus &&
        matchesTrueName
      )
    })

    return result.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.createdAt - b.createdAt
        case 'az':
          return a.name.localeCompare(b.name)
        case 'za':
          return b.name.localeCompare(a.name)
        default:
          return b.createdAt - a.createdAt
      }
    })
  }, [essences, search, natureFilter, statusFilter, trueNameFilter, sort])

  const clearFilters = () => {
    setSearch('')
    setNatureFilter('Todas')
    setStatusFilter('Todos')
    setTrueNameFilter('Todos')
    setSort('newest')
  }

  const activeFilters =
    natureFilter !== 'Todas' ||
    statusFilter !== 'Todos' ||
    trueNameFilter !== 'Todos'

  return (
    <section>
      {/* TÍTULO */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#A1A1AA]">
          <Skull size={15} />
          <span>Biblioteca de entidades</span>
        </div>

        <h1 className="font-serif text-3xl text-white md:text-4xl">
          Registro de Essências
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
          Um catálogo de criaturas cujas essências foram preservadas
          nas páginas deste grimório.
        </p>

        <div className="mt-6 h-px w-full bg-gradient-to-r from-[#71717A] via-[#3F3F46] to-transparent" />
      </div>

      {/* RESUMO */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-serif text-xl text-[#E4E4E7]">
            Essências catalogadas
          </p>

          <p className="mt-1 text-xs text-[#71717A]">
            {filteredEssences.length} resultado(s) encontrado(s)
          </p>
        </div>

        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-2 text-[#C084FC]">
            <Skull size={15} />
            {essences.filter((e) => e.nature === 'Demônio').length} Demônios
          </span>

          <span className="flex items-center gap-2 text-[#F87171]">
            <Flame size={15} />
            {essences.filter((e) => e.nature === 'Diabo').length} Diabos
          </span>
        </div>
      </div>

      {/* PESQUISA E CONTROLES */}
      <div className="mb-5 rounded-lg border border-[#27272A] bg-[#111113] p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-3">
            <Search size={18} className="shrink-0 text-[#71717A]" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome, título ou nome verdadeiro..."
              className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-[#71717A]"
            />

            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-[#71717A] hover:text-white"
                aria-label="Limpar pesquisa"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm transition ${
              filtersOpen || activeFilters
                ? 'border-[#71717A] bg-[#27272A] text-white'
                : 'border-[#3F3F46] text-[#A1A1AA] hover:bg-[#27272A]'
            }`}
          >
            <SlidersHorizontal size={17} />
            Filtros
            {activeFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-black">
                !
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-md border border-[#3F3F46] px-3">
            <ArrowUpDown size={16} className="text-[#71717A]" />

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="min-w-0 bg-transparent py-3 text-sm text-[#D4D4D8] outline-none"
              aria-label="Ordenar essências"
            >
              <option value="newest" className="bg-[#18181B]">
                Mais recentes
              </option>
              <option value="oldest" className="bg-[#18181B]">
                Mais antigas
              </option>
              <option value="az" className="bg-[#18181B]">
                Nome: A–Z
              </option>
              <option value="za" className="bg-[#18181B]">
                Nome: Z–A
              </option>
            </select>
          </div>
        </div>

        {/* FILTROS */}
        {filtersOpen && (
          <div className="mt-4 grid gap-4 border-t border-[#27272A] pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs text-[#A1A1AA]">
                Natureza
              </label>

              <select
                value={natureFilter}
                onChange={(event) => setNatureFilter(event.target.value)}
                className="w-full rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-3 text-sm text-white outline-none"
              >
                <option>Todas</option>
                <option>Demônio</option>
                <option>Diabo</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-[#A1A1AA]">
                Estado
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-3 text-sm text-white outline-none"
              >
                <option>Todos</option>
                <option>Registrado</option>
                <option>Contratado</option>
                <option>Subjugado</option>
                <option>Erradicado</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-[#A1A1AA]">
                Possui nome verdadeiro?
              </label>

              <select
                value={trueNameFilter}
                onChange={(event) => setTrueNameFilter(event.target.value)}
                className="w-full rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-3 text-sm text-white outline-none"
              >
                <option>Todos</option>
                <option>Sim</option>
                <option>Não</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <button
                onClick={clearFilters}
                className="text-xs text-[#A1A1AA] underline decoration-[#52525B] underline-offset-4 transition hover:text-white"
              >
                Limpar todos os filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LISTAGEM DESKTOP */}
      <div className="hidden overflow-hidden rounded-lg border border-[#27272A] bg-[#111113] md:block">
        <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] gap-4 border-b border-[#27272A] bg-[#18181B] px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-[#71717A]">
          <span>Identidade</span>
          <span>Natureza</span>
          <span>Nome verdadeiro</span>
          <span>Estado</span>
          <span>Ação</span>
        </div>

        {filteredEssences.map((essence) => (
          <div
            key={essence.id}
            className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto] items-center gap-4 border-b border-[#27272A] px-5 py-4 last:border-0 transition hover:bg-[#18181B]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#F4F4F5]">
                {essence.name}
              </p>

              <p className="mt-1 truncate text-xs text-[#71717A]">
                {essence.titles.join(' · ') || 'Sem títulos registrados'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <AppIcon nature={essence.nature} />
              <span
                className={
                  essence.nature === 'Demônio'
                    ? 'text-xs text-[#C084FC]'
                    : 'text-xs text-[#F87171]'
                }
              >
                {essence.nature}
              </span>
            </div>

            <span className="text-xs text-[#A1A1AA]">
              {essence.trueName ? 'Sim' : 'Não'}
            </span>

            <span
              className={`w-fit rounded-full border px-2.5 py-1 text-[10px] ${statusStyles[essence.status]}`}
            >
              {essence.status}
            </span>

            <button
              onClick={() => setSelectedEssence(essence)}
              className="text-[#A1A1AA] transition hover:text-white"
              aria-label={`Ver ${essence.name}`}
            >
              <Eye size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* LISTAGEM MOBILE */}
      <div className="space-y-3 md:hidden">
        {filteredEssences.map((essence) => (
          <button
            key={essence.id}
            onClick={() => setSelectedEssence(essence)}
            className="w-full rounded-lg border border-[#27272A] bg-[#111113] p-4 text-left transition hover:bg-[#18181B]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-white">{essence.name}</p>

                <p className="mt-1 text-xs text-[#71717A]">
                  {essence.titles.join(' · ')}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] ${statusStyles[essence.status]}`}
              >
                {essence.status}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`flex items-center gap-2 text-xs ${
                  essence.nature === 'Demônio'
                    ? 'text-[#C084FC]'
                    : 'text-[#F87171]'
                }`}
              >
                <AppIcon nature={essence.nature} />
                {essence.nature}
              </span>

              <span className="text-xs text-[#71717A]">
                {essence.trueName ? 'Nome verdadeiro registrado' : 'Sem nome verdadeiro'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* RESULTADO VAZIO */}
      {filteredEssences.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[#3F3F46] bg-[#111113] px-6 text-center">
          <ScrollText size={28} className="mb-4 text-[#52525B]" />

          <p className="text-sm text-[#E4E4E7]">
            Nenhuma essência encontrada.
          </p>

          <p className="mt-2 text-xs text-[#71717A]">
            Experimente alterar sua pesquisa ou os filtros selecionados.
          </p>

          <button
            onClick={clearFilters}
            className="mt-4 text-xs text-[#D4D4D8] underline underline-offset-4 hover:text-white"
          >
            Limpar pesquisa e filtros
          </button>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {selectedEssence && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedEssence(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="essence-modal-title"
            className="relative my-auto w-full max-w-xl overflow-hidden rounded-xl border border-[#3F3F46] bg-[#111113] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`flex h-40 items-center justify-center ${
                selectedEssence.nature === 'Demônio'
                  ? 'bg-gradient-to-br from-[#24103B] to-[#09090B]'
                  : 'bg-gradient-to-br from-[#350D12] to-[#09090B]'
              }`}
            >
              <AppIcon nature={selectedEssence.nature} />
              {selectedEssence.imageUrl && (
                <img
                  src={selectedEssence.imageUrl}
                  alt={selectedEssence.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <button
              onClick={() => setSelectedEssence(null)}
              className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white transition hover:bg-black"
              aria-label="Fechar detalhes"
            >
              <X size={19} />
            </button>

            <div className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 text-xs ${
                    selectedEssence.nature === 'Demônio'
                      ? 'text-[#C084FC]'
                      : 'text-[#F87171]'
                  }`}
                >
                  <AppIcon nature={selectedEssence.nature} />
                  {selectedEssence.nature}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] ${statusStyles[selectedEssence.status]}`}
                >
                  {selectedEssence.status}
                </span>
              </div>

              <h2
                id="essence-modal-title"
                className="font-serif text-2xl text-white"
              >
                {selectedEssence.name}
              </h2>

              <p className="mt-1 text-sm text-[#A1A1AA]">
                {selectedEssence.titles.join(' · ') || 'Sem títulos registrados'}
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#71717A]">
                    Nome verdadeiro
                  </p>
                  <p className="mt-1 text-sm text-[#E4E4E7]">
                    {selectedEssence.trueName || 'Desconhecido'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#71717A]">
                    Hierarquia
                  </p>
                  <p className="mt-1 text-sm text-[#E4E4E7]">
                    {selectedEssence.hierarchy || 'Não registrada'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#71717A]">
                    Descrição
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#A1A1AA]">
                    {selectedEssence.description || 'Sem descrição registrada.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 border-t border-[#27272A] pt-4 text-xs text-[#71717A]">
                  <CalendarDays size={15} />
                  Registro: {selectedEssence.registrationDate}
                </div>
              </div>

              <button
                onClick={() => setSelectedEssence(null)}
                className="mt-6 w-full rounded-md border border-[#52525B] bg-[#27272A] py-3 text-sm text-white transition hover:bg-[#3F3F46]"
              >
                Fechar registro
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
