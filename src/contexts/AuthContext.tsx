
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null

  useEffect(() => {
    let mounted = true
    let checkVersion = 0

    async function verifyAdmin(currentSession: Session | null) {
      const version = ++checkVersion

      if (!currentSession) {
        if (mounted) {
          setIsAdmin(false)
          setLoading(false)
        }
        return
      }

      if (mounted) {
        setLoading(true)
      }

      const { data, error } = await supabase.rpc('is_admin')

      if (!mounted || version !== checkVersion) return

      if (error) {
        console.error('Erro ao verificar administrador:', error)
        setIsAdmin(false)
      } else {
        setIsAdmin(data === true)
      }

      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return

      setSession(newSession)
      setIsAdmin(false)

      window.setTimeout(() => {
        void verifyAdmin(newSession)
      }, 0)
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return

      if (error) {
        console.error('Erro ao recuperar sessão:', error)
        setSession(null)
        void verifyAdmin(null)
        return
      }

      setSession(data.session)
      void verifyAdmin(data.session)
    })

    return () => {
      mounted = false
      checkVersion++
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

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
