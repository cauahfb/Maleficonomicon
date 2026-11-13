
import { supabase } from './supabase'
import type { Contract } from '../types/contract'

const STORAGE_KEY = 'maleficonomicon_contracts'
const MIGRATION_KEY = 'maleficonomicon_contracts_migrated'

interface ContractDatabase {
  id: string
  name: string
  essence_id: string | null
  contractor_name: string
  description: string
  image_url: string | null
  offer: string
  price: string
  clauses: string
  status: Contract['status']
  signed_date: string | null
  created_at: string
  updated_at: string
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function parseSignedDate(value: string): string | null {
  if (!value) return null

  const brazilianDate = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  )

  if (brazilianDate) {
    return `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  return null
}

function formatSignedDate(value: string | null): string {
  if (!value) return ''

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) return value

  return `${match[3]}/${match[2]}/${match[1]}`
}

function mapDatabaseContract(
  contract: ContractDatabase,
): Contract {
  return {
    id: contract.id,
    name: contract.name,
    essenceId: contract.essence_id,
    contractorName: contract.contractor_name,
    description: contract.description,
    imageUrl: contract.image_url ?? undefined,
    offer: contract.offer,
    price: contract.price,
    clauses: contract.clauses,
    status: contract.status,
    signedDate: formatSignedDate(contract.signed_date),
    createdAt: new Date(contract.created_at).getTime(),
    updatedAt: new Date(contract.updated_at).getTime(),
  }
}

function mapContractToDatabase(
  contract: Contract,
  validEssenceIds?: Set<string>,
) {
  const essenceId =
    contract.essenceId && isValidUUID(contract.essenceId)
      ? contract.essenceId
      : null

  return {
    id: isValidUUID(contract.id)
      ? contract.id
      : crypto.randomUUID(),
    name: contract.name,
    essence_id:
      essenceId &&
        (!validEssenceIds || validEssenceIds.has(essenceId))
        ? essenceId
        : null,
    contractor_name: contract.contractorName,
    description: contract.description,
    image_url: contract.imageUrl ?? null,
    offer: contract.offer,
    price: contract.price,
    clauses: contract.clauses,
    status: contract.status,
    signed_date: parseSignedDate(contract.signedDate),
    created_at: new Date(contract.createdAt).toISOString(),
    updated_at: new Date(contract.updatedAt).toISOString(),
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

function getLegacyContracts(): Contract[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)

    if (!storedData) return []

    const parsedData: unknown = JSON.parse(storedData)

    if (!Array.isArray(parsedData)) return []

    return parsedData as Contract[]
  } catch (error) {
    console.error('Erro ao ler contratos antigos:', error)

    throw new Error(
      'Não foi possível ler os contratos armazenados no navegador.',
      { cause: error },
    )
  }
}

async function migrateLegacyContracts(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY) === 'true') {
    return
  }

  const legacyContracts = getLegacyContracts()

  if (legacyContracts.length === 0) {
    return
  }

  const { data: essences, error: essenceError } = await supabase
    .from('essences')
    .select('id')

  if (essenceError) {
    console.error('Erro ao consultar essências:', essenceError)

    throw new Error(
      'Não foi possível verificar os vínculos dos contratos com as essências.',
      { cause: essenceError },
    )
  }

  const validEssenceIds = new Set(
    (essences ?? []).map((essence) => essence.id),
  )

  const contractsToMigrate = legacyContracts.map((contract) =>
    mapContractToDatabase(contract, validEssenceIds),
  )

  const { error } = await supabase
    .from('contracts')
    .upsert(contractsToMigrate, {
      onConflict: 'id',
      ignoreDuplicates: true,
    })

  if (error) {
    console.error('Erro ao migrar contratos antigos:', error)

    throw new Error(
      'Não foi possível migrar os contratos antigos.',
      { cause: error },
    )
  }

  localStorage.setItem(MIGRATION_KEY, 'true')

  console.info(
    `${contractsToMigrate.length} contrato(s) verificado(s) na migração para o Supabase.`,
  )
}

export async function getContracts(): Promise<Contract[]> {
  const isAdmin = await isCurrentUserAdmin()

  if (isAdmin) {
    await migrateLegacyContracts()
  }

  const table = isAdmin ? 'contracts' : 'public_contracts'

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar contratos:', error)

    throw new Error('Não foi possível carregar os contratos.', {
      cause: error,
    })
  }

  return (data as ContractDatabase[]).map(mapDatabaseContract)
}

export async function saveContract(
  contract: Contract,
): Promise<Contract> {
  const databaseContract = mapContractToDatabase(contract)

  const { data, error } = await supabase
    .from('contracts')
    .upsert(databaseContract)
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar contrato:', error)

    throw new Error('Não foi possível salvar o contrato.', {
      cause: error,
    })
  }

  return mapDatabaseContract(data as ContractDatabase)
}

export async function toggleContractStatus(
  id: string,
): Promise<Contract['status']> {
  const { data, error } = await supabase.rpc(
    'toggle_contract_status',
    {
      p_contract_id: id,
    },
  )

  if (error) {
    console.error('Erro ao alterar estado do contrato:', error)

    throw new Error(
      error.message || 'Não foi possível alterar o estado do contrato.',
      { cause: error },
    )
  }

  if (data !== 'Ativo' && data !== 'Inativo') {
    throw new Error('O banco retornou um estado de contrato inválido.')
  }

  return data
}

export async function deleteContract(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir contrato:', error)

    throw new Error('Não foi possível excluir o contrato.', {
      cause: error,
    })
  }
}
