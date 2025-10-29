import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonSearch() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Citation skeleton */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-32 rounded-full shimmer" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>

      {/* Response skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            className={`h-4 shimmer ${i === 3 ? "w-3/4" : i === 5 ? "w-5/6" : "w-full"}`}
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>

      {/* More citations */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2].map((i) => (
          <Skeleton
            key={i}
            className="h-8 w-40 rounded-full shimmer"
            style={{ animationDelay: `${(i + 3) * 100}ms` }}
          />
        ))}
      </div>

      {/* More response */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className={`h-4 shimmer ${i === 2 ? "w-4/5" : "w-full"}`}
            style={{ animationDelay: `${(i + 5) * 50}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
