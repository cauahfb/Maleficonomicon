
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { clearDataCache } from '../lib/dataCache'
import { AuthContext } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null

  const mountedRef = useRef(true)
  const initialCheckFinishedRef = useRef(false)
  const checkVersionRef = useRef(0)
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let effectActive = true
    mountedRef.current = true

    async function verifyAdmin(
      currentSession: Session | null,
      blockInitialRoute: boolean,
    ) {
      if (!effectActive || !mountedRef.current) return

      const version = ++checkVersionRef.current

      if (!currentSession) {
        if (
          !effectActive ||
          !mountedRef.current ||
          version !== checkVersionRef.current
        ) {
          return
        }

        setIsAdmin(false)
        setLoading(false)
        initialCheckFinishedRef.current = true
        currentUserIdRef.current = null
        return
      }

      if (blockInitialRoute && !initialCheckFinishedRef.current) {
        setLoading(true)
      }

      const { data, error } = await supabase.rpc('is_admin')

      if (
        !effectActive ||
        !mountedRef.current ||
        version !== checkVersionRef.current
      ) {
        return
      }

      if (error) {
        console.error('Erro ao verificar administrador:', error)
        setIsAdmin(false)
      } else {
        setIsAdmin(data === true)
      }

      currentUserIdRef.current = currentSession.user.id
      initialCheckFinishedRef.current = true
      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!effectActive || !mountedRef.current) return

      if (event === 'TOKEN_REFRESHED') {
        // A renovação do token não altera a identidade nem as permissões.
        // Mantemos a aplicação montada e os dados em cache.
        setSession(newSession)
        return
      }

      if (event === 'SIGNED_OUT' || !newSession) {
        checkVersionRef.current++
        currentUserIdRef.current = null
        clearDataCache()
        setSession(null)
        setIsAdmin(false)
        setLoading(false)
        initialCheckFinishedRef.current = true
        return
      }

      const userChanged =
        currentUserIdRef.current !== null &&
        currentUserIdRef.current !== newSession.user.id

      if (userChanged) {
        clearDataCache()
        setIsAdmin(false)
      }

      setSession(newSession)

      // Não bloqueia novamente o layout em eventos posteriores ao boot.
      // A verificação administrativa continua acontecendo em segundo plano.
      window.setTimeout(() => {
        if (!effectActive || !mountedRef.current) return

        void verifyAdmin(
          newSession,
          !initialCheckFinishedRef.current || event === 'SIGNED_IN',
        )
      }, 0)
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!effectActive || !mountedRef.current) return

      if (error) {
        console.error('Erro ao recuperar sessão:', error)
        clearDataCache()
        setSession(null)
        void verifyAdmin(null, true)
        return
      }

      const currentSession = data.session
      setSession(currentSession)

      if (
        currentSession &&
        currentUserIdRef.current !== null &&
        currentUserIdRef.current !== currentSession.user.id
      ) {
        clearDataCache()
      }

      void verifyAdmin(currentSession, true)
    })

    return () => {
      effectActive = false
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    clearDataCache()
    setSession(null)
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAdmin,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
