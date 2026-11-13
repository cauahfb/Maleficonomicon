
import { supabase } from './supabase'

const STORAGE_KEY = 'maleficonomicon_dahlia_config'

interface DahliaConfigDatabase {
  id: boolean
  level: number
  updated_at: string
}

function isValidLevel(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 20
  )
}

function getLegacyLevel(): number | null {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)

    if (storedData === null) return null

    const parsedData: unknown = JSON.parse(storedData)

    return isValidLevel(parsedData) ? parsedData : null
  } catch (error) {
    console.error('Erro ao recuperar nível antigo da Dhalia:', error)
    return null
  }
}

export async function getDahliaLevel(): Promise<number | null> {
  const { data, error } = await supabase
    .from('dahlia_config')
    .select('id, level, updated_at')
    .eq('id', true)
    .maybeSingle()

  if (error) {
    console.error('Erro ao carregar nível da Dhalia:', error)
    throw new Error('Não foi possível carregar o nível da Dhalia.', {
      cause: error,
    })
  }

  if (data) {
    const config = data as DahliaConfigDatabase

    return isValidLevel(config.level) ? config.level : null
  }

  // Recupera dados antigos do navegador caso a tabela esteja vazia.
  const legacyLevel = getLegacyLevel()

  if (legacyLevel === null) return null

  await saveDahliaLevel(legacyLevel)

  return legacyLevel
}

export async function saveDahliaLevel(level: number): Promise<void> {
  if (!isValidLevel(level)) {
    throw new Error('O nível da Dhalia deve estar entre 1 e 20.')
  }

  const { error } = await supabase
    .from('dahlia_config')
    .upsert(
      {
        id: true,
        level,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      },
    )

  if (error) {
    console.error('Erro ao salvar nível da Dhalia:', error)
    throw new Error('Não foi possível salvar o nível da Dhalia.', {
      cause: error,
    })
  }
}
