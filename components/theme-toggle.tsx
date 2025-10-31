"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import Sun from "@/components/icons/Sun"
import Moon from "@/components/icons/Moon"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative"
    >
      <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" size={20} />
      <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" size={20} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
