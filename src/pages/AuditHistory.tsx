
import { useMemo, useState } from 'react'
import {
  ScrollText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  X,
} from 'lucide-react'

import { getAuditLogs } from '../lib/auditLogStorage'
import type {
  AuditLog,
  AuditAction,
  AuditEntityType,
} from '../types/auditLog'

const entityTypes: AuditEntityType[] = [
  'Essência',
  'Contrato',
  'Subjugação',
  'Configuração',
]

const actions: AuditAction[] = [
  'Criado',
  'Editado',
  'Excluído',
  'Ativado',
  'Desativado',
  'Descoberta alterada',
  'Vitalidade alterada',
  'Nível alterado',
]

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActionColor(action: AuditAction) {
  switch (action) {
    case 'Criado':
    case 'Ativado':
    case 'Descoberta alterada':
    case 'Vitalidade alterada':
    case 'Nível alterado':
      return 'border-[#49266B] bg-[#2A173A] text-[#C084FC]'

    case 'Excluído':
    case 'Desativado':
      return 'border-[#632329] bg-[#351418] text-[#F87171]'

    case 'Editado':
      return 'border-[#52525B] bg-[#27272A] text-[#D4D4D8]'

    default:
      return 'border-[#52525B] bg-[#27272A] text-[#D4D4D8]'
  }
}

function formatData(data: unknown) {
  if (data === undefined || data === null) {
    return 'Nenhum dado registrado.'
  }

  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return 'Não foi possível exibir os dados.'
  }
}

function DataPanel({
  title,
  data,
}: {
  title: string
  data: unknown
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#3F3F46] bg-[#09090B] p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
        {title}
      </h4>

      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[#D4D4D8]">
        {formatData(data)}
      </pre>
    </div>
  )
}

export default function AuditHistory() {
  const [logs] = useState<AuditLog[]>(() =>
    getAuditLogs().sort((a, b) => b.createdAt - a.createdAt),
  )

  const [search, setSearch] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    return logs.filter((log) => {
      const matchesSearch =
        normalizedSearch === '' ||
        log.entityName.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
        log.description.toLocaleLowerCase('pt-BR').includes(normalizedSearch)

      const matchesEntity =
        selectedEntity === '' || log.entityType === selectedEntity

      const matchesAction =
        selectedAction === '' || log.action === selectedAction

      return matchesSearch && matchesEntity && matchesAction
    })
  }, [logs, search, selectedEntity, selectedAction])

  const clearFilters = () => {
    setSearch('')
    setSelectedEntity('')
    setSelectedAction('')
    setExpandedId(null)
  }

  const hasFilters =
    search !== '' ||
    selectedEntity !== '' ||
    selectedAction !== ''

  return (
    <>
      {/* Cabeçalho */}
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#A1A1AA]">
          <History size={15} />
          <span>Arquivo de registros administrativos</span>
        </div>

        <h1 className="font-serif text-3xl text-white md:text-4xl">
          Histórico Administrativo
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
          Cada alteração deixa uma marca. Consulte os registros de
          criação, modificação e movimentação das essências,
          contratos e criaturas subjugadas.
        </p>

        <div className="mt-6 h-px w-full bg-gradient-to-r from-[#71717A] via-[#3F3F46] to-transparent" />
      </div>

      {/* Indicador */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#3F3F46] bg-[#18181B] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#A1A1AA]">
              Registros encontrados
            </p>

            <ScrollText size={18} className="text-[#A1A1AA]" />
          </div>

          <p className="mt-3 font-serif text-3xl text-white">
            {filteredLogs.length}
          </p>
        </div>

        <div className="rounded-lg border border-[#3F3F46] bg-[#18181B] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#A1A1AA]">
              Total de registros
            </p>

            <History size={18} className="text-[#A1A1AA]" />
          </div>

          <p className="mt-3 font-serif text-3xl text-white">
            {logs.length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <section className="mb-6 rounded-lg border border-[#3F3F46] bg-[#18181B] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-[#A1A1AA]" />

          <h2 className="font-serif text-base text-[#E4E4E7]">
            Filtrar registros
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label
              htmlFor="audit-search"
              className="mb-2 block text-xs text-[#A1A1AA]"
            >
              Buscar
            </label>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]"
              />

              <input
                id="audit-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome ou descrição..."
                className="w-full rounded border border-[#3F3F46] bg-[#09090B] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-[#52525B] focus:border-[#9333EA]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="audit-entity"
              className="mb-2 block text-xs text-[#A1A1AA]"
            >
              Categoria
            </label>

            <select
              id="audit-entity"
              value={selectedEntity}
              onChange={(event) => setSelectedEntity(event.target.value)}
              className="w-full rounded border border-[#3F3F46] bg-[#09090B] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#9333EA]"
            >
              <option value="">Todas as categorias</option>

              {entityTypes.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="audit-action"
              className="mb-2 block text-xs text-[#A1A1AA]"
            >
              Ação
            </label>

            <select
              id="audit-action"
              value={selectedAction}
              onChange={(event) => setSelectedAction(event.target.value)}
              className="w-full rounded border border-[#3F3F46] bg-[#09090B] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#9333EA]"
            >
              <option value="">Todas as ações</option>

              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 text-xs text-[#A1A1AA] transition hover:text-white"
            >
              <X size={14} />
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {/* Linha do tempo */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-lg text-[#E4E4E7]">
            Linha do tempo
          </h2>

          <span className="text-[10px] uppercase tracking-widest text-[#71717A]">
            Mais recentes primeiro
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-[#3F3F46] bg-[#18181B] px-6 text-center">
            <ScrollText size={30} className="mb-4 text-[#52525B]" />

            <p className="text-sm text-[#D4D4D8]">
              Nenhum registro encontrado.
            </p>

            <p className="mt-2 max-w-sm text-xs leading-5 text-[#71717A]">
              {logs.length === 0
                ? 'As atividades administrativas aparecerão aqui conforme forem registradas.'
                : 'Tente modificar os filtros ou a pesquisa para encontrar outros registros.'}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded border border-[#52525B] px-4 py-2 text-xs text-[#D4D4D8] transition hover:border-[#A1A1AA] hover:text-white"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id

              return (
                <article
                  key={log.id}
                  className="overflow-hidden rounded-lg border border-[#3F3F46] bg-[#18181B] transition hover:border-[#52525B]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : log.id)
                    }
                    aria-expanded={isExpanded}
                    className="flex w-full items-start gap-4 p-5 text-left"
                  >
                    <div className="mt-1 shrink-0">
                      <ScrollText
                        size={19}
                        className="text-[#A1A1AA]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>

                        <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
                          {log.entityType}
                        </span>
                      </div>

                      <h3 className="truncate text-sm font-medium text-[#F4F4F5]">
                        {log.entityName}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">
                        {log.description}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-[10px] text-[#71717A]">
                        <Clock size={12} />
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-1 shrink-0 text-[#71717A]">
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#3F3F46] bg-[#111113] p-5">
                      <div className="mb-4">
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                          Identificação do registro
                        </h4>

                        <p className="break-all font-mono text-[10px] text-[#71717A]">
                          {log.id}
                        </p>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <DataPanel
                          title="Dados anteriores"
                          data={log.oldData}
                        />

                        <DataPanel
                          title="Dados posteriores"
                          data={log.newData}
                        />
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
