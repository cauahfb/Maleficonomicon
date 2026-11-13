import { useEffect, useState } from 'react'
import {
  X,
  Image as ImageIcon,
  AlertTriangle,
  Save,
} from 'lucide-react'

import type {
  Subjugation,
  SubjugationFormData,
  CreatureDiscoveryStatus,
} from '../../types/subjugation'
interface SubjugationFormModalProps {
  initialData?: Subjugation
  onSave: (data: SubjugationFormData) => void
  onClose: () => void
}

const initialFormData: SubjugationFormData = {
  name: '',
  imageUrl: '',
  challengeRating: '',
  description: '',
  discoveryStatus: 'Não descoberta',
  isAlive: true,
  externalUrl: '',
  subjugatedDate: '',
  dhaliaLevel: undefined,
}

const discoveryOptions: {
  value: CreatureDiscoveryStatus
  label: string
  description: string
}[] = [
  {
    value: 'Não descoberta',
    label: 'Não descoberta',
    description: 'Nome, imagem e CR serão ocultados do público.',
  },
  {
    value: 'Descoberta',
    label: 'Descoberta',
    description: 'Nome e CR visíveis, imagem em preto e branco.',
  },
  {
    value: 'Subjugada',
    label: 'Subjugada',
    description: 'Imagem colorida, informações visíveis e direcionamento.',
  },
]

export default function SubjugationFormModal({
  initialData,
  onSave,
  onClose,
}: SubjugationFormModalProps) {
  const [formData, setFormData] = useState<SubjugationFormData>(
    initialData
      ? {
          name: initialData.name,
          imageUrl: initialData.imageUrl ?? '',
          challengeRating: initialData.challengeRating,
          description: initialData.description,
          discoveryStatus: initialData.discoveryStatus,
          isAlive: initialData.isAlive,
          externalUrl: initialData.externalUrl ?? '',
          subjugatedDate: initialData.subjugatedDate ?? '',
          dhaliaLevel: initialData.dhaliaLevel,
        }
      : initialFormData,
  )

  const [imageError, setImageError] = useState(false)

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

  function updateField<K extends keyof SubjugationFormData>(
    field: K,
    value: SubjugationFormData[K],
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedData: SubjugationFormData = {
      ...formData,
      name: formData.name.trim(),
      imageUrl: formData.imageUrl?.trim() || '',
      challengeRating: formData.challengeRating.trim(),
      description: formData.description.trim(),
      externalUrl: formData.externalUrl?.trim() || '',
      subjugatedDate: formData.subjugatedDate?.trim() || '',
    }

    onSave(cleanedData)
  }

  const isSubjugated = formData.discoveryStatus === 'Subjugada'
  const missingLink = isSubjugated && !formData.externalUrl?.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#151515] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#151515] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-white">
              {initialData ? 'Editar criatura' : 'Nova criatura'}
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Gerencie os registros do Ritual de Subjugação.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar formulário"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Estado de descoberta */}
          <section className="space-y-3">
            <label className="block text-sm font-medium text-gray-200">
              Estado da criatura
            </label>

            <div className="grid gap-3">
              {discoveryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateField('discoveryStatus', option.value)
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    formData.discoveryStatus === option.value
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        formData.discoveryStatus === option.value
                          ? 'bg-purple-400'
                          : 'bg-gray-600'
                      }`}
                    />

                    <span className="font-medium text-white">
                      {option.label}
                    </span>
                  </div>

                  <p className="mt-2 pl-6 text-xs text-gray-400">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Identificação */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Identificação
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">
                  Nome da criatura *
                </label>

                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    updateField('name', event.target.value)
                  }
                  placeholder="Ex.: Vrock"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">
                  Challenge Rating (CR) *
                </label>

                <input
                  required
                  type="text"
                  value={formData.challengeRating}
                  onChange={(event) =>
                    updateField('challengeRating', event.target.value)
                  }
                  placeholder="Ex.: 6 ou 1/2"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                Descrição
              </label>

              <textarea
                rows={4}
                value={formData.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                placeholder="Descreva a criatura..."
                className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
              />
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Imagem */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Aparência
            </h3>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                URL da imagem
              </label>

              <input
                type="url"
                value={formData.imageUrl}
                onChange={(event) => {
                  updateField('imageUrl', event.target.value)
                  setImageError(false)
                }}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/10 bg-black/20">
              {formData.imageUrl && !imageError ? (
                <img
                  src={formData.imageUrl}
                  alt="Pré-visualização da criatura"
                  className={`max-h-64 w-full object-contain ${
                    formData.discoveryStatus === 'Descoberta'
                      ? 'grayscale'
                      : ''
                  }`}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  {imageError ? (
                    <ImageIcon className="h-8 w-8" />
                  ) : (
                    <ImageIcon className="h-8 w-8" />
                  )}

                  <span className="text-xs">
                    {imageError
                      ? 'Não foi possível carregar a imagem.'
                      : 'Pré-visualização da imagem'}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              A imagem será exibida em preto e branco quando a criatura
              estiver descoberta e em cores quando estiver subjugada.
            </p>
          </section>

          <div className="border-t border-white/10" />

          {/* Informações da subjugação */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Subjugação
            </h3>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                Direcionamento externo
              </label>

              <input
                type="url"
                value={formData.externalUrl ?? ''}
                onChange={(event) =>
                  updateField('externalUrl', event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
              />

              <p className="text-xs text-gray-500">
                Utilizado quando a criatura estiver subjugada.
              </p>
            </div>

            {missingLink && (
              <div className="flex gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />

                <div>
                  <p className="text-sm font-medium text-yellow-300">
                    Direcionamento não cadastrado
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    A criatura poderá ser salva como subjugada, mas
                    os jogadores verão um aviso de registro incompleto
                    ao clicar nela.
                  </p>
                </div>
              </div>
            )}

            {isSubjugated && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">
                      Data da subjugação
                    </label>

                    <input
                      type="text"
                      value={formData.subjugatedDate ?? ''}
                      onChange={(event) =>
                        updateField('subjugatedDate', event.target.value)
                      }
                      placeholder="Ex.: 12/11/2026"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">
                      Nível de Dahlia
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.dhaliaLevel ?? ''}
                      onChange={(event) =>
                        updateField(
                          'dhaliaLevel',
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      placeholder="Ex.: 10"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <label className="block text-sm font-medium text-gray-200">
                    Vitalidade da criatura
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('isAlive', true)}
                      className={`rounded-lg border p-3 text-sm transition ${
                        formData.isAlive
                          ? 'border-green-500/40 bg-green-500/10 text-green-300'
                          : 'border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      Vivo
                    </button>

                    <button
                      type="button"
                      onClick={() => updateField('isAlive', false)}
                      className={`rounded-lg border p-3 text-sm transition ${
                        !formData.isAlive
                          ? 'border-red-500/40 bg-red-500/10 text-red-300'
                          : 'border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      Morto
                    </button>
                  </div>
                </div>
              </>
            )}

            {!isSubjugated && (
              <p className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-gray-500">
                Os campos de data, nível e vitalidade da subjugação
                estarão disponíveis quando a criatura for marcada
                como subjugada.
              </p>
            )}
          </section>

          {/* Rodapé */}
          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-5 py-3 text-sm text-gray-300 transition hover:bg-white/5"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              <Save className="h-4 w-4" />
              {initialData ? 'Salvar alterações' : 'Criar criatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
