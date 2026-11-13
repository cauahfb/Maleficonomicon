
import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthContextData {
  session: Session | null
  user: User | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextData | undefined>(
  undefined
)
