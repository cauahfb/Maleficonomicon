
import { useState } from 'react'
import { Menu, LogOut, CircleHelp, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface HeaderProps {
  onOpenMenu: () => void
}

const pageTitles: Record<string, string> = {
  '/': 'Painel Principal',
  '/essencias': 'Registro de Essências',
  '/contratos': 'Contratos Infernais',
  '/subjugacao': 'Ritual de Subjugação',
  '/backup': 'Backup',
  '/historico': 'Histórico Administrativo',
  '/login': 'Acesso Administrativo',
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [signingOut, setSigningOut] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const activeTitle =
    pageTitles[location.pathname] ?? 'Maleficonomicon'

  async function handleSignOut() {
    if (signingOut) return

    setSigningOut(true)

    try {
      await signOut()
      navigate('/acesso-restrito', { replace: true })
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="flex h-20 items-center justify-between border-b border-[#27272A] bg-[#111113] px-5 md:px-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMenu}
          className="text-[#A1A1AA] transition hover:text-white lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={23} />
        </button>

        <div>
          <p className="hidden text-xs text-[#71717A] sm:block">
            Grimório / Biblioteca
          </p>

          <h2 className="font-serif text-lg text-[#F4F4F5]">
            {activeTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="flex items-center gap-2 rounded-md border border-[#3F3F46] px-3 py-2 text-xs text-[#A1A1AA] transition hover:border-[#9333EA] hover:bg-[#24103B] hover:text-[#D8B4FE]"
        aria-label="Ajuda do Maleficonomicon"
      >
        <CircleHelp size={16} />
        <span>Ajuda</span>
      </button>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-2 rounded-md border border-[#3F3F46] px-3 py-2 text-xs text-[#A1A1AA] transition hover:border-[#71717A] hover:bg-[#27272A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut size={16} />
        <span>
          {signingOut ? 'Saindo...' : 'Sair'}
        </span>
      </button>
      </div>

      {helpOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="malefico-help-title" className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-[#3F3F46] bg-[#111113] shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#27272A] px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A855F7]">Manual do grimório</p>
                <h2 id="malefico-help-title" className="mt-1 font-serif text-xl text-white">Como usar o Maleficonomicon</h2>
              </div>
              <button onClick={() => setHelpOpen(false)} aria-label="Fechar ajuda" className="text-zinc-400 hover:text-white"><X size={20}/></button>
            </header>
            <div className="max-h-[calc(85vh-76px)] space-y-6 overflow-y-auto p-6 text-sm leading-6 text-zinc-300">
              <p>O Maleficonomicon não é apenas um tomo de invocação: é um registro de essências demoníacas e diabólicas, contratos, subjugações e poderes infernais. Cada entrada representa conhecimento — e um risco — que pode custar caro.</p>
              <section><h3 className="mb-2 font-semibold text-purple-300">Registro de Essências</h3><p>Quando um demônio ou diabo morre fora de seu plano natal, com a bruxa a até 36 metros, o tomo intercepta e registra automaticamente sua essência. O registro reúne identidade, títulos, nome verdadeiro (quando conhecido), natureza, hierarquia e estado. Se a criatura for permanentemente destruída, sua entrada desaparece e os benefícios ligados a ela são perdidos.</p><ul className="mt-2 list-disc space-y-1 pl-5"><li><b>Registrado:</b> catalogado, sem vínculo de controle.</li><li><b>Contratado:</b> diabo vinculado por contrato infernal.</li><li><b>Subjugado:</b> demônio capturado por ritual.</li><li><b>Erradicado:</b> essência permanentemente destruída.</li></ul></section>
              <section><h3 className="mb-2 font-semibold text-red-300">Diabos — Contratos Infernais</h3><p>Diabos podem negociar contratos com ofertas, preço, sacrifícios e cláusulas. Um pacto pode exigir, por exemplo, a perda permanente de um olho em troca da capacidade de enxergar criaturas invisíveis ou ilusões. Em regra, os contratos permanecem inativos até Dahlia abrir o tomo e exigir sua ativação; isso consome uma ação e pode ter custos específicos. Contratos de invocação são realizados por <i>Invocação Infernal</i>, usando o Maleficonomicon como talismã exigido pela magia.</p></section>
              <section><h3 className="mb-2 font-semibold text-purple-300">Demônios — Invocação e Subjugação</h3><p>Demônios registrados podem ser invocados com <i>Invocar Demônio Maior</i>. Usar o nome verdadeiro chama aquele indivíduo específico, mas não garante controle sobre ele.</p><h4 className="mt-3 font-medium text-zinc-100">Ritual de Subjugação</h4><p>A partir do nível 10, uma vez por nível, um demônio da progressão tenta contato com Dahlia. Ela pode tentar subjugá-lo em um ritual de 1 minuto, sem gastar espaço de magia ou outro recurso. O demônio surge em um domínio sobrenatural, com todas as suas capacidades, hostil e tentando matar Dahlia. Somente Dahlia pode enfrentá-lo diretamente.</p><p className="mt-2">Outros participantes podem observar, conversar, analisar e aconselhar verbalmente, mas não podem causar dano, curar, conceder benefícios, impor ou remover condições, nem conjurar magias ofensivas ou defensivas. Interferência direta faz o demônio atacar o interferente e encerra o ritual. O ritual falha se todos forem mortos.</p><p className="mt-2">Se Dahlia chegar a 0 PV, realiza um teste de resistência de Constituição com CD 8 + bônus de proficiência de Bruxa + Carisma do demônio. Sucesso: sobrevive com 2 níveis de exaustão. Falha: morre e a essência retorna ao Abismo. Se vencer, poderá invocar o demônio com <i>Invocar Demônio Maior</i>, ignorando o limite de ND, e ele obedecerá plenamente.</p></section>
              <section><h3 className="mb-2 font-semibold text-purple-300">Herança Demoníaca</h3><p>Se um demônio da progressão for erradicado, o próximo herda suas propriedades. Exemplo: se o Vrock for erradicado, o próximo demônio recebe Esporos Abissais.</p></section>
              <section><h3 className="mb-2 font-semibold text-red-300">Troca Sombria</h3><p>A partir do nível 15, quando Dahlia invocar um demônio já subjugado com <i>Invocar Demônio Maior</i>, pode usar uma ação para substituí-lo por outro demônio já subjugado, sem gastar novo espaço de magia. No nível 15, uma vez por descanso longo; no nível 20, duas vezes por descanso longo.</p><p className="mt-2 italic text-zinc-400">“Você achou que eu só tinha um demônio? Não, querido. Eu tenho opções.”</p></section>
              <section><h3 className="mb-2 font-semibold text-zinc-100">Limites de contratos simultâneos</h3><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-zinc-700 text-zinc-500"><th className="py-2">Nível</th><th>Máximo de contratos</th><th>Ativos simultaneamente</th></tr></thead><tbody>{[[10,2,1],[13,3,2],[15,4,3],[17,5,4],[20,6,6]].map(([l,m,a])=><tr key={l} className="border-b border-zinc-800"><td className="py-2">{l}</td><td>{m}</td><td>{a}</td></tr>)}</tbody></table></div><p className="mt-2">Exemplo: no nível 15, Dahlia pode ter quatro contratos assinados, dos quais três ativos ao mesmo tempo.</p></section>
            </div>
          </section>
        </div>
      )}
    </header>
  )
}
