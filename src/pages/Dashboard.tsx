
import { useState } from 'react'
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

import { getEssences } from '../lib/essenceStorage'
import { getContracts } from '../lib/contractStorage'
import { getSubjugations } from '../lib/subjugationStorage'
import { getAuditLogs } from '../lib/auditLogStorage'
import type { AuditLog } from '../types/auditLog'
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

function loadDashboardData() {
  const essences = getEssences() ?? []
  const contracts = getContracts() ?? []
  const subjugations = getSubjugations() ?? []

  // Oculta edições genéricas da atividade pública.
  // Os registros continuam preservados no histórico administrativo.
  const recentActivities = getAuditLogs()
    .filter((log) => log.action !== 'Editado')
    .slice(0, 8)

  return {
    stats: {
      demons: essences.filter(
        (item) => item.nature === 'Demônio',
      ).length,

      devils: essences.filter(
        (item) => item.nature === 'Diabo',
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
    },

    level: getDahliaLevel(),
    recentActivities,
  }
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
  const [initialData] = useState(loadDashboardData)

  const [stats] = useState<DashboardStats>(initialData.stats)

  const [recentActivities] = useState<AuditLog[]>(
    initialData.recentActivities,
  )

  const [savedLevel, setSavedLevel] = useState<number | null>(
    initialData.level,
  )

  const [levelInput, setLevelInput] = useState(
    initialData.level?.toString() ?? '',
  )

  const [saveError, setSaveError] = useState('')

  const limits = getContractLimits(savedLevel)

  const handleSaveLevel = () => {
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

    try {
      saveDahliaLevel(level)
      setSavedLevel(level)
      setSaveError('')
    } catch {
      setSaveError('Não foi possível salvar o nível.')
    }
  }

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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                className="w-full rounded border border-[#3F3F46] bg-[#09090B] px-3 py-2 text-sm text-white outline-none transition focus:border-[#9333EA]"
              />

              <button
                type="button"
                onClick={handleSaveLevel}
                className="flex shrink-0 items-center gap-2 rounded border border-[#632329] bg-[#351418] px-4 py-2 text-xs text-white transition hover:border-[#DC2626] hover:bg-[#4A1B20]"
              >
                <Save size={15} />
                Salvar
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

          {recentActivities.length === 0 ? (
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
