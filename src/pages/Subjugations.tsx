
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  Search,
  Skull,
  LockKeyhole,
  Unlock,
  Heart,
  HeartCrack,
  X,
  Shield,
  Filter,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react'

import type {
  Subjugation,
  SubjugationFormData,
  CreatureDiscoveryStatus,
} from '../types/subjugation'

import {
  getSubjugations,
  saveSubjugation,
  deleteSubjugation,
} from '../lib/subjugationStorage'

import SubjugationFormModal from '../components/ui/SubjugationFormModal'
import { addAuditLog } from '../lib/auditLogStorage'
import type { AuditLogFormData } from '../types/auditLog'

type FilterStatus = 'Todas' | CreatureDiscoveryStatus

type ModalType = 'locked' | 'unknown' | 'missing-link' | null

// ============================================================
// HISTÓRICO ADMINISTRATIVO
// ============================================================

async function recordAudit(data: AuditLogFormData): Promise<void> {
  try {
    await addAuditLog(data)
  } catch (error) {
    console.error(
      'Não foi possível registrar a atividade administrativa:',
      error,
    )
  }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Subjugations() {
  const {
    isAdmin,
    user,
    loading: authLoading,
  } = useAuth()

  const [subjugations, setSubjugations] = useState<Subjugation[]>([])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [saving, setSaving] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] =
    useState<FilterStatus>('Todas')

  const [modalType, setModalType] = useState<ModalType>(null)
  const [viewingCreature, setViewingCreature] =
    useState<Subjugation | null>(null)

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingCreature, setEditingCreature] =
    useState<Subjugation | undefined>(undefined)

  // ==========================================================
  // CARREGAMENTO DO SUPABASE
  // ==========================================================

  useEffect(() => {
    if (authLoading) return

    let mounted = true

    async function loadSubjugations() {
      setLoading(true)
      setLoadError('')

      try {
        const data = await getSubjugations(isAdmin)

        if (mounted) {
          setSubjugations(data)
        }
      } catch (error) {
        console.error('Erro ao carregar subjugados:', error)

        if (mounted) {
          setLoadError(
            'Não foi possível carregar os registros de subjugação.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadSubjugations()

    return () => {
      mounted = false
    }
  }, [isAdmin, user?.id, authLoading])

  // ==========================================================
  // FECHAR MODAL COM ESC
  // ==========================================================

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        setModalType(null)
        setViewingCreature(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [saving])

  // ==========================================================
  // CONTADORES
  // ==========================================================

  const totalSubjugated = subjugations.filter(
    (creature) => creature.discoveryStatus === 'Subjugada',
  ).length

  const totalDiscovered = subjugations.filter(
    (creature) => creature.discoveryStatus !== 'Não descoberta',
  ).length

  const totalDead = subjugations.filter(
    (creature) =>
      creature.discoveryStatus === 'Subjugada' &&
      !creature.isAlive,
  ).length

  // ==========================================================
  // PESQUISA E FILTROS
  // ==========================================================

  const filteredSubjugations = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()

    return subjugations
      .filter((creature) => {
        if (
          filterStatus !== 'Todas' &&
          creature.discoveryStatus !== filterStatus
        ) {
          return false
        }

        // Durante uma pesquisa, criaturas desconhecidas ficam ocultas.
        if (search && creature.discoveryStatus === 'Não descoberta') {
          return false
        }

        if (!search) return true

        return (
          creature.name.toLowerCase().includes(search) ||
          creature.challengeRating.toLowerCase().includes(search) ||
          creature.description.toLowerCase().includes(search)
        )
      })
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [subjugations, filterStatus, searchTerm])

  // ==========================================================
  // FORMULÁRIOS
  // ==========================================================

  function openCreateForm() {
    if (!isAdmin || saving || loading || loadError) return

    setOperationError('')
    setEditingCreature(undefined)
    setShowForm(true)
  }

  function openEditForm(creature: Subjugation) {
    if (!isAdmin || saving) return

    setOperationError('')
    setEditingCreature(creature)
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingCreature(undefined)
  }

  // ==========================================================
  // CRIAÇÃO E EDIÇÃO
  // ==========================================================

  async function handleSave(data: SubjugationFormData): Promise<void> {
    if (!isAdmin || saving) return

    setSaving(true)
    setOperationError('')

    try {
      if (editingCreature) {
        // ----------------------------------------------------
        // EDIÇÃO
        // ----------------------------------------------------

        const updatedCreature: Subjugation = {
          ...editingCreature,
          ...data,
        }

        const discoveryChanged =
          editingCreature.discoveryStatus !==
          updatedCreature.discoveryStatus

        const vitalityChanged =
          editingCreature.isAlive !== updatedCreature.isAlive

        const {
          discoveryStatus: oldDiscoveryStatus,
          isAlive: oldIsAlive,
          ...oldOtherData
        } = editingCreature

        const {
          discoveryStatus: newDiscoveryStatus,
          isAlive: newIsAlive,
          ...newOtherData
        } = updatedCreature

        const otherDataChanged =
          JSON.stringify(oldOtherData) !== JSON.stringify(newOtherData)

        // Primeiro persiste a alteração no Supabase.
        const savedCreature = await saveSubjugation(updatedCreature)

        // Depois registra as alterações no histórico.
        const auditTasks: Promise<void>[] = []

        // Alterações gerais nos dados da criatura.
        if (otherDataChanged) {
          auditTasks.push(
            recordAudit({
              action: 'Editado',
              entityType: 'Subjugação',
              entityId: savedCreature.id,
              entityName: savedCreature.name,
              description: `O registro de "${savedCreature.name}" foi editado.`,
              oldData: editingCreature,
              newData: savedCreature,
            }),
          )
        }

        // Alteração do estado de descoberta ou subjugação.
        if (discoveryChanged) {
          auditTasks.push(
            recordAudit({
              action: 'Descoberta alterada',
              entityType: 'Subjugação',
              entityId: savedCreature.id,
              entityName: savedCreature.name,
              description: `O estado de descoberta de "${savedCreature.name}" foi alterado de "${oldDiscoveryStatus}" para "${newDiscoveryStatus}".`,
              oldData: editingCreature,
              newData: savedCreature,
            }),
          )
        }

        // Alteração da vitalidade.
        if (vitalityChanged) {
          auditTasks.push(
            recordAudit({
              action: 'Vitalidade alterada',
              entityType: 'Subjugação',
              entityId: savedCreature.id,
              entityName: savedCreature.name,
              description: `A vitalidade de "${savedCreature.name}" foi alterada de "${oldIsAlive ? 'Vivo' : 'Morto'}" para "${newIsAlive ? 'Vivo' : 'Morto'}".`,
              oldData: editingCreature,
              newData: savedCreature,
            }),
          )
        }

        await Promise.all(auditTasks)

        // Atualiza a interface somente depois da persistência.
        setSubjugations((previous) =>
          previous.map((creature) =>
            creature.id === savedCreature.id
              ? savedCreature
              : creature,
          ),
        )
      } else {
        // ----------------------------------------------------
        // CRIAÇÃO
        // ----------------------------------------------------

        const newCreature: Subjugation = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        }

        // Persiste no Supabase.
        const savedCreature = await saveSubjugation(newCreature)

        // Registra a criação no histórico administrativo.
        await recordAudit({
          action: 'Criado',
          entityType: 'Subjugação',
          entityId: savedCreature.id,
          entityName: savedCreature.name,
          description: `A criatura "${savedCreature.name}" foi adicionada ao registro de subjugação.`,
          newData: savedCreature,
        })

        setSubjugations((previous) => [
          ...previous,
          savedCreature,
        ])
      }

      setShowForm(false)
      setEditingCreature(undefined)
    } catch (error) {
      console.error('Erro ao salvar criatura:', error)

      setOperationError(
        'Não foi possível salvar a criatura no Supabase.',
      )

      throw error
    } finally {
      setSaving(false)
    }
  }

  // ==========================================================
  // EXCLUSÃO
  // ==========================================================

  async function handleDelete(creature: Subjugation) {
    if (!isAdmin || saving || loading) return

    const confirmed = window.confirm(
      `Tem certeza de que deseja excluir "${creature.name}"?\n\nEssa ação não poderá ser desfeita.`,
    )

    if (!confirmed) return

    setSaving(true)
    setOperationError('')

    try {
      await deleteSubjugation(creature.id)

      await recordAudit({
        action: 'Excluído',
        entityType: 'Subjugação',
        entityId: creature.id,
        entityName: creature.name,
        description: `A criatura "${creature.name}" foi removida do registro de subjugação.`,
        oldData: creature,
      })

      setSubjugations((previous) =>
        previous.filter((item) => item.id !== creature.id),
      )
    } catch (error) {
      console.error('Erro ao excluir criatura:', error)

      setOperationError(
        'Não foi possível excluir a criatura do Supabase.',
      )
    } finally {
      setSaving(false)
    }
  }

  // ==========================================================
  // INTERAÇÃO COM AS CRIATURAS
  // ==========================================================

  function handleCreatureClick(creature: Subjugation) {
    if (creature.discoveryStatus === 'Não descoberta') {
      setModalType('unknown')
      return
    }

    if (creature.discoveryStatus === 'Descoberta') {
      setModalType('locked')
      return
    }

    if (creature.discoveryStatus === 'Subjugada') {
      if (creature.externalUrl?.trim()) {
        window.open(
          creature.externalUrl,
          '_blank',
          'noopener,noreferrer',
        )
      } else {
        setModalType('missing-link')
      }
    }
  }

  // Abre os detalhes somente se a criatura já foi descoberta.
  function openCreatureDetails(creature: Subjugation) {
    if (creature.discoveryStatus === 'Não descoberta') return

    setViewingCreature(creature)
  }

  function closeModal() {
    setModalType(null)
    setViewingCreature(null)
  }

  const statusOptions: FilterStatus[] = [
    'Todas',
    'Subjugada',
    'Descoberta',
    'Não descoberta',
  ]

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-3">
              <Skull className="h-7 w-7 text-purple-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">
                Ritual de Subjugação
              </h1>

              <p className="text-sm text-gray-400">
                O conhecimento é uma corrente. A vontade, a chave.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateForm}
            disabled={loading || saving || !!loadError}
            className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nova criatura
          </button>
        )}
      </div>

      {/* Estados de carregamento e erro */}
      {loading && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-gray-400">
            Carregando registros de subjugação...
          </p>
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">
            {loadError}
          </p>
        </div>
      )}

      {operationError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">
            {operationError}
          </p>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Criaturas subjugadas"
          value={totalSubjugated}
          icon={<Shield className="h-5 w-5" />}
          color="text-green-400"
        />

        <StatCard
          label="Criaturas descobertas"
          value={totalDiscovered}
          icon={<Unlock className="h-5 w-5" />}
          color="text-purple-400"
        />

        <StatCard
          label="Subjugadas mortas"
          value={totalDead}
          icon={<HeartCrack className="h-5 w-5" />}
          color="text-red-400"
        />
      </div>

      {/* Pesquisa e filtros */}
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar criaturas descobertas..."
              disabled={loading || !!loadError}
              className="w-full rounded-lg border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-purple-500/50 disabled:opacity-50"
            />
          </div>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            disabled={loading || !!loadError}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-50 lg:hidden"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          <div className="hidden flex-wrap gap-2 lg:flex">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                disabled={loading || !!loadError}
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  filterStatus === status
                    ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                } disabled:opacity-50`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {showMobileFilters && (
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status)
                  setShowMobileFilters(false)
                }}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  filterStatus === status
                    ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Galeria */}
      {!loading && !loadError && (
        filteredSubjugations.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] py-16 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-gray-600" />

            <p className="text-gray-400">
              Nenhuma criatura encontrada.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {filteredSubjugations.map((creature) => {
              const isUnknown =
                creature.discoveryStatus === 'Não descoberta'

              const isDiscovered =
                creature.discoveryStatus === 'Descoberta'

              const isSubjugated =
                creature.discoveryStatus === 'Subjugada'

              return (
                <div
                  key={creature.id}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.04]"
                >
                  <button
                    onClick={() => handleCreatureClick(creature)}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                      {isUnknown ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-5xl font-bold tracking-widest text-gray-600">
                            ???
                          </span>
                        </div>
                      ) : creature.imageUrl ? (
                        <img
                          src={creature.imageUrl}
                          alt={creature.name}
                          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                            isDiscovered ? 'grayscale brightness-75' : ''
                          }`}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Skull className="h-16 w-16 text-gray-700" />
                        </div>
                      )}

                      <div className="absolute left-3 top-3">
                        {isSubjugated && (
                          <span className="rounded-md border border-green-500/30 bg-green-950/80 px-2 py-1 text-xs font-medium text-green-300">
                            Subjugada
                          </span>
                        )}

                        {isDiscovered && (
                          <span className="rounded-md border border-gray-500/30 bg-black/80 px-2 py-1 text-xs font-medium text-gray-300">
                            Descoberta
                          </span>
                        )}

                        {isUnknown && (
                          <span className="rounded-md border border-red-500/30 bg-red-950/80 px-2 py-1 text-xs font-medium text-red-300">
                            Desconhecida
                          </span>
                        )}
                      </div>

                      {isSubjugated && (
                        <div className="absolute right-3 top-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              creature.isAlive
                                ? 'bg-green-950/80 text-green-400'
                                : 'bg-red-950/80 text-red-400'
                            }`}
                          >
                            {creature.isAlive ? (
                              <Heart className="h-4 w-4" />
                            ) : (
                              <HeartCrack className="h-4 w-4" />
                            )}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-3 right-3">
                        {isSubjugated && (
                          <ExternalLink className="h-4 w-4 text-white/80" />
                        )}

                        {isDiscovered && (
                          <LockKeyhole className="h-4 w-4 text-white/80" />
                        )}

                        {isUnknown && (
                          <LockKeyhole className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 p-3">
                      <h3 className="truncate font-semibold text-white">
                        {isUnknown ? '???' : creature.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          CR {isUnknown ? '???' : creature.challengeRating}
                        </span>

                        {isSubjugated && (
                          <span
                            className={`text-xs ${
                              creature.isAlive
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {creature.isAlive ? 'Vivo' : 'Morto'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Ações da criatura */}
                  {(isAdmin || isDiscovered || isSubjugated) && (
                    <div className="flex items-center justify-end gap-2 border-t border-white/10 px-3 py-2">
                      {(isDiscovered || isSubjugated) && (
                        <button
                          onClick={() => openCreatureDetails(creature)}
                          title="Ver detalhes da criatura"
                          aria-label={`Ver detalhes de ${creature.name}`}
                          className="rounded-md p-2 text-gray-400 transition hover:bg-blue-500/10 hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditForm(creature)}
                            disabled={saving}
                            title="Editar criatura"
                            className="rounded-md p-2 text-gray-400 transition hover:bg-purple-500/10 hover:text-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => void handleDelete(creature)}
                            disabled={saving}
                            title="Excluir criatura"
                            className="rounded-md p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Formulário de criação e edição */}
      {isAdmin && showForm && (
        <SubjugationFormModal
          initialData={editingCreature}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {/* Detalhes da criatura: disponível após descoberta ou subjugação */}
      {viewingCreature && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="creature-details-title"
            className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#151515] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              aria-label="Fechar detalhes"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex items-center gap-3 pr-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                <Skull className="h-6 w-6 text-purple-400" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-purple-300">
                  Registro de criatura
                </p>

                <h2
                  id="creature-details-title"
                  className="text-xl font-bold text-white"
                >
                  {viewingCreature.name}
                </h2>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-1 text-xs text-gray-500">
                  Challenge Rating (CR)
                </p>

                <p className="text-lg font-semibold text-white">
                  {viewingCreature.challengeRating || 'Não informado'}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-1 text-xs text-gray-500">
                  Estado
                </p>

                <p
                  className={`text-lg font-semibold ${
                    viewingCreature.discoveryStatus === 'Subjugada'
                      ? 'text-green-400'
                      : 'text-purple-300'
                  }`}
                >
                  {viewingCreature.discoveryStatus}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                Descrição
              </h3>

              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                  {viewingCreature.description?.trim() ||
                    'Nenhuma descrição cadastrada para esta criatura.'}
                </p>
              </div>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                onClick={closeModal}
                className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de interação */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#151515] p-7 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {modalType === 'unknown' && (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <LockKeyhole className="h-8 w-8 text-red-400" />
                </div>

                <h2 className="mb-3 text-lg font-bold text-white">
                  Conhecimento proibido
                </h2>

                <p className="mb-7 text-sm leading-relaxed text-gray-400">
                  Seu cérebro não comportaria tal conhecimento ainda
                </p>

                <button
                  onClick={closeModal}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-8 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  Aff
                </button>
              </>
            )}

            {modalType === 'locked' && (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                  <LockKeyhole className="h-8 w-8 text-purple-400" />
                </div>

                <h2 className="mb-3 text-lg font-bold text-white">
                  Subjugação indisponível
                </h2>

                <p className="mb-7 text-sm leading-relaxed text-gray-400">
                  Você ainda não foi forte o suficiente para desbloquear isso
                </p>

                <button
                  onClick={closeModal}
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-8 py-2.5 text-sm font-medium text-purple-300 transition hover:bg-purple-500/20"
                >
                  Aff
                </button>
              </>
            )}

            {modalType === 'missing-link' && (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                  <ExternalLink className="h-8 w-8 text-yellow-400" />
                </div>

                <h2 className="mb-3 text-lg font-bold text-white">
                  Registro incompleto
                </h2>

                <p className="mb-7 text-sm leading-relaxed text-gray-400">
                  Esta criatura foi subjugada, mas ainda não possui um
                  direcionamento externo cadastrado.
                </p>

                <button
                  onClick={closeModal}
                  className="rounded-lg border border-white/10 bg-white/5 px-8 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// COMPONENTE DOS INDICADORES
// ============================================================

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={color}>{icon}</span>
      </div>

      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
