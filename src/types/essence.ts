
export type EssenceNature = 'Demônio' | 'Diabo'

export type EssenceStatus =
  | 'Registrado'
  | 'Contratado'
  | 'Subjugado'
  | 'Erradicado'

export interface Essence {
  id: string
  name: string
  titles: string[]
  trueName?: string
  nature: EssenceNature
  hierarchy: string
  status: EssenceStatus
  imageUrl?: string
  registrationDate: string
  createdAt: number
  description: string
}

export type EssenceFormData = Omit<Essence, 'id' | 'createdAt'>
