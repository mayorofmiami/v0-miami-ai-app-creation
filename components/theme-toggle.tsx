"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative"
    >
      <span className="text-xl rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0">☀️</span>
      <span className="absolute text-xl rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100">🌙</span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
