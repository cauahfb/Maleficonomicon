
export type ContractStatus = 'Ativo' | 'Inativo'

export interface Contract {
  id: string

  name: string

  // Referência à essência cadastrada.
  // Pode ser null caso a essência seja excluída.
  essenceId: string | null

  // Cópia histórica do nome do contratante.
  contractorName: string

  description: string

  imageUrl?: string

  offer: string

  price: string

  clauses: string

  status: ContractStatus

  // Data livre, informada pela administradora.
  signedDate: string

  // Datas técnicas automáticas.
  createdAt: number
  updatedAt: number
}

// Dados necessários para criar ou editar um contrato.
export type ContractFormData = Omit<
  Contract,
  'id' | 'createdAt' | 'updatedAt'
>
