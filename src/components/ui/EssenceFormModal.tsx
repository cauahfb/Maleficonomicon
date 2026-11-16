
import { useEffect, useState, type FormEvent } from 'react'
import { X, ImagePlus, Skull, Flame } from 'lucide-react'
import type {
  Essence,
  EssenceFormData,
  EssenceNature,
  EssenceStatus,
  EssencePersonality,
} from '../../types/essence'
import { PERSONALITY_OPTIONS } from '../../types/essence'

interface EssenceFormModalProps {
  initialData?: Essence
  onSave: (data: EssenceFormData) => void
  onClose: () => void
}

const inputClass =
  'w-full rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-3 text-sm text-white outline-none transition focus:border-[#71717A]'

const labelClass = 'mb-2 block text-xs text-[#A1A1AA]'

export default function EssenceFormModal({
  initialData,
  onSave,
  onClose,
}: EssenceFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [titles, setTitles] = useState(initialData?.titles.join(', ') ?? '')
  const [trueName, setTrueName] = useState(initialData?.trueName ?? '')

  const [trueNamePublic, setTrueNamePublic] = useState(
    initialData?.trueNamePublic ?? false,
  )

  const [hasIndividualTalisman, setHasIndividualTalisman] = useState(
    initialData?.hasIndividualTalisman ?? false,
  )

  const [individualTalisman, setIndividualTalisman] = useState(
    initialData?.individualTalisman ?? '',
  )

  const [personality, setPersonality] = useState<EssencePersonality | ''>(initialData?.personality ?? '')

  const [nature, setNature] = useState<EssenceNature>(
    initialData?.nature ?? 'Demônio',
  )

  const [hierarchy, setHierarchy] = useState(
    initialData?.hierarchy ?? '',
  )

  const [status, setStatus] = useState<EssenceStatus>(
    initialData?.status ?? 'Registrado',
  )

  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl ?? '',
  )

  const [registrationDate, setRegistrationDate] = useState(
    initialData?.registrationDate ?? '',
  )

  const [description, setDescription] = useState(
    initialData?.description ?? '',
  )

  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTrueName = trueName.trim()

    if (!trimmedTrueName) {
      return
    }

    onSave({
      name: name.trim(),
      titles: titles
        .split(',')
        .map((title) => title.trim())
        .filter(Boolean),

      trueName: trimmedTrueName,
      trueNamePublic: trueNamePublic,

      nature,
      personality,

      hasIndividualTalisman:
        nature === 'Diabo' && hasIndividualTalisman,

      individualTalisman:
        nature === 'Diabo' && hasIndividualTalisman
          ? individualTalisman.trim() || undefined
          : undefined,

      hierarchy: hierarchy.trim(),
      status,
      imageUrl: imageUrl.trim() || undefined,
      registrationDate: registrationDate.trim(),
      description: description.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="essence-form-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-xl border border-[#3F3F46] bg-[#111113] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717A]">
              Biblioteca de entidades
            </p>

            <h2
              id="essence-form-title"
              className="mt-1 font-serif text-xl text-white"
            >
              {initialData ? 'Editar Essência' : 'Nova Essência'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#A1A1AA] transition hover:text-white"
            aria-label="Fechar formulário"
          >
            <X size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">

            {/* IDENTIDADE */}
            <div>
              <label className={labelClass}>Nome da entidade *</label>

              <input
                required
                maxLength={150}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Vrock"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Títulos e epítetos
              </label>

              <input
                value={titles}
                onChange={(event) => setTitles(event.target.value)}
                placeholder="Ex.: Demônio Abutre, Senhor das Ruínas"
                className={inputClass}
              />

              <p className="mt-2 text-[11px] text-[#71717A]">
                Separe os títulos por vírgulas.
              </p>
            </div>

            {/* NOME VERDADEIRO */}
            <div>
              <label className={labelClass}>
                Nome verdadeiro *
              </label>

              <input
                required
                pattern=".*\S.*"
                title="Informe o nome verdadeiro da entidade."
                value={trueName}
                onChange={(event) => {
                  setTrueName(event.target.value)

                  if (!event.target.value.trim()) {
                    setTrueNamePublic(false)
                  }
                }}
                placeholder="Informe o nome verdadeiro da entidade"
                className={inputClass}
              />

              <p className="mt-2 text-[11px] text-[#71717A]">
                Este campo é obrigatório. Caso o nome não seja revelado,
                os jogadores verão apenas OCULTO.
              </p>

              <label
                className={`mt-3 flex items-start gap-3 rounded-md border p-3 transition ${
                  trueNamePublic && trueName.trim()
                    ? 'border-emerald-900/70 bg-emerald-950/20'
                    : 'border-[#3F3F46] bg-[#09090B]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={trueNamePublic}
                  disabled={!trueName.trim()}
                  onChange={(event) =>
                    setTrueNamePublic(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 accent-emerald-600 disabled:cursor-not-allowed"
                />

                <span>
                  <span className="block text-xs text-[#E4E4E7]">
                    Revelar nome verdadeiro aos jogadores
                  </span>

                  <span className="mt-1 block text-[11px] leading-5 text-[#71717A]">
                    {trueName.trim()
                      ? 'Quando marcado, o nome verdadeiro ficará visível na consulta pública desta essência.'
                      : 'Informe um nome verdadeiro para habilitar a revelação.'}
                  </span>
                </span>
              </label>
            </div>

            {/* NATUREZA */}
            <div>
              <label className={labelClass}>Natureza *</label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNature('Demônio')
                    setHasIndividualTalisman(false)
                    setIndividualTalisman('')
                  }}
                  className={`flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm transition ${
                    nature === 'Demônio'
                      ? 'border-[#9333EA] bg-[#24103B] text-[#D8B4FE]'
                      : 'border-[#3F3F46] bg-[#09090B] text-[#A1A1AA]'
                  }`}
                >
                  <Skull size={17} />
                  Demônio
                </button>

                <button
                  type="button"
                  onClick={() => setNature('Diabo')}
                  className={`flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm transition ${
                    nature === 'Diabo'
                      ? 'border-[#DC2626] bg-[#350D12] text-[#FCA5A5]'
                      : 'border-[#3F3F46] bg-[#09090B] text-[#A1A1AA]'
                  }`}
                >
                  <Flame size={17} />
                  Diabo
                </button>
              </div>
            </div>

            {/* PERSONALIDADE */}
            <div>
              <label className={labelClass}>Personalidade</label>
              <select
                value={personality}
                onChange={(event) => setPersonality(event.target.value as EssencePersonality | '')}
                className={inputClass}
              >
                <option value="">Não definida</option>
                {PERSONALITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* TALISMÃ INDIVIDUAL DOS DIABOS */}
            {nature === 'Diabo' && (
              <div className="space-y-3 rounded-lg border border-[#632329]/70 bg-[#1F1012]/60 p-4">
                <div>
                  <p className="text-sm font-medium text-[#F4F4F5]">
                    Talismã individual
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#A1A1AA]">
                    Registre se este diabo possui um talismã próprio.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasIndividualTalisman(true)}
                    className={`flex-1 rounded-md border px-3 py-2.5 text-sm transition ${
                      hasIndividualTalisman
                        ? 'border-[#DC2626] bg-[#350D12] text-[#FCA5A5]'
                        : 'border-[#3F3F46] bg-[#09090B] text-[#A1A1AA]'
                    }`}
                  >
                    Sim
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasIndividualTalisman(false)
                      setIndividualTalisman('')
                    }}
                    className={`flex-1 rounded-md border px-3 py-2.5 text-sm transition ${
                      !hasIndividualTalisman
                        ? 'border-[#52525B] bg-[#27272A] text-white'
                        : 'border-[#3F3F46] bg-[#09090B] text-[#A1A1AA]'
                    }`}
                  >
                    Não
                  </button>
                </div>

                {hasIndividualTalisman && (
                  <div>
                    <label className={labelClass}>
                      Qual é o talismã? *
                    </label>

                    <textarea
                      required
                      value={individualTalisman}
                      onChange={(event) =>
                        setIndividualTalisman(event.target.value)
                      }
                      placeholder="Descreva o talismã individual deste diabo..."
                      rows={3}
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* HIERARQUIA E ESTADO */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Hierarquia</label>

                <input
                  value={hierarchy}
                  onChange={(event) => setHierarchy(event.target.value)}
                  placeholder="Ex.: Tanar'ri"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Estado *</label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as EssenceStatus)
                  }
                  className={inputClass}
                >
                  <option>Registrado</option>
                  <option>Contratado</option>
                  <option>Subjugado</option>
                  <option>Erradicado</option>
                </select>
              </div>
            </div>

            {/* IMAGEM */}
            <div>
              <label className={labelClass}>Imagem por URL</label>

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => {
                    setImageUrl(event.target.value)
                    setImageError(false)
                  }}
                  placeholder="https://exemplo.com/imagem.png"
                  className={inputClass}
                />

                <ImagePlus
                  size={20}
                  className="shrink-0 text-[#71717A]"
                />
              </div>

              {imageUrl && (
                <div className="mt-3 flex min-h-32 items-center justify-center overflow-hidden rounded-lg border border-[#3F3F46] bg-[#09090B]">
                  {!imageError ? (
                    <img
                      src={imageUrl}
                      alt="Pré-visualização da essência"
                      onError={() => setImageError(true)}
                      className="max-h-56 w-full object-contain"
                    />
                  ) : (
                    <p className="px-4 text-xs text-[#F87171]">
                      Não foi possível carregar esta imagem.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* DATA */}
            <div>
              <label className={labelClass}>Data de registro</label>

              <input
                value={registrationDate}
                onChange={(event) =>
                  setRegistrationDate(event.target.value)
                }
                placeholder="Ex.: 12/11/2026 ou Ano 1496 DR"
                className={inputClass}
              />

              <p className="mt-2 text-[11px] text-[#71717A]">
                Texto livre: informe a data no formato que desejar.
              </p>
            </div>

            {/* DESCRIÇÃO */}
            <div>
              <label className={labelClass}>Descrição</label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Registre informações sobre esta entidade..."
                rows={5}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {/* AÇÕES */}
          <div className="flex justify-end gap-3 border-t border-[#27272A] px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#3F3F46] px-4 py-2.5 text-sm text-[#A1A1AA] transition hover:bg-[#27272A] hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-md border border-[#71717A] bg-[#27272A] px-5 py-2.5 text-sm text-white transition hover:bg-[#3F3F46]"
            >
              {initialData ? 'Salvar alterações' : 'Criar essência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
