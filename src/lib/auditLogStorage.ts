
import { supabase } from './supabase'

import type {
  AuditLog,
  AuditLogFormData,
} from '../types/auditLog'

interface AuditLogDatabase {
  id: string
  action: AuditLog['action']
  entity_type: AuditLog['entityType']
  entity_id: string | null
  entity_name: string
  description: string
  old_data: unknown
  new_data: unknown
  created_at: string
}

const MAX_AUDIT_LOGS = 30

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function mapDatabaseLog(log: AuditLogDatabase): AuditLog {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id ?? '',
    entityName: log.entity_name,
    description: log.description,
    oldData: log.old_data ?? undefined,
    newData: log.new_data ?? undefined,
    createdAt: new Date(log.created_at).getTime(),
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(
      'id, action, entity_type, entity_id, entity_name, description, old_data, new_data, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(MAX_AUDIT_LOGS)

  if (error) {
    console.error('Erro ao carregar histórico:', error)
    throw new Error('Não foi possível carregar o histórico administrativo.', {
      cause: error,
    })
  }

  return (data as AuditLogDatabase[]).map(mapDatabaseLog)
}

export async function addAuditLog(
  data: AuditLogFormData,
): Promise<void> {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      action: data.action,
      entity_type: data.entityType,
      entity_id: isValidUUID(data.entityId)
        ? data.entityId
        : null,
      entity_name: data.entityName,
      description: data.description,
      old_data: data.oldData ?? null,
      new_data: data.newData ?? null,
    })

  if (error) {
    console.error('Erro ao registrar histórico:', error)
    throw new Error('Não foi possível registrar a atividade administrativa.', {
      cause: error,
    })
  }
}
