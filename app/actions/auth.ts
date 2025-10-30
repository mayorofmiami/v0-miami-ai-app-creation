"use server"

import { signUp, signIn, createSession, logout } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const result = await signUp(email, password, name)

  if (!result.success) {
    return { error: result.error }
  }

  // Create session
  await createSession(result.userId!)

  redirect("/")
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const result = await signIn(email, password)

  if (!result.success) {
    return { error: result.error }
  }

  // Create session
  await createSession(result.userId!)

  redirect("/")
}

export async function logoutAction() {
  await logout()
}
