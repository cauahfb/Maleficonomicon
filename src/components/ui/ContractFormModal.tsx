
import { useEffect, useState, type FormEvent } from 'react'
import {
  X,
  ImagePlus,
  Flame,
  ScrollText,
  AlertCircle,
} from 'lucide-react'

import type {
  Contract,
  ContractFormData,
  ContractStatus,
} from '../../types/contract'

import type { Essence } from '../../types/essence'

interface ContractFormModalProps {
  initialData?: Contract
  availableEssences: Essence[]
  onSave: (data: ContractFormData) => void
  onClose: () => void
}

export default function ContractFormModal({
  initialData,
  availableEssences,
  onSave,
  onClose,
}: ContractFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [essenceId, setEssenceId] = useState(
    initialData?.essenceId ?? '',
  )
  const [contractorName, setContractorName] = useState(
    initialData?.contractorName ?? '',
  )
  const [description, setDescription] = useState(
    initialData?.description ?? '',
  )
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl ?? '',
  )
  const [offer, setOffer] = useState(initialData?.offer ?? '')
  const [price, setPrice] = useState(initialData?.price ?? '')
  const [clauses, setClauses] = useState(
    initialData?.clauses ?? '',
  )
  const [status, setStatus] = useState<ContractStatus>(
    initialData?.status ?? 'Inativo',
  )
  const [signedDate, setSignedDate] = useState(
    initialData?.signedDate ?? '',
  )
  const [imageError, setImageError] = useState(false)

  const [formError, setFormError] = useState('')

  const selectedEssence = availableEssences.find(
    (essence) => essence.id === essenceId,
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  function handleEssenceChange(value: string) {
    setEssenceId(value)

    const essence = availableEssences.find(
      (item) => item.id === value,
    )

    if (essence) {
      setContractorName(essence.name)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Informe o nome do contrato.')
      return
    }

    if (!essenceId) {
      setFormError('Selecione o Diabo contratante.')
      return
    }

    if (!selectedEssence) {
      setFormError(
        'A essência selecionada não está mais disponível. Selecione outro Diabo.',
      )
      return
    }

    if (selectedEssence.nature !== 'Diabo') {
      setFormError('Somente Diabos podem ser contratantes.')
      return
    }

    if (!offer.trim()) {
      setFormError('Descreva a oferta do contrato.')
      return
    }

    if (!price.trim()) {
      setFormError('Descreva o preço do contrato.')
      return
    }

    const formData: ContractFormData = {
      name: name.trim(),
      essenceId,
      contractorName: selectedEssence.name,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      offer: offer.trim(),
      price: price.trim(),
      clauses: clauses.trim(),
      status,
      signedDate: signedDate.trim(),
    }

    onSave(formData)
  }

  const inputClass =
    'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-800'

  const labelClass =
    'mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* CABEÇALHO */}

        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-400">
              <Flame size={14} />
              Biblioteca de Pactos
            </div>

            <h2 className="text-xl font-semibold text-white">
              {initialData ? 'Editar Contrato' : 'Novo Contrato'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        {/* FORMULÁRIO */}

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
            {/* IDENTIFICAÇÃO */}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <ScrollText size={17} className="text-red-400" />
                Identificação do contrato
              </div>

              <div>
                <label className={labelClass}>
                  Nome do contrato *
                </label>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Pacto da Visão Profana"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Diabo contratante *
                </label>

                {availableEssences.length > 0 ? (
                  <select
                    value={essenceId}
                    onChange={(event) =>
                      handleEssenceChange(event.target.value)
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">
                      Selecione um Diabo
                    </option>

                    {availableEssences.map((essence) => (
                      <option key={essence.id} value={essence.id}>
                        {essence.name}
                        {essence.trueName
                          ? ` — ${essence.trueName}`
                          : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-300">
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0"
                    />

                    Nenhum Diabo disponível. Cadastre primeiro uma
                    essência com natureza Diabo.
                  </div>
                )}

                <p className="mt-2 text-xs text-zinc-600">
                  Somente essências classificadas como Diabo
                  podem firmar contratos.
                </p>
              </div>

              {essenceId && (
                <div className="rounded-lg border border-red-900/30 bg-red-950/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-zinc-600">
                    Nome histórico do contratante
                  </p>

                  <p className="mt-1 text-sm text-red-300">
                    {contractorName}
                  </p>
                </div>
              )}

              <div>
                <label className={labelClass}>
                  Descrição e contexto
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={3}
                  placeholder="Descreva a origem, contexto e natureza deste pacto..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* IMAGEM */}

            <div className="space-y-3 border-t border-zinc-800 pt-5">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <ImagePlus size={17} className="text-zinc-400" />
                Representação visual
              </div>

              <div>
                <label className={labelClass}>
                  URL da imagem
                </label>

                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => {
                    setImageUrl(event.target.value)
                    setImageError(false)
                  }}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>

              {imageUrl && !imageError && (
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                  <img
                    src={imageUrl}
                    alt="Pré-visualização do contrato"
                    onError={() => setImageError(true)}
                    className="max-h-52 w-full object-cover"
                  />
                </div>
              )}

              {imageError && (
                <p className="text-xs text-red-400">
                  Não foi possível carregar a imagem. Verifique a URL.
                </p>
              )}
            </div>

            {/* OFERTA */}

            <div className="space-y-3 border-t border-zinc-800 pt-5">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-300">
                <Flame size={17} />
                A Oferta
              </div>

              <div>
                <label className={labelClass}>
                  Poder ou benefício concedido *
                </label>

                <textarea
                  value={offer}
                  onChange={(event) => setOffer(event.target.value)}
                  rows={4}
                  placeholder="O que o contratante oferece em troca?"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* PREÇO */}

            <div className="space-y-3 border-t border-zinc-800 pt-5">
              <div className="flex items-center gap-2 text-sm font-medium text-red-300">
                <Flame size={17} />
                O Preço
              </div>

              <div>
                <label className={labelClass}>
                  Sacrifício ou custo exigido *
                </label>

                <textarea
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  rows={4}
                  placeholder="O que será exigido do pactuante?"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* CLÁUSULAS */}

            <div className="space-y-3 border-t border-zinc-800 pt-5">
              <div className="text-sm font-medium text-zinc-300">
                Cláusulas e condições
              </div>

              <div>
                <label className={labelClass}>
                  Restrições, obrigações e consequências
                </label>

                <textarea
                  value={clauses}
                  onChange={(event) =>
                    setClauses(event.target.value)
                  }
                  rows={4}
                  placeholder="Registre todas as condições que regem o pacto..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* ESTADO E DATA */}

            <div className="grid grid-cols-1 gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Estado do contrato
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ContractStatus)
                  }
                  className={inputClass}
                >
                  <option value="Inativo">Inativo</option>
                  <option value="Ativo">Ativo</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Data de assinatura
                </label>

                <input
                  value={signedDate}
                  onChange={(event) =>
                    setSignedDate(event.target.value)
                  }
                  placeholder="Ex.: 12/11/2026 ou Ano 1496 DR"
                  className={inputClass}
                />
              </div>
            </div>

            {/* ERRO */}

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                {formError}
              </div>
            )}
          </div>

          {/* RODAPÉ */}

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-zinc-800 bg-zinc-950 px-6 py-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-800 px-5 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={availableEssences.length === 0}
              className="rounded-lg bg-red-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {initialData ? 'Salvar alterações' : 'Criar contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
