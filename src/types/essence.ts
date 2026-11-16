
export type EssenceNature = 'Demônio' | 'Diabo'

export const PERSONALITY_OPTIONS = [
  'Raivoso', 'Agressivo', 'Hostil', 'Cruel', 'Sádico', 'Arrogante',
  'Manipulador', 'Astuto', 'Calculista', 'Frio', 'Indiferente',
  'Amigável', 'Leal', 'Curioso', 'Temeroso', 'Imprevisível',
  'Reservado', 'Orgulhoso', 'Desconhecido',
] as const

export type EssencePersonality = (typeof PERSONALITY_OPTIONS)[number]

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
  trueNamePublic: boolean
  nature: EssenceNature
  personality?: EssencePersonality | ''
  hasIndividualTalisman: boolean
  individualTalisman?: string
  hierarchy: string
  status: EssenceStatus
  imageUrl?: string
  registrationDate: string
  createdAt: number
  description: string
}

export type EssenceFormData = Omit<Essence, 'id' | 'createdAt'>
