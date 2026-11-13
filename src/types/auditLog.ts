
export type AuditEntityType =
  | 'Essência'
  | 'Contrato'
  | 'Subjugação'
  | 'Configuração'

export type AuditAction =
  | 'Criado'
  | 'Editado'
  | 'Excluído'
  | 'Ativado'
  | 'Desativado'
  | 'Descoberta alterada'
  | 'Vitalidade alterada'
  | 'Nível alterado'

export interface AuditLog {
  id: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  entityName: string
  description: string
  oldData?: unknown
  newData?: unknown
  createdAt: number
}

export type AuditLogFormData = Omit<
  AuditLog,
  'id' | 'createdAt'
>
