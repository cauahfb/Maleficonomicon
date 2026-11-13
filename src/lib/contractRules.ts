
import type {
  Contract,
  ContractFormData,
} from '../types/contract'

import type { Essence } from '../types/essence'

const contractMilestones = [
  { level: 10, maximum: 2, active: 1 },
  { level: 13, maximum: 3, active: 2 },
  { level: 15, maximum: 4, active: 3 },
  { level: 17, maximum: 5, active: 4 },
  { level: 20, maximum: 6, active: 6 },
]

export interface ContractLimits {
  maximum: number
  active: number
}

interface ValidateSaveParams {
  contracts: Contract[]
  essences: Essence[]
  level: number | null
  editingContract: Contract | null
  data: ContractFormData
}

interface ValidateActivationParams {
  contracts: Contract[]
  essences: Essence[]
  level: number | null
  contract: Contract
}

export function getContractLimits(
  level: number | null,
): ContractLimits {
  if (level === null || level < 10) {
    return { maximum: 0, active: 0 }
  }

  const milestone = [...contractMilestones]
    .reverse()
    .find((item) => level >= item.level)

  return milestone
    ? {
        maximum: milestone.maximum,
        active: milestone.active,
      }
    : { maximum: 0, active: 0 }
}

function validateLevel(level: number | null): string | null {
  if (level === null) {
    return 'Configure o nível de Dahlia no Painel Principal antes de firmar contratos.'
  }

  if (level < 10) {
    return 'Dahlia precisa alcançar o nível 10 para firmar contratos infernais.'
  }

  return null
}

function validateEssence(
  essenceId: string | null,
  essences: Essence[],
): string | null {
  if (!essenceId) {
    return 'Este contrato não possui um Diabo vinculado. Edite o contrato e selecione uma essência.'
  }

  const essence = essences.find((item) => item.id === essenceId)

  if (!essence) {
    return 'A essência vinculada não está mais disponível. Verifique o registro do contratante.'
  }

  if (essence.nature !== 'Diabo') {
    return 'Somente uma essência classificada como Diabo pode ser contratante.'
  }

  if (essence.status === 'Erradicado') {
    return 'Este Diabo foi erradicado. Seu contrato permanece no histórico, mas não pode ser ativado novamente.'
  }

  return null
}

export function validateContractSave({
  contracts,
  essences,
  level,
  editingContract,
  data,
}: ValidateSaveParams): string | null {
  const levelError = validateLevel(level)

  if (levelError) return levelError

  const limits = getContractLimits(level)
  const isCreating = editingContract === null

  // Contratos inativos também ocupam uma vaga no limite total.
  if (isCreating && contracts.length >= limits.maximum) {
    return `Limite de contratos firmados atingido. Dahlia pode possuir no máximo ${limits.maximum} contratos neste nível.`
  }

  const isBecomingActive =
    data.status === 'Ativo' &&
    (
      isCreating ||
      editingContract.status !== 'Ativo' ||
      editingContract.essenceId !== data.essenceId
    )

  if (isBecomingActive) {
    const essenceError = validateEssence(data.essenceId, essences)

    if (essenceError) return essenceError

    const activeCount = contracts.filter(
      (contract) =>
        contract.status === 'Ativo' &&
        contract.id !== editingContract?.id,
    ).length

    if (activeCount >= limits.active) {
      return `Limite de contratos ativos atingido. Dahlia pode manter apenas ${limits.active} contrato(s) ativo(s) neste nível. Desative outro contrato antes de continuar.`
    }
  }

  return null
}

export function validateContractActivation({
  contracts,
  essences,
  level,
  contract,
}: ValidateActivationParams): string | null {
  const levelError = validateLevel(level)

  if (levelError) return levelError

  const essenceError = validateEssence(contract.essenceId, essences)

  if (essenceError) return essenceError

  const limits = getContractLimits(level)

  const activeCount = contracts.filter(
    (item) => item.status === 'Ativo',
  ).length

  if (activeCount >= limits.active) {
    return `Limite de contratos ativos atingido. Dahlia pode manter apenas ${limits.active} contrato(s) ativo(s) neste nível. Desative outro contrato antes de continuar.`
  }

  return null
}
