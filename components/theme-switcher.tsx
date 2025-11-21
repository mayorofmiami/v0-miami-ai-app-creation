"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Palette } from "lucide-react"
import { themes } from "@/lib/themes"

export function ThemeSwitcher() {
  const applyTheme = (themeName: keyof typeof themes) => {
    const theme = themes[themeName]
    const root = document.documentElement

    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    localStorage.setItem("miami-ai-theme", themeName)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => applyTheme("default")}>Default</DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("ocean")}>Ocean</DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("forest")}>Forest</DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("sunset")}>Sunset</DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("midnight")}>Midnight</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
