
import type { Essence } from '../types/essence'

const STORAGE_KEY = 'maleficonomicon_essences'

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

export function getEssences(): Essence[] | null {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)

    // null significa que ainda não existe uma biblioteca salva.
    if (storedData === null) {
      return null
    }

    const parsedData: unknown = JSON.parse(storedData)

    if (!Array.isArray(parsedData)) {
      return null
    }

    return parsedData.map((item) =>
      normalizeEssence(item as Partial<Essence>),
    )
  } catch (error) {
    console.error('Erro ao carregar essências:', error)
    return null
  }
}

export function saveEssences(essences: Essence[]): void {
  try {
    const normalizedEssences = essences.map(normalizeEssence)

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizedEssences),
    )
  } catch (error) {
    console.error('Erro ao salvar essências:', error)

    throw new Error(
      'Não foi possível salvar as essências no navegador.',
      { cause: error },
    )
  }
}
