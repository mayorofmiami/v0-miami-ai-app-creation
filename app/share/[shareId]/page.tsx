import { Suspense } from "react"
import { SearchResponse } from "@/components/search-response"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSharedSearch } from "@/lib/share"

interface PageProps {
  params: Promise<{ shareId: string }>
}

export default async function SharedSearchPage({ params }: PageProps) {
  const { shareId } = await params
  const result = await getSharedSearch(shareId)

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Logo />
        <h1 className="text-2xl font-bold mt-8 mb-4">Shared search not found</h1>
        <Link href="/">
          <Button>Go to Miami.AI</Button>
        </Link>
      </div>
    )
  }

  const sharedSearch = result.data

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <header className="mb-8">
        <Logo />
      </header>

      <main className="flex-1 container mx-auto max-w-4xl">
        <div className="mb-4 text-sm text-muted-foreground">
          {sharedSearch.views || 0} view(s)
        </div>

        <div className="mb-8">
          <div className="bg-miami-aqua/10 rounded-2xl p-5">
            <h1 className="text-xl font-semibold text-foreground">{sharedSearch.query}</h1>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SearchResponse response={sharedSearch.response} citations={sharedSearch.citations || []} />
        </Suspense>

        <div className="mt-8 flex justify-center">
          <Link href="/">
            <Button className="bg-miami-aqua hover:bg-miami-aqua/90">Try Miami.AI</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
