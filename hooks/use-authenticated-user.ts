"use client"

import { createContext, useContext } from "react"
import type { User } from "@/lib/auth"

export const UserContext = createContext<User | null>(null)

export function useAuthenticatedUser() {
  const user = useContext(UserContext)
  return user
}
