"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AuthPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: string
}

export function AuthPromptDialog({ open, onOpenChange, feature }: AuthPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Sign in required</DialogTitle>
          <DialogDescription>You need to be signed in to {feature}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-miami-aqua hover:bg-miami-aqua/90 text-white">Sign In</Button>
          </Link>
          <Link href="/signup" className="w-full">
            <Button variant="outline" className="w-full border-2 bg-transparent">
              Create Account
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
