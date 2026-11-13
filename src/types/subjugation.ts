
export type CreatureDiscoveryStatus =
  | 'Não descoberta'
  | 'Descoberta'
  | 'Subjugada'

export interface Subjugation {
  id: string

  // Identificação da criatura
  name: string
  imageUrl?: string
  challengeRating: string
  description: string

  // Estado de conhecimento e subjugação
  discoveryStatus: CreatureDiscoveryStatus

  // Vitalidade independente da subjugação
  isAlive: boolean

  // Direcionamento externo (utilizado somente quando subjugada)
  externalUrl?: string

  // Informações sobre a subjugação
  subjugatedDate?: string
  dhaliaLevel?: number

  // Data técnica de criação do registro
  createdAt: number
}

export type SubjugationFormData = Omit<
  Subjugation,
  'id' | 'createdAt'
>
