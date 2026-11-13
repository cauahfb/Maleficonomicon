
import type { Contract } from '../types/contract'

const STORAGE_KEY = 'maleficonomicon_contracts'

export function getContracts(): Contract[] | null {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)

    if (storedData === null) {
      return null
    }

    const parsedData: unknown = JSON.parse(storedData)

    if (!Array.isArray(parsedData)) {
      return null
    }

    return parsedData as Contract[]
  } catch (error) {
    console.error('Erro ao carregar contratos:', error)
    return null
  }
}

export function saveContracts(contracts: Contract[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(contracts),
    )
  } catch (error) {
    console.error('Erro ao salvar contratos:', error)

    throw new Error(
      'Não foi possível salvar os contratos no navegador.',
      { cause: error },
    )
  }
}
