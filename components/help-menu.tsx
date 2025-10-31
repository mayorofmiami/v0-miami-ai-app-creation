"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { AboutDialog } from "@/components/help/about-dialog"
import { TermsDialog } from "@/components/help/terms-dialog"
import { PrivacyDialog } from "@/components/help/privacy-dialog"
import Link from "next/link"

interface HelpMenuProps {
  isCollapsed?: boolean
  isMobile?: boolean
}

export function HelpMenu({ isCollapsed = false, isMobile = false }: HelpMenuProps) {
  const [showAbout, setShowAbout] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {isCollapsed ? (
            <Button variant="ghost" size="icon" className="w-full h-10" title="Help & Support">
              <span className="text-xl">❓</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              className={`w-full justify-start text-muted-foreground hover:text-foreground ${
                isMobile ? "h-14 sm:h-12 text-lg sm:text-base" : "h-10"
              }`}
            >
              <span className={`${isMobile ? "text-2xl sm:text-xl" : "text-xl"} mr-3`}>❓</span>
              <span>Help & Support</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align={isMobile ? "center" : "end"}
          className={isMobile ? "w-[280px]" : "w-56"}
          sideOffset={8}
        >
          <DropdownMenuItem asChild>
            <Link href="/blog" className="cursor-pointer">
              Blog & Updates
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowAbout(true)} className="cursor-pointer">
            About Miami.ai
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowTerms(true)} className="cursor-pointer">
            Terms of Service
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPrivacy(true)} className="cursor-pointer">
            Privacy Policy
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="mailto:support@miami.ai" className="cursor-pointer">
              Contact Support
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
      <PrivacyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
    </>
  )
}
