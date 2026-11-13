
import type { Essence } from '../types/essence'

const STORAGE_KEY = 'maleficonomicon_essences'

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

        return parsedData as Essence[]
    } catch (error) {
        console.error('Erro ao carregar essências:', error)
        return null
    }
}

export function saveEssences(essences: Essence[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(essences))
    } catch (error) {
        console.error('Erro ao salvar essências:', error)

        throw new Error(
            'Não foi possível salvar as essências no navegador.',
            { cause: error },
        )
    }
}
