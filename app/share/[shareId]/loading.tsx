export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <header className="mb-8 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded"></div>
      </header>

      <main className="flex-1 container mx-auto max-w-4xl">
        <div className="mb-4 animate-pulse">
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>

        <div className="mb-8 animate-pulse">
          <div className="bg-muted/50 rounded-2xl p-5">
            <div className="h-6 bg-muted rounded w-3/4"></div>
          </div>
        </div>

        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </main>
    </div>
  )
}
