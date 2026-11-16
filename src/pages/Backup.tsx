
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'

import {
  Database,
  Download,
  ShieldCheck,
  Clock,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Upload,
  RotateCcw,
  History,
  RefreshCw,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface BackupData {
  essences: Record<string, unknown>[]
  contracts: Record<string, unknown>[]
  subjugations: Record<string, unknown>[]
  dahlia_config: Record<string, unknown>[]
  audit_logs: Record<string, unknown>[]
}

interface BackupFile {
  application: string
  formatVersion: number
  exportedAt: string
  data: BackupData
}

interface BackupSnapshot {
  id: string
  created_at: string
  created_by: string
  source_exported_at: string | null
  counts: {
    essences: number
    contracts: number
    subjugations: number
    dahlia_config: number
    audit_logs: number
  }
}

const MAX_BACKUP_SIZE = 40 * 1024 * 1024

const TABLES = [
  'essences',
  'contracts',
  'subjugations',
  'dahlia_config',
  'audit_logs',
] as const

const TABLE_LABELS: Record<(typeof TABLES)[number], string> = {
  essences: 'Essências',
  contracts: 'Contratos',
  subjugations: 'Subjugações',
  dahlia_config: 'Configurações',
  audit_logs: 'Registros de auditoria',
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isUuid(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof err.message === 'string'
  ) {
    const details =
      'details' in err && typeof err.details === 'string'
        ? err.details
        : ''

    const hint =
      'hint' in err && typeof err.hint === 'string'
        ? err.hint
        : ''

    return [err.message, details, hint]
      .filter(Boolean)
      .join(' — ')
  }

  if (err instanceof Error) {
    return err.message
  }

  return fallback
}

function validateBackupFile(value: unknown): BackupFile {
  if (!isObject(value)) {
    throw new Error('O arquivo não possui uma estrutura JSON válida.')
  }

  if (value.application !== 'Maleficonomicon') {
    throw new Error('Este arquivo não pertence ao Maleficonomicon.')
  }

  if (value.formatVersion !== 1) {
    throw new Error('Versão de backup não reconhecida ou incompatível.')
  }

  if (
    typeof value.exportedAt !== 'string' ||
    Number.isNaN(Date.parse(value.exportedAt))
  ) {
    throw new Error('A data de exportação do backup é inválida.')
  }

  if (!isObject(value.data)) {
    throw new Error('O arquivo não contém a estrutura de dados esperada.')
  }

  for (const table of TABLES) {
    const rows = value.data[table]

    if (!Array.isArray(rows)) {
      throw new Error(`A tabela ${table} não contém uma lista válida.`)
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]

      if (!isObject(row)) {
        throw new Error(
          `${table}: registro ${index + 1} possui estrutura inválida.`,
        )
      }

      if (table === 'dahlia_config') {
        if (row.id !== true) {
          throw new Error(
            `dahlia_config: registro ${index + 1} possui ID inválido.`,
          )
        }

        continue
      }

      if (!isUuid(row.id)) {
        throw new Error(
          `${table}: registro ${index + 1} possui ID inválido.`,
        )
      }
    }
  }

  return value as unknown as BackupFile
}

export default function Backup() {
  const { isAdmin, loading: authLoading } = useAuth()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [lastBackup, setLastBackup] = useState<{
    date: string
    size: number
    counts: Record<string, number>
  } | null>(null)

  const [selectedFile, setSelectedFile] = useState<BackupFile | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [restoreConfirmation, setRestoreConfirmation] = useState('')

  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([])
  const [loadingSnapshots, setLoadingSnapshots] = useState(false)
  const [snapshotError, setSnapshotError] = useState('')
  const [restoringSnapshot, setRestoringSnapshot] = useState<string | null>(
    null,
  )
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null)
  const [snapshotConfirmation, setSnapshotConfirmation] = useState('')

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const loadSnapshots = useCallback(async () => {
    if (!isAdmin) return

    setLoadingSnapshots(true)
    setSnapshotError('')

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'list_backup_snapshots',
      )

      if (rpcError) throw rpcError

      if (!Array.isArray(data)) {
        throw new Error('O banco retornou um histórico inválido.')
      }

      setSnapshots(data as BackupSnapshot[])
    } catch (err) {
      console.error('Erro detalhado ao carregar histórico:', err)

      setSnapshotError(
        getErrorMessage(
          err,
          'Não foi possível carregar o histórico de backups.',
        ),
      )
    } finally {
      setLoadingSnapshots(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (authLoading || !isAdmin) return

    const timer = window.setTimeout(() => {
      void loadSnapshots()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [authLoading, isAdmin, loadSnapshots])

  async function fetchAllRows(table: (typeof TABLES)[number]) {
    const pageSize = 1000
    let from = 0
    const allRows: Record<string, unknown>[] = []

    while (true) {
      const { data, error: queryError } = await supabase
        .from(table)
        .select('*')
        .range(from, from + pageSize - 1)

      if (queryError) {
        throw new Error(
          `Falha ao consultar ${table}: ${queryError.message}`,
        )
      }

      const rows = data ?? []
      allRows.push(...(rows as Record<string, unknown>[]))

      if (rows.length < pageSize) break

      from += pageSize
    }

    return allRows
  }

  async function handleExport() {
    if (!isAdmin || exporting) return

    setExporting(true)
    setError('')
    setSuccess('')

    try {
      const [
        essences,
        contracts,
        subjugations,
        dahlia_config,
        audit_logs,
      ] = await Promise.all(TABLES.map((table) => fetchAllRows(table)))

      const data: BackupData = {
        essences,
        contracts,
        subjugations,
        dahlia_config,
        audit_logs,
      }

      const exportedAt = new Date().toISOString()

      const backup: BackupFile = {
        application: 'Maleficonomicon',
        formatVersion: 1,
        exportedAt,
        data,
      }

      const json = JSON.stringify(backup, null, 2)

      const blob = new Blob([json], {
        type: 'application/json;charset=utf-8',
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      const datePart = exportedAt
        .replace(/:/g, '-')
        .replace(/\.\d{3}Z$/, 'Z')

      link.href = url
      link.download = `maleficonomicon-backup-${datePart}.json`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.setTimeout(() => URL.revokeObjectURL(url), 1000)

      const counts = {
        Essências: data.essences.length,
        Contratos: data.contracts.length,
        Subjugações: data.subjugations.length,
        Configurações: data.dahlia_config.length,
        'Registros de auditoria': data.audit_logs.length,
      }

      setLastBackup({
        date: exportedAt,
        size: blob.size,
        counts,
      })

      setSuccess('Backup gerado e baixado com sucesso.')
    } catch (err) {
      console.error('Erro detalhado ao gerar backup:', err)

      setError(
        getErrorMessage(err, 'Não foi possível gerar o backup.'),
      )
    } finally {
      setExporting(false)
    }
  }

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    setError('')
    setSuccess('')
    setSelectedFile(null)
    setSelectedFileName('')
    setRestoreConfirmation('')

    if (!file) return

    if (file.size > MAX_BACKUP_SIZE) {
      setError('O arquivo excede o limite de 40 MB.')
      event.target.value = ''
      return
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Selecione um arquivo JSON de backup.')
      event.target.value = ''
      return
    }

    try {
      const content = await file.text()
      const parsed: unknown = JSON.parse(content)
      const validated = validateBackupFile(parsed)

      setSelectedFile(validated)
      setSelectedFileName(file.name)
      setSuccess(
        'Arquivo validado com sucesso. Confira os dados antes de restaurar.',
      )
    } catch (err) {
      console.error('Erro ao validar backup:', err)

      setError(
        getErrorMessage(
          err,
          'Não foi possível validar o arquivo selecionado.',
        ),
      )

      event.target.value = ''
    }
  }

  async function handleRestore() {
    if (!isAdmin || !selectedFile || restoring) return

    if (restoreConfirmation !== 'RESTAURAR') {
      setError('Digite RESTAURAR para confirmar a operação.')
      return
    }

    const confirmed = window.confirm(
      'ATENÇÃO: a restauração substituirá os dados atuais do Maleficonomicon. Um snapshot do estado atual será preservado pelo banco antes da substituição. Deseja continuar?',
    )

    if (!confirmed) return

    setRestoring(true)
    setError('')
    setSuccess('')

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'restore_maleficonomicon_backup',
        {
          p_backup: selectedFile,
        },
      )

      if (rpcError) throw rpcError

      if (isObject(data) && data.success === false) {
        throw new Error('O banco não confirmou a restauração.')
      }

      setSuccess(
        'Backup restaurado com sucesso. O estado anterior foi preservado no histórico de snapshots.',
      )

      setSelectedFile(null)
      setSelectedFileName('')
      setRestoreConfirmation('')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      await loadSnapshots()
    } catch (err) {
      console.error('Erro detalhado ao restaurar backup:', err)

      setError(
        getErrorMessage(
          err,
          'Não foi possível restaurar o backup.',
        ),
      )
    } finally {
      setRestoring(false)
    }
  }

  async function handleSnapshotRestore() {
    if (!isAdmin || !selectedSnapshot || restoringSnapshot) return

    if (snapshotConfirmation !== 'RECUPERAR') {
      setSnapshotError('Digite RECUPERAR para confirmar a operação.')
      return
    }

    const confirmed = window.confirm(
      'ATENÇÃO: os dados atuais serão substituídos pelos dados deste snapshot. O estado atual também será preservado em um novo snapshot antes da restauração. Deseja continuar?',
    )

    if (!confirmed) return

    setRestoringSnapshot(selectedSnapshot)
    setSnapshotError('')
    setSuccess('')

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'restore_backup_snapshot',
        {
          p_snapshot_id: selectedSnapshot,
        },
      )

      if (rpcError) throw rpcError

      if (!isObject(data) || data.success !== true) {
        throw new Error('O banco não confirmou a recuperação do snapshot.')
      }

      setSuccess(
        'Snapshot recuperado com sucesso. O estado anterior foi preservado no histórico.',
      )

      setSelectedSnapshot(null)
      setSnapshotConfirmation('')

      await loadSnapshots()
    } catch (err) {
      console.error('Erro detalhado ao recuperar snapshot:', err)

      setSnapshotError(
        getErrorMessage(
          err,
          'Não foi possível recuperar este snapshot.',
        ),
      )
    } finally {
      setRestoringSnapshot(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={28} />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
        <div className="flex items-center gap-3 text-red-400">
          <ShieldCheck size={22} />
          <h2 className="font-medium">Acesso restrito</h2>
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          Somente o mestre pode acessar a Central de Backup.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* CABEÇALHO */}

      <div>
        <h1 className="font-serif text-3xl text-white md:text-4xl">
          Backup e snapshots
        </h1>

        <p className="mt-2 text-sm text-[#A1A1AA]">
          Exporte, restaure e preserve versões da progressão do Maleficonomicon.
        </p>
      </div>

      {/* AÇÕES PRINCIPAIS */}

      <section className="grid gap-4 lg:grid-cols-2">
        {/* GERAR BACKUP */}

        <div className="flex flex-col rounded-lg border border-[#3F3F46] bg-[#111113] p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-900/50 bg-amber-950/20">
            <Download size={19} className="text-amber-500" />
          </div>

          <h2 className="font-serif text-xl text-white">
            Gerar backup
          </h2>

          <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">
            Baixe um JSON com essências, contratos, subjugações,
            configurações e registros de auditoria.
          </p>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 flex w-full items-center justify-center gap-2 self-start rounded-md border border-amber-700/60 bg-amber-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {exporting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Gerando backup...
              </>
            ) : (
              <>
                <Download size={17} />
                Gerar backup JSON
              </>
            )}
          </button>

          {lastBackup && (
            <div className="mt-4 rounded-md border border-[#3F3F46] bg-[#09090B] p-3">
              <p className="text-xs font-medium text-[#E4E4E7]">
                Último backup gerado nesta sessão
              </p>
              <p className="mt-1 text-[11px] text-[#A1A1AA]">
                {formatDate(lastBackup.date)} · {formatBytes(lastBackup.size)}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(lastBackup.counts).map(([label, count]) => (
                  <span key={label} className="text-[10px] text-[#71717A]">
                    {label}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RESTAURAR BACKUP */}

        <div className="flex flex-col rounded-lg border border-[#3F3F46] bg-[#111113] p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-900/50 bg-amber-950/20">
            <Upload size={19} className="text-amber-500" />
          </div>

          <h2 className="font-serif text-xl text-white">
            Restaurar backup
          </h2>

          <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">
            Importe um JSON gerado pelo Maleficonomicon. Antes da restauração,
            você poderá revisar os dados e confirmar a operação.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelection}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            className="mt-4 flex items-center justify-center gap-2 self-start rounded-md border border-[#52525B] bg-[#18181B] px-4 py-2.5 text-sm text-[#E4E4E7] transition hover:border-amber-700/60 hover:bg-[#27272A] disabled:opacity-50"
          >
            <FileJson size={17} />
            Selecionar arquivo JSON
          </button>

          {selectedFile && (
            <div className="mt-4 rounded-md border border-[#3F3F46] bg-[#09090B] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                <CheckCircle2 size={15} />
                Arquivo validado
              </div>

              <p className="mt-2 break-all text-xs text-[#E4E4E7]">
                {selectedFileName}
              </p>

              <p className="mt-1 text-[11px] text-[#71717A]">
                Exportado em: {formatDate(selectedFile.exportedAt)}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TABLES.map((table) => (
                  <div
                    key={table}
                    className="rounded border border-[#27272A] bg-[#111113] p-2"
                  >
                    <p className="text-base font-semibold text-white">
                      {selectedFile.data[table].length}
                    </p>
                    <p className="text-[10px] text-[#A1A1AA]">
                      {TABLE_LABELS[table]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-md border border-red-900/40 bg-red-950/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
                  <p className="text-[11px] leading-5 text-red-300">
                    A restauração substituirá os dados atuais. O estado atual
                    será preservado automaticamente em um snapshot antes da
                    substituição.
                  </p>
                </div>
              </div>

              <label className="mt-3 block text-xs font-medium text-[#A1A1AA]">
                Digite RESTAURAR para confirmar
              </label>

              <input
                type="text"
                value={restoreConfirmation}
                onChange={(event) => setRestoreConfirmation(event.target.value)}
                placeholder="RESTAURAR"
                disabled={restoring}
                className="mt-2 w-full rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#52525B] focus:border-amber-600"
              />

              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring || restoreConfirmation !== 'RESTAURAR'}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-red-900/80 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {restoring ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Restaurando dados...
                  </>
                ) : (
                  <>
                    <RotateCcw size={17} />
                    Restaurar backup
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* MENSAGENS DE ESTADO */}

      {(error || success) && (
        <div
          className={`rounded-md border p-3 text-xs ${
            error
              ? 'border-red-900/50 bg-red-950/20 text-red-400'
              : 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {error ? (
              <AlertTriangle size={15} />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {error || success}
          </div>
        </div>
      )}

      {/* SNAPSHOTS */}

      <section className="rounded-lg border border-[#3F3F46] bg-[#111113] p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.25em] text-amber-500">
              <span className="h-px w-5 bg-amber-600" />
              Versões da progressão
            </div>

            <h2 className="font-serif text-xl text-white">
              Snapshots
            </h2>

            <p className="mt-1 text-xs text-[#A1A1AA]">
              Preserve versões para poder retornar a um estado anterior.
            </p>
          </div>

          <div className="rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs font-medium text-amber-500">
            {snapshots.length} / 5
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#71717A]">
            Os snapshots são criados automaticamente antes de cada restauração.
          </p>

          <button
            type="button"
            onClick={() => void loadSnapshots()}
            disabled={loadingSnapshots}
            className="flex items-center gap-2 rounded-md border border-[#52525B] px-3 py-2 text-xs text-[#D4D4D8] transition hover:bg-[#27272A] disabled:opacity-50"
          >
            {loadingSnapshots ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Atualizar
          </button>
        </div>

        {snapshotError && (
          <div className="mb-4 rounded-md border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-400">
            {snapshotError}
          </div>
        )}

        {loadingSnapshots && snapshots.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center gap-2 text-xs text-[#A1A1AA]">
            <Loader2 size={17} className="animate-spin" />
            Carregando snapshots...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="rounded-md border border-[#27272A] bg-[#09090B] p-6 text-center">
            <History size={24} className="mx-auto text-[#71717A]" />
            <p className="mt-3 text-sm text-[#D4D4D8]">
              Nenhum snapshot registrado.
            </p>
            <p className="mt-1 text-xs text-[#71717A]">
              Um snapshot será criado automaticamente antes da primeira restauração.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-[#3F3F46]">
            {snapshots.map((snapshot, index) => {
              const isSelected = selectedSnapshot === snapshot.id
              const isRestoring = restoringSnapshot === snapshot.id

              return (
                <div
                  key={snapshot.id}
                  className={`bg-[#09090B] p-3 ${
                    index < snapshots.length - 1 ? 'border-b border-[#3F3F46]' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-900/40 bg-amber-950/20">
                        <Clock size={17} className="text-amber-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#E4E4E7]">
                          Snapshot da progressão
                        </p>
                        <p className="mt-1 text-[10px] text-[#A1A1AA]">
                          {formatDate(snapshot.created_at)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSnapshot(isSelected ? null : snapshot.id)
                        setSnapshotConfirmation('')
                        setSnapshotError('')
                      }}
                      disabled={Boolean(restoringSnapshot)}
                      className="flex shrink-0 items-center gap-2 rounded-md border border-[#52525B] px-3 py-2 text-xs text-[#D4D4D8] transition hover:border-amber-700/60 hover:bg-[#18181B] disabled:opacity-50"
                    >
                      <RotateCcw size={14} />
                      {isSelected ? 'Cancelar' : 'Restaurar'}
                    </button>
                  </div>

                  {isSelected && (
                    <div className="mt-3 rounded-md border border-red-900/40 bg-red-950/10 p-3">
                      <p className="text-[11px] leading-5 text-red-300">
                        A recuperação substituirá os dados atuais pelos dados
                        deste snapshot. O estado atual também será preservado
                        em um novo snapshot antes da recuperação.
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {(
                          [
                            ['Essências', snapshot.counts.essences],
                            ['Contratos', snapshot.counts.contracts],
                            ['Subjugações', snapshot.counts.subjugations],
                            ['Configuração', snapshot.counts.dahlia_config],
                            ['Auditoria', snapshot.counts.audit_logs],
                          ] as [string, number][]
                        ).map(([label, count]) => (
                          <div
                            key={label}
                            className="rounded border border-[#3F3F46] bg-[#111113] p-2"
                          >
                            <p className="text-base font-semibold text-white">
                              {count}
                            </p>
                            <p className="text-[10px] text-[#A1A1AA]">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-3 break-all text-[10px] text-[#71717A]">
                        ID: {snapshot.id} · Administrador: {snapshot.created_by}
                      </p>

                      <label className="mt-3 block text-xs font-medium text-[#A1A1AA]">
                        Digite RECUPERAR para confirmar
                      </label>

                      <input
                        type="text"
                        value={snapshotConfirmation}
                        onChange={(event) =>
                          setSnapshotConfirmation(event.target.value)
                        }
                        placeholder="RECUPERAR"
                        disabled={isRestoring}
                        className="mt-2 w-full rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#52525B] focus:border-red-700"
                      />

                      <button
                        type="button"
                        onClick={handleSnapshotRestore}
                        disabled={
                          isRestoring ||
                          snapshotConfirmation !== 'RECUPERAR'
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-red-900/80 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                      >
                        {isRestoring ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Recuperando snapshot...
                          </>
                        ) : (
                          <>
                            <RotateCcw size={15} />
                            Confirmar recuperação
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-md border border-[#3F3F46] bg-[#09090B] p-3">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[10px] leading-5 text-[#A1A1AA]">
            A criação de um sexto snapshot remove automaticamente o mais antigo.
            Restaurar um snapshot não o remove da lista.
          </p>
        </div>
      </section>
    </div>
  )
}
