const STORAGE_KEY = 'maleficonomicon_dahlia_config'

export function getDahliaLevel(): number | null {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)

    if (storedData === null) return null

    const parsedData: unknown = JSON.parse(storedData)

    if (
      typeof parsedData !== 'number' ||
      !Number.isInteger(parsedData) ||
      parsedData < 1 ||
      parsedData > 20
    ) {
      return null
    }

    return parsedData
  } catch (error) {
    console.error('Erro ao carregar nível de Dahlia:', error)
    return null
  }
}

export function saveDahliaLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error('O nível de Dahlia deve estar entre 1 e 20.')
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(level))
  } catch (error) {
    console.error('Erro ao salvar nível de Dahlia:', error)
    throw new Error('Não foi possível salvar o nível de Dahlia.', {
      cause: error,
    })
  }
}