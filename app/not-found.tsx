import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/images/design-mode/MiamiAILogo.png"
            alt="MIAMI.AI"
            width={300}
            height={60}
            className="neon-glow"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-8xl font-bold gradient-text neon-glow">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Button asChild variant="outline" className="border-miami-pink/30 bg-transparent">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-miami-pink to-miami-blue hover:opacity-90">
            <Link href="/">
              <Search className="w-4 h-4 mr-2" />
              Start Searching
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
