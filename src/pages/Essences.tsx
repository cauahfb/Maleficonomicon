
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  Plus,
  Skull,
  Flame,
  CalendarDays,
  Eye,
  KeyRound,
  Pencil,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react'

import EssenceFormModal from '../components/ui/EssenceFormModal'
import {
  getEssences,
  saveEssences,
  deleteEssence,
} from '../lib/essenceStorage'
import { getContracts, saveContract } from '../lib/contractStorage'
import { addAuditLog } from '../lib/auditLogStorage'

import type {
  Essence,
  EssenceFormData,
  EssenceNature,
  EssenceStatus,
} from '../types/essence'
import type { AuditLogFormData } from '../types/auditLog'

// ============================================================
// ESTILOS E CONFIGURAÇÕES
// ============================================================

const statusStyles: Record<EssenceStatus, string> = {
  Registrado: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  Contratado: 'bg-red-950/60 text-red-300 border-red-900',
  Subjugado: 'bg-purple-950/60 text-purple-300 border-purple-900',
  Erradicado: 'bg-zinc-900 text-zinc-500 border-zinc-800',
}

const natureStyles: Record<EssenceNature, string> = {
  Demônio: 'text-purple-400',
  Diabo: 'text-red-400',
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Essences() {
  const [essences, setEssences] = useState<Essence[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [natureFilter, setNatureFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [trueNameFilter, setTrueNameFilter] = useState('Todos')
  const [sortOrder, setSortOrder] = useState('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [selectedEssence, setSelectedEssence] =
    useState<Essence | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingEssence, setEditingEssence] =
    useState<Essence | null>(null)

  // ==========================================================
  // CARREGAMENTO DO SUPABASE
  // ==========================================================

  useEffect(() => {
    let mounted = true

    async function loadEssences() {
      try {
        const data = await getEssences()

        if (mounted) {
          setEssences(data)
          setLoadError('')
        }
      } catch (error) {
        console.error('Erro ao carregar essências:', error)

        if (mounted) {
          setLoadError(
            'Não foi possível carregar as essências do Supabase.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadEssences()

    return () => {
      mounted = false
    }
  }, [])

  // ==========================================================
  // HISTÓRICO ADMINISTRATIVO
  // ==========================================================

  async function recordAudit(data: AuditLogFormData): Promise<void> {
    try {
      await addAuditLog(data)
    } catch (error) {
      console.error(
        'Não foi possível registrar a atividade no histórico:',
        error,
      )
    }
  }

  // ==========================================================
  // FILTRAGEM E ORDENAÇÃO
  // ==========================================================

  const filteredEssences = useMemo(() => {
    let result = [...essences]

    const normalizedSearch = search.toLowerCase().trim()

    if (normalizedSearch) {
      result = result.filter((essence) => {
        const searchableContent = [
          essence.name,
          essence.trueName ?? '',
          essence.individualTalisman ?? '',
          essence.hierarchy,
          essence.description,
          ...essence.titles,
        ]
          .join(' ')
          .toLowerCase()

        return searchableContent.includes(normalizedSearch)
      })
    }

    if (natureFilter !== 'Todas') {
      result = result.filter(
        (essence) => essence.nature === natureFilter,
      )
    }

    if (statusFilter !== 'Todos') {
      result = result.filter(
        (essence) => essence.status === statusFilter,
      )
    }

    if (trueNameFilter === 'Possui') {
      result = result.filter((essence) => Boolean(essence.trueName))
    }

    if (trueNameFilter === 'Não possui') {
      result = result.filter((essence) => !essence.trueName)
    }

    switch (sortOrder) {
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt)
        break

      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break

      case 'alphabetical-desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break

      case 'newest':
      default:
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
    }

    return result
  }, [
    essences,
    search,
    natureFilter,
    statusFilter,
    trueNameFilter,
    sortOrder,
  ])

  // ==========================================================
  // CONTADORES
  // ==========================================================

  const demonCount = essences.filter(
    (essence) => essence.nature === 'Demônio',
  ).length

  const devilCount = essences.filter(
    (essence) => essence.nature === 'Diabo',
  ).length

  // ==========================================================
  // CRIAR E EDITAR
  // ==========================================================

  async function handleSave(data: EssenceFormData) {
    if (saving || loading || loadError) return

    const savedEssence: Essence = editingEssence
      ? {
          ...editingEssence,
          ...data,
        }
      : {
          ...data,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        }

    setSaving(true)
    setOperationError('')

    try {
      // Primeiro salva no Supabase.
      await saveEssences([savedEssence])

      // Registra a atividade administrativa.
      await recordAudit({
        action: editingEssence ? 'Editado' : 'Criado',
        entityType: 'Essência',
        entityId: savedEssence.id,
        entityName: savedEssence.name,
        description: editingEssence
          ? `A essência ${savedEssence.name} foi editada.`
          : `A essência ${savedEssence.name} foi registrada no Maleficonomicon.`,
        ...(editingEssence
          ? {
              oldData: editingEssence,
              newData: savedEssence,
            }
          : {
              newData: savedEssence,
            }),
      })

      // Atualiza a interface somente após salvar no banco.
      setEssences((current) =>
        editingEssence
          ? current.map((essence) =>
              essence.id === savedEssence.id
                ? savedEssence
                : essence,
            )
          : [savedEssence, ...current],
      )

      setFormOpen(false)
      setEditingEssence(null)
    } catch (error) {
      console.error('Erro ao salvar essência:', error)
      setOperationError('Não foi possível salvar a essência.')
    } finally {
      setSaving(false)
    }
  }

  function handleNewEssence() {
    if (loading || loadError || saving) return

    setSelectedEssence(null)
    setEditingEssence(null)
    setFormOpen(true)
  }

  function handleEdit(essence: Essence) {
    if (loading || loadError || saving) return

    setSelectedEssence(null)
    setEditingEssence(essence)
    setFormOpen(true)
  }

  // ==========================================================
  // EXCLUSÃO
  // ==========================================================

  async function handleDelete(essence: Essence) {
  if (saving || loading || loadError) return

  setSaving(true)
  setOperationError('')

  try {
    // Busca os contratos diretamente no Supabase.
    const contracts = await getContracts()

    const associatedContracts = contracts.filter(
      (contract) => contract.essenceId === essence.id,
    )

    let confirmationMessage =
      `Tem certeza de que deseja excluir "${essence.name}"?\n\n` +
      'Essa ação removerá o registro da biblioteca. ' +
      'Ela não significa que a criatura foi erradicada no mundo do jogo.'

    if (associatedContracts.length > 0) {
      const contractNames = associatedContracts
        .map((contract) => `• ${contract.name}`)
        .join('\n')

      confirmationMessage +=
        `\n\nEsta essência possui ${associatedContracts.length} contrato(s) associado(s):\n\n` +
        `${contractNames}\n\n` +
        'Os contratos serão preservados no histórico e desvinculados desta essência.'
    }

    const confirmed = window.confirm(confirmationMessage)

    if (!confirmed) return

    // Desvincula os contratos antes de excluir a essência.
    if (associatedContracts.length > 0) {
      const now = Date.now()

      const updatedContracts = associatedContracts.map((contract) => ({
        ...contract,
        essenceId: null,
        contractorName: contract.contractorName || essence.name,
        updatedAt: now,
      }))

      // Persiste as alterações no Supabase.
      await Promise.all(
        updatedContracts.map((contract) => saveContract(contract)),
      )

      // Registra as alterações no histórico administrativo.
      await Promise.all(
        associatedContracts.map((contract, index) => {
          const updatedContract = updatedContracts[index]

          return recordAudit({
            action: 'Editado',
            entityType: 'Contrato',
            entityId: contract.id,
            entityName: contract.name,
            description:
              `O contrato ${contract.name} foi desvinculado da essência ${essence.name}, que foi excluída do registro.`,
            oldData: contract,
            newData: updatedContract,
          })
        }),
      )
    }

    // Exclui a essência somente depois de desvincular os contratos.
    await deleteEssence(essence.id)

    await recordAudit({
      action: 'Excluído',
      entityType: 'Essência',
      entityId: essence.id,
      entityName: essence.name,
      description: `A essência ${essence.name} foi removida da biblioteca.`,
      oldData: essence,
    })

    setEssences((current) =>
      current.filter((item) => item.id !== essence.id),
    )

    setSelectedEssence(null)
  } catch (error) {
    console.error('Erro ao excluir essência:', error)
    setOperationError(
      'Não foi possível excluir a essência ou desvincular seus contratos.',
    )
  } finally {
    setSaving(false)
  }
}
  // ==========================================================
  // FECHAR MODAL DE DETALHES COM ESC
  // ==========================================================

  useEffect(() => {
    if (!selectedEssence) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedEssence(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedEssence])

  // ==========================================================
  // LIMPAR FILTROS
  // ==========================================================

  function clearFilters() {
    setSearch('')
    setNatureFilter('Todas')
    setStatusFilter('Todos')
    setTrueNameFilter('Todos')
    setSortOrder('newest')
  }

  // ==========================================================
  // COMPONENTE VISUAL
  // ==========================================================

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-red-500">
            <Skull size={14} />
            Biblioteca de Entidades
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Registro de Essências
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Um catálogo das criaturas cujas essências foram
            registradas pelo Maleficonomicon.
          </p>
        </div>

        <button
          onClick={handleNewEssence}
          disabled={loading || Boolean(loadError) || saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Nova Essência
        </button>
      </div>

      {/* CARREGAMENTO E ERROS */}

      {loading && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
          <p className="text-sm text-zinc-400">
            Carregando essências...
          </p>
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-sm text-red-400">{loadError}</p>
        </div>
      )}

      {operationError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-sm text-red-400">{operationError}</p>
        </div>
      )}

      {/* CONTADORES */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-purple-900/40 bg-purple-950/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Demônios registrados
              </p>

              <p className="mt-2 text-3xl font-semibold text-purple-300">
                {demonCount}
              </p>
            </div>

            <div className="rounded-lg bg-purple-950/60 p-3 text-purple-400">
              <Skull size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Diabos registrados
              </p>

              <p className="mt-2 text-3xl font-semibold text-red-300">
                {devilCount}
              </p>
            </div>

            <div className="rounded-lg bg-red-950/60 p-3 text-red-400">
              <Flame size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* PESQUISA E FILTROS */}

      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome, título, epíteto, nome verdadeiro ou talismã..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-800"
            />
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 lg:hidden"
          >
            <Filter size={17} />
            Filtros
            <ChevronDown
              size={16}
              className={filtersOpen ? 'rotate-180 transition' : 'transition'}
            />
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <Filter size={17} className="text-zinc-500" />

            <span className="text-xs text-zinc-500">
              Ordenar:
            </span>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-zinc-300 outline-none focus:border-red-800"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="alphabetical">A–Z</option>
              <option value="alphabetical-desc">Z–A</option>
            </select>
          </div>
        </div>

        <div
          className={`${filtersOpen ? 'flex' : 'hidden'} flex-col gap-3 border-t border-zinc-800 pt-4 lg:flex lg:flex-row lg:items-center`}
        >
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <select
              value={natureFilter}
              onChange={(event) => setNatureFilter(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-red-800"
            >
              <option value="Todas">Todas as naturezas</option>
              <option value="Demônio">Demônios</option>
              <option value="Diabo">Diabos</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-red-800"
            >
              <option value="Todos">Todos os estados</option>
              <option value="Registrado">Registrado</option>
              <option value="Contratado">Contratado</option>
              <option value="Subjugado">Subjugado</option>
              <option value="Erradicado">Erradicado</option>
            </select>

            <select
              value={trueNameFilter}
              onChange={(event) => setTrueNameFilter(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-red-800"
            >
              <option value="Todos">Nome verdadeiro: Todos</option>
              <option value="Possui">Possui nome verdadeiro</option>
              <option value="Não possui">Não possui nome verdadeiro</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-red-800 lg:hidden"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="alphabetical">A–Z</option>
              <option value="alphabetical-desc">Z–A</option>
            </select>
          </div>

          <button
            onClick={clearFilters}
            className="text-left text-xs text-zinc-500 transition hover:text-red-400 lg:text-right"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* RESULTADOS */}

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Exibindo{' '}
          <span className="font-medium text-zinc-300">
            {filteredEssences.length}
          </span>{' '}
          de{' '}
          <span className="font-medium text-zinc-300">
            {essences.length}
          </span>{' '}
          essências
        </p>
      </div>

      {/* LISTAGEM DESKTOP */}

      <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40 md:block">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800 bg-zinc-900/70">
            <tr>
              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Essência
              </th>

              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Natureza
              </th>

              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Hierarquia
              </th>

              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Estado
              </th>

              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Nome verdadeiro
              </th>

              <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/70">
            {filteredEssences.map((essence) => (
              <tr
                key={essence.id}
                className="transition hover:bg-zinc-900/50"
              >
                <td className="px-5 py-4">
                  <button
                    onClick={() => setSelectedEssence(essence)}
                    className="text-left"
                  >
                    <p className="font-medium text-zinc-200 transition hover:text-red-400">
                      {essence.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {essence.titles.length > 0
                        ? essence.titles.join(', ')
                        : 'Sem títulos registrados'}
                    </p>
                  </button>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`text-sm ${natureStyles[essence.nature]}`}
                  >
                    {essence.nature}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-zinc-400">
                  {essence.hierarchy || '—'}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusStyles[essence.status]}`}
                  >
                    {essence.status}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm">
                  {essence.trueNamePublic && essence.trueName?.trim() ? (
                    <span className="text-emerald-400">
                      {essence.trueName}
                    </span>
                  ) : (
                    <span className="font-medium tracking-wide text-zinc-500">
                      OCULTO
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedEssence(essence)}
                      title="Visualizar"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <Eye size={17} />
                    </button>

                    <button
                      onClick={() => handleEdit(essence)}
                      title="Editar"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-blue-400"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => handleDelete(essence)}
                      title="Excluir"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LISTAGEM MOBILE */}

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredEssences.map((essence) => (
          <div
            key={essence.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
          >
            <button
              onClick={() => setSelectedEssence(essence)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-zinc-200">
                    {essence.name}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    {essence.nature} · {essence.hierarchy || 'Sem hierarquia'}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${statusStyles[essence.status]}`}
                >
                  {essence.status}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <CalendarDays size={14} />
                {essence.registrationDate || 'Data não informada'}
              </div>

              <div
                className={`mt-2 text-xs ${
                  essence.trueNamePublic && essence.trueName?.trim()
                    ? 'text-emerald-400'
                    : 'font-medium tracking-wide text-zinc-500'
                }`}
              >
                Nome verdadeiro:{' '}
                {essence.trueNamePublic && essence.trueName?.trim()
                  ? essence.trueName
                  : 'OCULTO'}
              </div>

              {essence.nature === 'Diabo' && essence.hasIndividualTalisman && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400">
                  <KeyRound size={12} />
                  Possui talismã individual
                </div>
              )}
            </button>

            <div className="mt-4 flex justify-end gap-2 border-t border-zinc-800 pt-3">
              <button
                onClick={() => setSelectedEssence(essence)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                title="Visualizar"
              >
                <Eye size={17} />
              </button>

              <button
                onClick={() => handleEdit(essence)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-blue-400"
                title="Editar"
              >
                <Pencil size={17} />
              </button>

              <button
                onClick={() => handleDelete(essence)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                title="Excluir"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ESTADO VAZIO */}

      {!loading && !loadError && filteredEssences.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
          <Search
            size={30}
            className="mx-auto text-zinc-700"
          />

          <h3 className="mt-4 font-medium text-zinc-300">
            Nenhuma essência encontrada
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Tente alterar os filtros ou os termos da pesquisa.
          </p>

          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-red-400 hover:text-red-300"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* MODAL DE DETALHES */}

      {selectedEssence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEssence(null)
            }
          }}
        >
          <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Registro de Essência
              </span>

              <button
                onClick={() => setSelectedEssence(null)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </div>

            {selectedEssence.imageUrl && (
              <div className="h-56 overflow-hidden bg-zinc-900">
                <img
                  src={selectedEssence.imageUrl}
                  alt={selectedEssence.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="space-y-6 p-6">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-medium ${natureStyles[selectedEssence.nature]}`}
                  >
                    {selectedEssence.nature}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs ${statusStyles[selectedEssence.status]}`}
                  >
                    {selectedEssence.status}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold text-white">
                  {selectedEssence.name}
                </h2>

                {selectedEssence.titles.length > 0 && (
                  <p className="mt-2 text-sm text-zinc-500">
                    {selectedEssence.titles.join(' · ')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* NOME VERDADEIRO */}

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-600">
                    Nome verdadeiro
                  </p>

                  <p
                    className={`mt-2 text-sm ${
                      selectedEssence.trueNamePublic && selectedEssence.trueName?.trim()
                        ? 'text-emerald-400'
                        : 'font-medium tracking-wide text-zinc-500'
                    }`}
                  >
                    {selectedEssence.trueNamePublic && selectedEssence.trueName?.trim()
                      ? selectedEssence.trueName
                      : 'OCULTO'}
                  </p>
                </div>

                {/* HIERARQUIA */}

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-600">
                    Hierarquia
                  </p>

                  <p className="mt-2 text-sm text-zinc-200">
                    {selectedEssence.hierarchy || 'Não informada'}
                  </p>
                </div>

                {/* TALISMÃ INDIVIDUAL */}

                {selectedEssence.nature === 'Diabo' && (
                  <div className="rounded-lg border border-red-900/30 bg-red-950/10 p-4 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <KeyRound size={14} className="text-red-400" />

                      <p className="text-xs uppercase tracking-wider text-zinc-500">
                        Talismã individual
                      </p>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                      {selectedEssence.hasIndividualTalisman
                        ? selectedEssence.individualTalisman ||
                          'Talismã marcado, mas sem descrição.'
                        : 'Este diabo não possui talismã individual registrado.'}
                    </p>
                  </div>
                )}

                {/* DATA DE REGISTRO */}

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-zinc-600">
                    Data de registro
                  </p>

                  <p className="mt-2 text-sm text-zinc-200">
                    {selectedEssence.registrationDate || 'Não informada'}
                  </p>
                </div>
              </div>

              {selectedEssence.description && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
                    Descrição
                  </p>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                    {selectedEssence.description}
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse justify-between gap-3 border-t border-zinc-800 pt-5 sm:flex-row">
                <button
                  onClick={() => handleDelete(selectedEssence)}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-900/50 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Excluir registro
                </button>

                <button
                  onClick={() => handleEdit(selectedEssence)}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil size={16} />
                  Editar registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO E EDIÇÃO */}

      {formOpen && (
        <EssenceFormModal
          key={editingEssence?.id ?? 'new'}
          initialData={editingEssence ?? undefined}
          onSave={handleSave}
          onClose={() => {
            if (saving) return

            setFormOpen(false)
            setEditingEssence(null)
          }}
        />
      )}
    </div>
  )
}
