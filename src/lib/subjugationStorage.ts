
import { supabase } from './supabase'
import type { Subjugation } from '../types/subjugation'

const STORAGE_KEY = 'maleficonomicon_subjugations'

interface SubjugationDatabase {
  id: string
  name: string
  image_url: string | null
  challenge_rating: string
  description: string
  discovery_status: Subjugation['discoveryStatus']
  is_alive: boolean
  external_url: string | null
  subjugated_date: string | null
  dhalia_level?: number | null
  created_at: string
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function parseDate(value?: string): string | null {
  if (!value) return null

  const brazilianDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (brazilianDate) {
    return `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  return null
}

function formatDate(value: string | null): string | undefined {
  if (!value) return undefined

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) return value

  return `${match[3]}/${match[2]}/${match[1]}`
}

function mapDatabaseSubjugation(
  creature: SubjugationDatabase,
): Subjugation {
  return {
    id: creature.id,
    name: creature.name,
    imageUrl: creature.image_url ?? undefined,
    challengeRating: creature.challenge_rating,
    description: creature.description,
    discoveryStatus: creature.discovery_status,
    isAlive: creature.is_alive,
    externalUrl: creature.external_url ?? undefined,
    subjugatedDate: formatDate(creature.subjugated_date),
    dhaliaLevel: creature.dhalia_level ?? undefined,
    createdAt: new Date(creature.created_at).getTime(),
  }
}

function mapSubjugationToDatabase(creature: Subjugation) {
  return {
    id: isValidUUID(creature.id) ? creature.id : crypto.randomUUID(),
    name: creature.name,
    image_url: creature.imageUrl || null,
    challenge_rating: creature.challengeRating,
    description: creature.description,
    discovery_status: creature.discoveryStatus,
    is_alive: creature.isAlive,
    external_url: creature.externalUrl || null,
    subjugated_date: parseDate(creature.subjugatedDate),
    dhalia_level: creature.dhaliaLevel ?? null,
    created_at: new Date(creature.createdAt).toISOString(),
  }
}

async function isCurrentUserAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')

  if (error) {
    console.error('Erro ao verificar permissões administrativas:', error)
    throw new Error('Não foi possível verificar as permissões do usuário.', {
      cause: error,
    })
  }

  return data === true
}

function getLegacySubjugations(): Subjugation[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)

    if (!storedData) return []

    const parsedData: unknown = JSON.parse(storedData)

    if (!Array.isArray(parsedData)) return []

    return parsedData.map((item: Record<string, unknown>) => {
      const discoveryStatus =
        item.discoveryStatus ??
        (item.isSubjugated === true ? 'Subjugada' : 'Descoberta')

      return {
        ...item,
        id:
          typeof item.id === 'string' && isValidUUID(item.id)
            ? item.id
            : crypto.randomUUID(),
        discoveryStatus,
        isAlive:
          typeof item.isAlive === 'boolean' ? item.isAlive : true,
        createdAt:
          typeof item.createdAt === 'number'
            ? item.createdAt
            : Date.now(),
      } as Subjugation
    })
  } catch (error) {
    console.error('Erro ao ler registros antigos de subjugação:', error)

    throw new Error(
      'Não foi possível ler os registros antigos de subjugação.',
      { cause: error },
    )
  }
}

async function migrateLegacySubjugations(): Promise<void> {
  const legacySubjugations = getLegacySubjugations()

  if (legacySubjugations.length === 0) return

  const records = legacySubjugations.map(mapSubjugationToDatabase)

  const { error } = await supabase
    .from('subjugations')
    .insert(records)

  if (error) {
    console.error('Erro ao migrar registros antigos:', error)

    throw new Error(
      'Não foi possível migrar os registros antigos de subjugação.',
      { cause: error },
    )
  }

  console.info(
    `${records.length} registro(s) de subjugação migrado(s) para o Supabase.`,
  )
}

export async function getSubjugations(): Promise<Subjugation[]> {
  const isAdmin = await isCurrentUserAdmin()

  if (isAdmin) {
    const { data, error } = await supabase
      .from('subjugations')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao carregar subjugados:', error)

      throw new Error(
        'Não foi possível carregar os registros de subjugação.',
        { cause: error },
      )
    }

    if ((data ?? []).length === 0) {
      await migrateLegacySubjugations()

      const { data: migratedData, error: migratedError } = await supabase
        .from('subjugations')
        .select('*')
        .order('created_at', { ascending: true })

      if (migratedError) {
        throw new Error(
          'Não foi possível carregar os registros migrados.',
          { cause: migratedError },
        )
      }

      return (migratedData as SubjugationDatabase[]).map(
        mapDatabaseSubjugation,
      )
    }

    return (data as SubjugationDatabase[]).map(
      mapDatabaseSubjugation,
    )
  }

  const { data, error } = await supabase
    .from('public_subjugations')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao carregar subjugados públicos:', error)

    throw new Error(
      'Não foi possível carregar os registros de subjugação.',
      { cause: error },
    )
  }

  return (data as SubjugationDatabase[]).map(
    mapDatabaseSubjugation,
  )
}

export async function saveSubjugation(
  creature: Subjugation,
): Promise<Subjugation> {
  const databaseCreature = mapSubjugationToDatabase(creature)

  const { data, error } = await supabase
    .from('subjugations')
    .upsert(databaseCreature)
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar subjugação:', error)

    throw new Error(
      'Não foi possível salvar o registro de subjugação.',
      { cause: error },
    )
  }

  return mapDatabaseSubjugation(data as SubjugationDatabase)
}

export async function deleteSubjugation(id: string): Promise<void> {
  const { error } = await supabase
    .from('subjugations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir subjugação:', error)

    throw new Error(
      'Não foi possível excluir o registro de subjugação.',
      { cause: error },
    )
  }
}
