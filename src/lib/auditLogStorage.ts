
import type {
  AuditLog,
  AuditLogFormData,
} from '../types/auditLog'

const STORAGE_KEY = 'maleficonomicon_audit_logs'

export function getAuditLogs(): AuditLog[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)

    if (storedData === null) return []

    const parsedData: unknown = JSON.parse(storedData)

    if (!Array.isArray(parsedData)) return []

    return parsedData as AuditLog[]
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
    return []
  }
}

export function saveAuditLogs(logs: AuditLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch (error) {
    console.error('Erro ao salvar histórico:', error)

    throw new Error(
      'Não foi possível salvar o histórico administrativo.',
      { cause: error },
    )
  }
}

export function addAuditLog(data: AuditLogFormData): void {
  const newLog: AuditLog = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  }

  const currentLogs = getAuditLogs()

  saveAuditLogs([newLog, ...currentLogs])
}
