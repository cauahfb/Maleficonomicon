
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  Flame,
  ScrollText,
  CalendarDays,
  Eye,
  X,
  ChevronDown,
  CircleCheck,
  CircleX,
  Plus,
  Pencil,
  Trash2,
  Power,
} from 'lucide-react'

import type {
  Contract,
  ContractFormData,
  ContractStatus,
} from '../types/contract'

import type { Essence } from '../types/essence'

import { getContracts, saveContracts } from '../lib/contractStorage'
import { getEssences } from '../lib/essenceStorage'
import { addAuditLog } from '../lib/auditLogStorage'
import type { AuditLogFormData } from '../types/auditLog'

import ContractFormModal from '../components/ui/ContractFormModal'
import { getDahliaLevel } from '../lib/dahliaConfigStorage'

import {
  getContractLimits,
  validateContractSave,
  validateContractActivation,
} from '../lib/contractRules'

// ============================================================
// DADOS INICIAIS DE DEMONSTRAÇÃO
// ============================================================

const demoContracts: Contract[] = [
  {
    id: 'contract-demo-001',
    name: 'Pacto da Visão Profana',
    essenceId: null,
    contractorName: 'Astrael',
    description:
      'Um acordo firmado com uma entidade dos Nove Infernos, oferecendo ao contratante a capacidade de enxergar aquilo que normalmente permanece oculto.',
    offer:
      'O contratante recebe a capacidade de perceber criaturas invisíveis e enxergar através de determinadas formas de escuridão.',
    price:
      'Uma memória querida será entregue ao contratante infernal, que poderá guardá-la como parte de seu tesouro.',
    clauses:
      'A visão concedida não pode ser utilizada para contemplar diretamente o verdadeiro nome do contratante.',
    status: 'Ativo',
    signedDate: '12/11/2026',
    createdAt: 3,
    updatedAt: 3,
  },
  {
    id: 'contract-demo-002',
    name: 'A Dívida de Sangue',
    essenceId: null,
    contractorName: 'Malphas',
    description:
      'Um contrato de natureza infernal que transforma o sofrimento físico em uma fonte temporária de poder.',
    offer:
      'O contratante recebe uma reserva adicional de energia infernal, capaz de fortalecer seus ataques.',
    price:
      'Uma quantidade de sangue deverá ser oferecida ao contratante sempre que o poder for utilizado.',
    clauses:
      'O benefício não poderá ser utilizado mais de uma vez antes de um descanso longo.',
    status: 'Inativo',
    signedDate: '10/11/2026',
    createdAt: 2,
    updatedAt: 2,
  },
  {
    id: 'contract-demo-003',
    name: 'O Sussurro dos Condenados',
    essenceId: null,
    contractorName: 'Belzareth',
    description:
      'Um acordo obscuro que permite ao contratante ouvir fragmentos de conversas e segredos carregados pelas almas condenadas.',
    offer:
      'O contratante pode receber informações sussurradas por espíritos e entidades inferiores.',
    price:
      'A cada utilização, uma pequena parte da própria voz será temporariamente oferecida ao diabo.',
    clauses:
      'As informações recebidas podem ser incompletas, distorcidas ou deliberadamente enganosas.',
    status: 'Ativo',
    signedDate: '08/11/2026',
    createdAt: 1,
    updatedAt: 1,
  },
]

// ============================================================
// ESTILOS
// ============================================================

const statusStyles: Record<ContractStatus, string> = {
  Ativo: 'bg-red-950/60 text-red-300 border-red-900',
  Inativo: 'bg-zinc-900 text-zinc-500 border-zinc-800',
}

// ============================================================
// HISTÓRICO ADMINISTRATIVO
// ============================================================

function recordAudit(data: AuditLogFormData) {
  try {
    addAuditLog(data)
  } catch (error) {
    console.error(
      'Não foi possível registrar a atividade administrativa:',
      error,
    )
  }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>(() => {
    const savedContracts = getContracts()
    return savedContracts ?? demoContracts
  })

  const [essences] = useState<Essence[]>(() => {
    return getEssences() ?? []
  })

  const [dahliaLevel] = useState<number | null>(() => {
    return getDahliaLevel()
  })

  const contractLimits = getContractLimits(dahliaLevel)

  const availableEssences = useMemo(
    () => essences.filter((essence) => essence.nature === 'Diabo'),
    [essences],
  )

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [sortOrder, setSortOrder] = useState('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [selectedContract, setSelectedContract] =
    useState<Contract | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingContract, setEditingContract] =
    useState<Contract | null>(null)

  // ==========================================================
  // PERSISTÊNCIA
  // ==========================================================

  useEffect(() => {
    saveContracts(contracts)
  }, [contracts])

  // ==========================================================
  // CRIAÇÃO E EDIÇÃO
  // ==========================================================

  function handleSave(data: ContractFormData) {
    const validationError = validateContractSave({
      contracts,
      essences,
      level: dahliaLevel,
      editingContract,
      data,
    })

    if (validationError) {
      window.alert(validationError)
      return
    }

    const now = Date.now()

    if (editingContract) {
      const updatedContract: Contract = {
        ...editingContract,
        ...data,
        updatedAt: now,
      }

      recordAudit({
        action: 'Editado',
        entityType: 'Contrato',
        entityId: updatedContract.id,
        entityName: updatedContract.name,
        description: `O contrato "${updatedContract.name}" foi editado.`,
        oldData: editingContract,
        newData: updatedContract,
      })

      setContracts((current) =>
        current.map((contract) =>
          contract.id === editingContract.id ? updatedContract : contract,
        ),
      )
    } else {
      const newContract: Contract = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }

      recordAudit({
        action: 'Criado',
        entityType: 'Contrato',
        entityId: newContract.id,
        entityName: newContract.name,
        description: `O contrato "${newContract.name}" foi criado.`,
        newData: newContract,
      })

      setContracts((current) => [newContract, ...current])
    }

    setFormOpen(false)
    setEditingContract(null)
    setSelectedContract(null)
  }

  function handleNewContract() {
    setEditingContract(null)
    setFormOpen(true)
  }

  function handleEdit(contract: Contract) {
    setSelectedContract(null)
    setEditingContract(contract)
    setFormOpen(true)
  }

  // ==========================================================
  // EXCLUSÃO
  // ==========================================================

  function handleDelete(contract: Contract) {
    const confirmed = window.confirm(
      `Tem certeza de que deseja excluir o contrato "${contract.name}"?\n\nEssa ação removerá o registro da biblioteca.`,
    )

    if (!confirmed) return

    recordAudit({
      action: 'Excluído',
      entityType: 'Contrato',
      entityId: contract.id,
      entityName: contract.name,
      description: `O contrato "${contract.name}" foi excluído.`,
      oldData: contract,
    })

    setContracts((current) =>
      current.filter((item) => item.id !== contract.id),
    )

    setSelectedContract(null)
  }

  // ==========================================================
  // ATIVAÇÃO E DESATIVAÇÃO
  // ==========================================================

  function handleToggleStatus(contract: Contract) {
    const nextStatus: ContractStatus =
      contract.status === 'Ativo' ? 'Inativo' : 'Ativo'

    if (nextStatus === 'Ativo') {
      const validationError = validateContractActivation({
        contracts,
        essences,
        level: dahliaLevel,
        contract,
      })

      if (validationError) {
        window.alert(validationError)
        return
      }
    }

    const action =
      nextStatus === 'Ativo' ? 'ativar' : 'desativar'

    const confirmed = window.confirm(
      `Deseja realmente ${action} o contrato "${contract.name}"?`,
    )

    if (!confirmed) return

    const now = Date.now()

    const updatedContract: Contract = {
      ...contract,
      status: nextStatus,
      updatedAt: now,
    }

    recordAudit({
      action: nextStatus === 'Ativo' ? 'Ativado' : 'Desativado',
      entityType: 'Contrato',
      entityId: contract.id,
      entityName: contract.name,
      description: `O contrato "${contract.name}" foi ${
        nextStatus === 'Ativo' ? 'ativado' : 'desativado'
      }.`,
      oldData: contract,
      newData: updatedContract,
    })

    setContracts((current) =>
      current.map((item) =>
        item.id === contract.id ? updatedContract : item,
      ),
    )

    setSelectedContract((current) =>
      current?.id === contract.id ? updatedContract : current,
    )
  }

  // ==========================================================
  // PESQUISA, FILTROS E ORDENAÇÃO
  // ==========================================================

  const filteredContracts = useMemo(() => {
    let result = [...contracts]

    const normalizedSearch = search.toLowerCase().trim()

    if (normalizedSearch) {
      result = result.filter((contract) => {
        const searchableContent = [
          contract.name,
          contract.contractorName,
          contract.description,
          contract.offer,
          contract.price,
          contract.clauses,
        ]
          .join(' ')
          .toLowerCase()

        return searchableContent.includes(normalizedSearch)
      })
    }

    if (statusFilter !== 'Todos') {
      result = result.filter(
        (contract) => contract.status === statusFilter,
      )
    }

    switch (sortOrder) {
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt)
        break

      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break

      case 'alphabetical-desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break

      case 'newest':
      default:
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
    }

    return result
  }, [contracts, search, statusFilter, sortOrder])

  // ==========================================================
  // CONTADORES
  // ==========================================================

  const activeCount = contracts.filter(
    (contract) => contract.status === 'Ativo',
  ).length

  const inactiveCount = contracts.filter(
    (contract) => contract.status === 'Inativo',
  ).length

  const exceededSignedLimit =
    dahliaLevel !== null &&
    contracts.length > contractLimits.maximum

  const exceededActiveLimit =
    dahliaLevel !== null &&
    activeCount > contractLimits.active

  // ==========================================================
  // FECHAR MODAL COM ESC
  // ==========================================================

  useEffect(() => {
    if (!selectedContract) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedContract(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedContract])

  // ==========================================================
  // LIMPAR FILTROS
  // ==========================================================

  function clearFilters() {
    setSearch('')
    setStatusFilter('Todos')
    setSortOrder('newest')
  }

  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (
    <div className="space-y-8">

      {/* CABEÇALHO */}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-red-500">
            <Flame size={14} />
            Biblioteca de Pactos
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Contratos Infernais
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Os acordos firmados com as entidades dos Nove Infernos.
            Cada promessa possui um preço, e toda cláusula esconde
            uma consequência.
          </p>
        </div>

        <button
          onClick={handleNewContract}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
        >
          <Plus size={18} />
          Novo Contrato
        </button>
      </div>

      {/* INDICADORES */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Total de contratos
              </p>

              <p className="mt-2 text-3xl font-semibold text-white">
                {contracts.length}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-900 p-3 text-zinc-400">
              <ScrollText size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Contratos ativos
              </p>

              <p className="mt-2 text-3xl font-semibold text-red-300">
                {activeCount}
              </p>
            </div>

            <div className="rounded-lg bg-red-950/60 p-3 text-red-400">
              <CircleCheck size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Contratos inativos
              </p>

              <p className="mt-2 text-3xl font-semibold text-zinc-400">
                {inactiveCount}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-900 p-3 text-zinc-500">
              <CircleX size={22} />
            </div>
          </div>
        </div>

      </div>
      {(exceededSignedLimit || exceededActiveLimit) && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
          <CircleX size={20} className="mt-0.5 shrink-0 text-amber-500" />

          <div>
            <p className="text-sm font-medium text-amber-300">
              Limite de contratos excedido
            </p>

            <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
              {exceededSignedLimit &&
                `Existem ${contracts.length} contratos firmados, mas o limite atual é ${contractLimits.maximum}. `}

              {exceededActiveLimit &&
                `Existem ${activeCount} contratos ativos, mas o limite atual é ${contractLimits.active}. `}

              Nenhum contrato será desativado automaticamente. Desative ou revise os contratos manualmente.
            </p>
          </div>
        </div>
      )}
      {/* PESQUISA E FILTROS */}

      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">

        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por contrato, contratante ou conteúdo..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-800"
            />
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 lg:hidden"
          >
            <Filter size={17} />
            Filtros

            <ChevronDown
              size={16}
              className={filtersOpen ? 'rotate-180 transition' : 'transition'}
            />
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <Filter size={17} className="text-zinc-500" />

            <span className="text-xs text-zinc-500">
              Ordenar:
            </span>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-zinc-300 outline-none focus:border-red-800"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="alphabetical">A–Z</option>
              <option value="alphabetical-desc">Z–A</option>
            </select>
          </div>

        </div>

        <div
          className={`${filtersOpen ? 'flex' : 'hidden'} flex-col gap-3 border-t border-zinc-800 pt-4 lg:flex lg:flex-row lg:items-center`}
        >
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-red-800"
            >
              <option value="Todos">Todos os estados</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-red-800 lg:hidden"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="alphabetical">A–Z</option>
              <option value="alphabetical-desc">Z–A</option>
            </select>

          </div>

          <button
            onClick={clearFilters}
            className="text-left text-xs text-zinc-500 transition hover:text-red-400 lg:text-right"
          >
            Limpar filtros
          </button>
        </div>

      </div>

      {/* RESULTADOS */}

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Exibindo{' '}
          <span className="font-medium text-zinc-300">
            {filteredContracts.length}
          </span>{' '}
          de{' '}
          <span className="font-medium text-zinc-300">
            {contracts.length}
          </span>{' '}
          contratos
        </p>
      </div>

      {/* LISTAGEM DESKTOP */}

      <div className="hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40 md:block">

        <table className="w-full text-left">

          <thead className="border-b border-zinc-800 bg-zinc-900/70">
            <tr>
              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Contrato
              </th>

              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Contratante
              </th>

              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Assinatura
              </th>

              <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Estado
              </th>

              <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/70">

            {filteredContracts.map((contract) => (
              <tr
                key={contract.id}
                className="transition hover:bg-zinc-900/50"
              >

                <td className="px-5 py-4">
                  <button
                    onClick={() => setSelectedContract(contract)}
                    className="text-left"
                  >
                    <p className="font-medium text-zinc-200 transition hover:text-red-400">
                      {contract.name}
                    </p>

                    <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                      {contract.description}
                    </p>
                  </button>
                </td>

                <td className="px-5 py-4">
                  <span className="text-sm text-red-300">
                    {contract.contractorName}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                    <CalendarDays size={14} />
                    {contract.signedDate || 'Não informada'}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusStyles[contract.status]}`}
                  >
                    {contract.status}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">

                    <button
                      onClick={() => setSelectedContract(contract)}
                      title="Visualizar"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <Eye size={17} />
                    </button>

                    <button
                      onClick={() => handleEdit(contract)}
                      title="Editar"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-blue-400"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(contract)}
                      title={contract.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
                    >
                      <Power size={17} />
                    </button>

                    <button
                      onClick={() => handleDelete(contract)}
                      title="Excluir"
                      className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>
                </td>

              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* LISTAGEM MOBILE */}

      <div className="grid grid-cols-1 gap-3 md:hidden">

        {filteredContracts.map((contract) => (
          <div
            key={contract.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
          >

            <button
              onClick={() => setSelectedContract(contract)}
              className="w-full text-left"
            >

              <div className="flex items-start justify-between gap-3">

                <div>
                  <h3 className="font-medium text-zinc-200">
                    {contract.name}
                  </h3>

                  <p className="mt-1 text-xs text-red-300">
                    {contract.contractorName}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${statusStyles[contract.status]}`}
                >
                  {contract.status}
                </span>

              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <CalendarDays size={14} />
                {contract.signedDate || 'Data não informada'}
              </div>

              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                {contract.description}
              </p>

            </button>

            <div className="mt-4 flex justify-end gap-2 border-t border-zinc-800 pt-3">

              <button
                onClick={() => setSelectedContract(contract)}
                title="Visualizar"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
              >
                <Eye size={17} />
              </button>

              <button
                onClick={() => handleEdit(contract)}
                title="Editar"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-blue-400"
              >
                <Pencil size={17} />
              </button>

              <button
                onClick={() => handleToggleStatus(contract)}
                title={contract.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
              >
                <Power size={17} />
              </button>

              <button
                onClick={() => handleDelete(contract)}
                title="Excluir"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-950/50 hover:text-red-400"
              >
                <Trash2 size={17} />
              </button>

            </div>

          </div>
        ))}

      </div>

      {/* ESTADO VAZIO */}

      {filteredContracts.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">

          <ScrollText
            size={30}
            className="mx-auto text-zinc-700"
          />

          <h3 className="mt-4 font-medium text-zinc-300">
            Nenhum contrato encontrado
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Tente alterar os filtros ou os termos da pesquisa.
          </p>

          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-red-400 hover:text-red-300"
          >
            Limpar filtros
          </button>

        </div>
      )}

      {/* MODAL DE DETALHES */}

      {selectedContract && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedContract(null)
            }
          }}
        >

          <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">

            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">

              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Documento Infernal
              </span>

              <button
                onClick={() => setSelectedContract(null)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Fechar"
              >
                <X size={19} />
              </button>

            </div>

            {selectedContract.imageUrl && (
              <div className="h-56 overflow-hidden bg-zinc-900">
                <img
                  src={selectedContract.imageUrl}
                  alt={selectedContract.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="space-y-6 p-6">

              <div>

                <div className="mb-2 flex flex-wrap items-center gap-2">

                  <span className="text-xs font-medium uppercase tracking-wider text-red-400">
                    Contrato Infernal
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs ${statusStyles[selectedContract.status]}`}
                  >
                    {selectedContract.status}
                  </span>

                </div>

                <h2 className="text-2xl font-semibold text-white">
                  {selectedContract.name}
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Firmado com{' '}
                  <span className="font-medium text-red-300">
                    {selectedContract.contractorName}
                  </span>
                </p>

              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
                  Descrição
                </p>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                  {selectedContract.description || 'Sem descrição registrada.'}
                </p>
              </div>

              <div className="rounded-xl border border-purple-900/40 bg-purple-950/10 p-5">

                <div className="mb-3 flex items-center gap-2 text-purple-300">
                  <Flame size={17} />

                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    A Oferta
                  </h3>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {selectedContract.offer || 'Nenhuma oferta registrada.'}
                </p>

              </div>

              <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-5">

                <div className="mb-3 flex items-center gap-2 text-red-300">
                  <Flame size={17} />

                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    O Preço
                  </h3>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {selectedContract.price || 'Nenhum preço registrado.'}
                </p>

              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
                  Cláusulas e Condições
                </p>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                  {selectedContract.clauses || 'Nenhuma cláusula registrada.'}
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-zinc-800 pt-5 text-sm text-zinc-500">
                <CalendarDays size={16} />

                Assinado em:{' '}
                <span className="text-zinc-300">
                  {selectedContract.signedDate || 'Data não informada'}
                </span>
              </div>

              <div className="flex flex-col-reverse justify-between gap-3 border-t border-zinc-800 pt-5 sm:flex-row">

                <button
                  onClick={() => handleDelete(selectedContract)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-900/50 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-950/40"
                >
                  <Trash2 size={16} />
                  Excluir contrato
                </button>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <button
                    onClick={() => handleToggleStatus(selectedContract)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900"
                  >
                    <Power size={16} />
                    {selectedContract.status === 'Ativo'
                      ? 'Desativar'
                      : 'Ativar'}
                  </button>

                  <button
                    onClick={() => handleEdit(selectedContract)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-white transition hover:bg-zinc-700"
                  >
                    <Pencil size={16} />
                    Editar contrato
                  </button>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO E EDIÇÃO */}

      {formOpen && (
        <ContractFormModal
          key={editingContract?.id ?? 'new'}
          initialData={editingContract ?? undefined}
          availableEssences={availableEssences}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false)
            setEditingContract(null)
          }}
        />
      )}

    </div>
  )
}
