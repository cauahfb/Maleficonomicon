
import type { Subjugation } from '../types/subjugation'

const STORAGE_KEY = 'maleficonomicon_subjugations'

export function getSubjugations(): Subjugation[] | null {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)

    if (storedData === null) {
      return null
    }

    const parsedData: unknown = JSON.parse(storedData)

    if (!Array.isArray(parsedData)) {
      return null
    }

    return parsedData as Subjugation[]
  } catch (error) {
    console.error('Erro ao carregar subjugados:', error)
    return null
  }
}

export function saveSubjugations(
  subjugations: Subjugation[],
): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(subjugations),
    )
  } catch (error) {
    console.error('Erro ao salvar subjugados:', error)

    throw new Error(
      'Não foi possível salvar os registros de subjugação.',
      { cause: error },
    )
  }
}
