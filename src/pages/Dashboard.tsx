
import { useEffect, useState } from 'react'
import {
  ScrollText,
  Skull,
  Flame,
  FileText,
  Shield,
  Activity,
  HeartCrack,
  Save,
  AlertTriangle,
} from 'lucide-react'

import { useAuth } from '../hooks/useAuth'

import { getEssences } from '../lib/essenceStorage'
import { getContracts } from '../lib/contractStorage'
import { getSubjugations } from '../lib/subjugationStorage'
import { supabase } from '../lib/supabase'
import type { AuditLog } from '../types/auditLog'
import type { Essence } from '../types/essence'
import {
  getDahliaLevel,
  saveDahliaLevel,
} from '../lib/dahliaConfigStorage'

interface DashboardStats {
  demons: number
  devils: number
  totalContracts: number
  activeContracts: number
  subjugated: number
  deadSubjugated: number
}

const emptyStats: DashboardStats = {
  demons: 0,
  devils: 0,
  totalContracts: 0,
  activeContracts: 0,
  subjugated: 0,
  deadSubjugated: 0,
}

const contractMilestones = [
  { level: 10, maximum: 2, active: 1 },
  { level: 13, maximum: 3, active: 2 },
  { level: 15, maximum: 4, active: 3 },
  { level: 17, maximum: 5, active: 4 },
  { level: 20, maximum: 6, active: 6 },
]

function getContractLimits(level: number | null) {
  if (level === null || level < 10) {
    return { maximum: 0, active: 0 }
  }

  const milestone = [...contractMilestones]
    .reverse()
    .find((item) => level >= item.level)

  return milestone
    ? { maximum: milestone.maximum, active: milestone.active }
    : { maximum: 0, active: 0 }
}

function formatActivityDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActivityColor(action: AuditLog['action']) {
  switch (action) {
    case 'Criado':
    case 'Ativado':
    case 'Descoberta alterada':
    case 'Vitalidade alterada':
    case 'Nível alterado':
      return 'text-[#A855F7]'

    case 'Excluído':
    case 'Desativado':
      return 'text-[#EF4444]'

    default:
      return 'text-[#D4D4D8]'
  }
}

export default function Dashboard() {
  const { isAdmin, user, loading: authLoading } = useAuth()

  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [activitiesError, setActivitiesError] = useState('')

  const [savedLevel, setSavedLevel] = useState<number | null>(null)
  const [levelInput, setLevelInput] = useState('')
  const [levelLoading, setLevelLoading] = useState(true)
  const [levelSaving, setLevelSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ==========================================================
  // CARREGAMENTO DO NÍVEL DE DAHLIA
  // ==========================================================

  useEffect(() => {
    let mounted = true

    async function loadDahliaLevel() {
      try {
        const level = await getDahliaLevel()

        if (!mounted) return

        setSavedLevel(level)
        setLevelInput(level?.toString() ?? '')
      } catch (error) {
        console.error('Erro ao carregar nível da Dahlia:', error)

        if (mounted) {
          setSaveError('Não foi possível carregar o nível da Dahlia.')
        }
      } finally {
        if (mounted) {
          setLevelLoading(false)
        }
      }
    }

    void loadDahliaLevel()

    return () => {
      mounted = false
    }
  }, [])

  // ==========================================================
  // CARREGAMENTO DOS INDICADORES
  // ==========================================================

  useEffect(() => {
    let mounted = true

    if (authLoading) {
      return () => {
        mounted = false
      }
    }

    async function loadDashboardData() {
      setStatsLoading(true)
      setStatsError('')

      try {
        const [essences, contracts, subjugations] = await Promise.all([
          getEssences(isAdmin),
          getContracts(isAdmin),
          getSubjugations(isAdmin),
        ])

        if (!mounted) return

        setStats({
          demons: essences.filter(
            (item: Essence) => item.nature === 'Demônio',
          ).length,

          devils: essences.filter(
            (item: Essence) => item.nature === 'Diabo',
          ).length,

          totalContracts: contracts.length,

          activeContracts: contracts.filter(
            (item) => item.status === 'Ativo',
          ).length,

          subjugated: subjugations.filter(
            (item) => item.discoveryStatus === 'Subjugada',
          ).length,

          deadSubjugated: subjugations.filter(
            (item) =>
              item.discoveryStatus === 'Subjugada' && !item.isAlive,
          ).length,
        })

        setStatsError('')
      } catch (error) {
        console.error('Erro ao carregar indicadores:', error)

        if (mounted) {
          setStatsError('Não foi possível carregar os indicadores.')
        }
      } finally {
        if (mounted) {
          setStatsLoading(false)
        }
      }
    }

    void loadDashboardData()

    return () => {
      mounted = false
    }
  }, [isAdmin, user?.id, authLoading])

  // ==========================================================
  // CARREGAMENTO DAS ATIVIDADES RECENTES
  // ==========================================================

  useEffect(() => {
    let mounted = true

    async function loadRecentActivities() {
      setActivitiesLoading(true)
      setActivitiesError('')

      const [{ data, error }, subjugations] = await Promise.all([supabase
        .from('public_recent_activities')
        .select('id, action, entity_type, entity_name, description, created_at')
        .neq('action', 'Editado')
        .order('created_at', { ascending: false })
        .limit(30), getSubjugations(false)])

      if (!mounted) return

      if (error) {
        console.error('Erro ao carregar atividades recentes:', error)
        setActivitiesError('Não foi possível carregar as atividades recentes.')
      } else {
        const undiscoveredNames = new Set(subjugations.filter((creature) => creature.discoveryStatus === 'Não descoberta').map((creature) => creature.name))
        const activities: AuditLog[] = (data ?? []).filter((log) => log.entity_type !== 'Subjugação' || !undiscoveredNames.has(log.entity_name)).slice(0, 2).map((log) => ({
          id: log.id,
          action: log.action as AuditLog['action'],
          entityType: log.entity_type as AuditLog['entityType'],
          entityId: '',
          entityName: log.entity_name,
          description: log.description,
          createdAt: new Date(log.created_at).getTime(),
        }))

        setRecentActivities(activities)
        setActivitiesError('')
      }

      setActivitiesLoading(false)
    }

    void loadRecentActivities()

    return () => {
      mounted = false
    }
  }, [])

  const limits = getContractLimits(savedLevel)

  // ==========================================================
  // SALVAR NÍVEL
  // ==========================================================

  const handleSaveLevel = async () => {
    const level = Number(levelInput)

    if (
      levelInput.trim() === '' ||
      !Number.isInteger(level) ||
      level < 1 ||
      level > 20
    ) {
      setSaveError('Informe um nível válido entre 1 e 20.')
      return
    }

    setLevelSaving(true)

    try {
      await saveDahliaLevel(level)
      setSavedLevel(level)
      setSaveError('')
    } catch (error) {
      console.error('Erro ao salvar nível da Dahlia:', error)
      setSaveError('Não foi possível salvar o nível.')
    } finally {
      setLevelSaving(false)
    }
  }

  // ==========================================================
  // INDICADORES
  // ==========================================================

  const indicators = [
    {
      label: 'Demônios registrados',
      value: stats.demons,
      description: 'Essências demoníacas',
      icon: Skull,
      color: 'purple',
    },
    {
      label: 'Diabos registrados',
      value: stats.devils,
      description: 'Essências infernais',
      icon: Flame,
      color: 'red',
    },
    {
      label: 'Contratos firmados',
      value: stats.totalContracts,
      description: 'Ativos e inativos',
      icon: FileText,
      color: 'red',
    },
    {
      label: 'Contratos ativos',
      value: stats.activeContracts,
      description: 'Atualmente em vigor',
      icon: Shield,
      color: 'red',
    },
    {
      label: 'Demônios subjugados',
      value: stats.subjugated,
      description: 'Sob seu domínio',
      icon: Skull,
      color: 'purple',
    },
    {
      label: 'Subjugados mortos',
      value: stats.deadSubjugated,
      description: 'Essências perdidas',
      icon: HeartCrack,
      color: 'red',
    },
  ]

  const exceededSignedLimit =
    savedLevel !== null && stats.totalContracts > limits.maximum

  const exceededActiveLimit =
    savedLevel !== null && stats.activeContracts > limits.active

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

        {statsError && (
          <p className="mb-4 text-xs text-red-400">{statsError}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {indicators.map((item) => {
            const Icon = item.icon
            const isPurple = item.color === 'purple'

            return (
              <div
                key={item.label}
                className={`rounded-lg border p-5 transition ${isPurple
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
                  {statsLoading ? '—' : item.value}
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

              <p className="mt-2 font-serif text-2xl text-white">
                {savedLevel === null ? '—' : limits.maximum}
              </p>

              <p className="mt-1 text-xs text-[#71717A]">
                {stats.totalContracts} utilizados
              </p>
            </div>

            <div>
              <p className="text-xs text-[#A1A1AA]">
                Contratos ativos permitidos
              </p>

              <p className="mt-2 font-serif text-2xl text-white">
                {savedLevel === null ? '—' : limits.active}
              </p>

              <p className="mt-1 text-xs text-[#71717A]">
                {stats.activeContracts} em vigor
              </p>
            </div>
          </div>

          {(exceededSignedLimit || exceededActiveLimit) && (
            <div className="mt-5 flex items-start gap-2 rounded border border-[#854D0E] bg-[#422006]/30 p-3 text-xs text-[#FCD34D]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />

              <p>
                {exceededSignedLimit &&
                  'O número de contratos firmados ultrapassa o limite atual. '}

                {exceededActiveLimit &&
                  'O número de contratos ativos ultrapassa o limite atual.'}
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-[#3F2024] pt-5">
            <label
              htmlFor="dahlia-level"
              className="mb-2 block text-xs text-[#A1A1AA]"
            >
              Nível atual de Dahlia
            </label>

            <div className="flex gap-2">
              <input
                id="dahlia-level"
                type="number"
                min="1"
                max="20"
                value={levelInput}
                onChange={(event) => setLevelInput(event.target.value)}
                placeholder="Ex.: 10"
                disabled={levelLoading || levelSaving}
                className="w-full rounded border border-[#3F3F46] bg-[#09090B] px-3 py-2 text-sm text-white outline-none transition focus:border-[#9333EA]"
              />

              <button
                type="button"
                onClick={handleSaveLevel}
                disabled={levelLoading || levelSaving}
                className="flex shrink-0 items-center gap-2 rounded border border-[#632329] bg-[#351418] px-4 py-2 text-xs text-white transition hover:border-[#DC2626] hover:bg-[#4A1B20] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={15} />
                {levelLoading
                  ? 'Carregando...'
                  : levelSaving
                    ? 'Salvando...'
                    : 'Salvar'}
              </button>
            </div>

            {saveError && (
              <p className="mt-2 text-xs text-red-400">
                {saveError}
              </p>
            )}

            {savedLevel !== null && !saveError && (
              <p className="mt-2 text-xs text-[#71717A]">
                Limites calculados com base no maior patamar alcançado.
              </p>
            )}

            {savedLevel !== null && savedLevel < 10 && (
              <p className="mt-2 text-xs text-[#A1A1AA]">
                Os contratos infernais ainda não foram desbloqueados.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#3F3F46] bg-[#18181B] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Activity size={19} className="text-[#D4D4D8]" />

            <h3 className="font-serif text-lg text-[#F4F4F5]">
              Atividade Recente
            </h3>
          </div>

          {activitiesLoading ? (
            <div className="flex min-h-24 items-center justify-center text-center">
              <p className="text-sm text-[#A1A1AA]">
                Carregando atividades...
              </p>
            </div>
          ) : activitiesError ? (
            <div className="flex min-h-24 items-center justify-center text-center">
              <p className="text-xs text-red-400">{activitiesError}</p>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="flex min-h-24 flex-col items-center justify-center text-center">
              <ScrollText size={24} className="mb-3 text-[#52525B]" />

              <p className="text-sm text-[#D4D4D8]">
                Nenhum registro de atividade.
              </p>

              <p className="mt-1 text-xs text-[#71717A]">
                As atividades relevantes aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 border-b border-[#27272A] pb-4 last:border-0 last:pb-0"
                >
                  <div className="mt-1 shrink-0">
                    <ScrollText
                      size={16}
                      className={getActivityColor(log.action)}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`text-xs font-medium ${getActivityColor(log.action)}`}>
                        {log.action}
                      </span>

                      <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
                        {log.entityType}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm text-[#E4E4E7]">
                      {log.entityName}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">
                      {log.description}
                    </p>

                    <p className="mt-2 text-[10px] text-[#71717A]">
                      {formatActivityDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
