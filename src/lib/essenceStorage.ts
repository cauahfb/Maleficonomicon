import { supabase } from './supabase'
import type { Essence } from '../types/essence'
import { getCachedData, invalidateDataCache } from './dataCache'

interface EssenceDatabase {
  id: string
  name: string
  titles: string[]
  true_name: string | null
  true_name_public: boolean
  nature: Essence['nature']
  has_individual_talisman: boolean
  individual_talisman: string | null
  hierarchy: string
  status: Essence['status']
  image_url: string | null
  registration_date: string | null
  created_at: string
  description: string
}

function normalizeEssence(data: Partial<Essence>): Essence {
  const nature = data.nature === 'Diabo' ? 'Diabo' : 'Demônio'

  const hasIndividualTalisman =
    nature === 'Diabo' && data.hasIndividualTalisman === true

  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name ?? '',
    titles: Array.isArray(data.titles) ? data.titles : [],
    trueName: data.trueName || undefined,
    trueNamePublic: data.trueNamePublic === true,
    nature,
    hasIndividualTalisman,
    individualTalisman: hasIndividualTalisman
      ? data.individualTalisman || undefined
      : undefined,
    hierarchy: data.hierarchy ?? '',
    status: data.status ?? 'Registrado',
    imageUrl: data.imageUrl || undefined,
    registrationDate: data.registrationDate ?? '',
    createdAt: data.createdAt ?? Date.now(),
    description: data.description ?? '',
  }
}

function mapDatabaseEssence(row: EssenceDatabase): Essence {
  return normalizeEssence({
    id: row.id,
    name: row.name,
    titles: row.titles,
    trueName: row.true_name ?? undefined,
    trueNamePublic: row.true_name_public,
    nature: row.nature,
    hasIndividualTalisman: row.has_individual_talisman,
    individualTalisman: row.individual_talisman ?? undefined,
    hierarchy: row.hierarchy,
    status: row.status,
    imageUrl: row.image_url ?? undefined,
    registrationDate: row.registration_date ?? '',
    createdAt: new Date(row.created_at).getTime(),
    description: row.description,
  })
}

function toDatabaseDate(value: string): string | null {
  if (!value.trim()) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const brazilianDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (brazilianDate) {
    const [, day, month, year] = brazilianDate
    return `${year}-${month}-${day}`
  }

  throw new Error(`Data de registro inválida: ${value}`)
}

function mapEssenceToDatabase(essence: Essence) {
  const normalized = normalizeEssence(essence)

  return {
    id: normalized.id,
    name: normalized.name,
    titles: normalized.titles,
    true_name: normalized.trueName ?? null,
    true_name_public: normalized.trueNamePublic,
    nature: normalized.nature,
    has_individual_talisman: normalized.hasIndividualTalisman,
    individual_talisman: normalized.individualTalisman ?? null,
    hierarchy: normalized.hierarchy,
    status: normalized.status,
    image_url: normalized.imageUrl ?? null,
    registration_date: toDatabaseDate(normalized.registrationDate),
    created_at: new Date(normalized.createdAt).toISOString(),
    description: normalized.description,
  }
}

export async function getEssences(isAdmin: boolean): Promise<Essence[]> {
  const cacheKey = `essences:${isAdmin ? 'admin' : 'player'}`

  return getCachedData(cacheKey, async () => {
    const table = isAdmin ? 'essences' : 'public_essences'
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar essências:', error)
      throw new Error('Não foi possível carregar as essências.', {
        cause: error,
      })
    }

    return (data as EssenceDatabase[]).map(mapDatabaseEssence)
  })
}

export async function saveEssences(essences: Essence[]): Promise<void> {
  if (essences.length === 0) return

  const rows = essences.map(mapEssenceToDatabase)

  const { error } = await supabase
    .from('essences')
    .upsert(rows, { onConflict: 'id' })

  if (error) {
    console.error('Erro ao salvar essências:', error)
    throw new Error('Não foi possível salvar as essências no Supabase.', {
      cause: error,
    })
  }

  invalidateDataCache('essences:')
}

export async function deleteEssence(id: string): Promise<void> {
  const { error } = await supabase
    .from('essences')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir essência:', error)
    throw new Error('Não foi possível excluir a essência do Supabase.', {
      cause: error,
    })
  }

  invalidateDataCache('essences:')
}