import { getSharedSearch } from "@/lib/share"
import { SearchResponse } from "@/components/search-response"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { notFound } from 'next/navigation'

export default async function SharedSearchPage({ params }: { params: { token: string } }) {
  const result = await getSharedSearch(params.token)

  if (!result.success || !result.data) {
    notFound()
  }

  const search = result.data

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Image
              src="/images/design-mode/MiamiAILogo.png"
              alt="MIAMI.AI"
              width={200}
              height={40}
              className="neon-glow"
            />
          </Link>
          <Link href="/">
            <Button className="bg-miami-pink hover:bg-miami-pink/90">Try Miami.AI</Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{search.query}</h1>
            <span className="text-sm text-muted-foreground capitalize">{search.mode} search</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Shared on {new Date(search.created_at).toLocaleDateString()} • {search.views || 0} views
          </p>
        </div>

        <SearchResponse response={search.response} citations={search.citations || []} isStreaming={false} />
      </div>
    </div>
  )
}
