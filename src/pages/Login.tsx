
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, LockKeyhole } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
    const navigate = useNavigate()
    const { user, isAdmin, loading } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!loading && user && isAdmin) {
            navigate('/', { replace: true })
        }
    }, [user, isAdmin, loading, navigate])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setSubmitting(true)

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (loginError) {
            console.error('Erro detalhado do Supabase Auth:', loginError)

            setError(
                `Erro de autenticação: ${loginError.message} (${loginError.status ?? 'sem status'})`
            )

            setSubmitting(false)
            return
        }

        setSubmitting(false)
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#09090B] px-5 py-10 text-[#F4F4F5]">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#52525B] bg-[#18181B]">
                        <BookOpen size={30} className="text-[#D4D4D8]" />
                    </div>

                    <h1 className="font-serif text-2xl font-semibold tracking-[0.12em]">
                        MALEFICONOMICON
                    </h1>

                    <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[#71717A]">
                        Acesso administrativo
                    </p>
                </div>

                <div className="rounded-lg border border-[#27272A] bg-[#111113] p-7 shadow-2xl">
                    <div className="mb-7">
                        <div className="mb-3 flex items-center gap-2 text-[#A1A1AA]">
                            <LockKeyhole size={17} />
                            <span className="text-xs uppercase tracking-[0.2em]">
                                Identificação
                            </span>
                        </div>

                        <h2 className="font-serif text-xl">
                            Entre no grimório
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-[#71717A]">
                            Informe suas credenciais para acessar as funções administrativas.
                        </p>
                    </div>

                    {user && !isAdmin && !loading && (
                        <div className="mb-5 rounded-md border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
                            Esta conta não possui permissão de administrador.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-xs text-[#A1A1AA]"
                            >
                                E-mail
                            </label>

                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="w-full rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-3 text-sm outline-none transition focus:border-[#A1A1AA]"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-xs text-[#A1A1AA]"
                            >
                                Senha
                            </label>

                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="w-full rounded-md border border-[#3F3F46] bg-[#09090B] px-3 py-3 text-sm outline-none transition focus:border-[#A1A1AA]"
                                placeholder="Sua senha"
                            />
                        </div>

                        {error && (
                            <p className="rounded-md border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || loading}
                            className="w-full rounded-md border border-[#71717A] bg-[#27272A] px-4 py-3 text-sm font-medium transition hover:bg-[#3F3F46] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? 'Verificando...' : 'Entrar no grimório'}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-[10px] uppercase tracking-[0.18em] text-[#52525B]">
                    Conhecimento tem seu preço.
                </p>
            </div>
        </main>
    )
}
