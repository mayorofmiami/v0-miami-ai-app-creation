import type React from "react"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}

export function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-muted/50 border border-border rounded-xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className="text-miami-aqua">{icon}</div>
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {trend && (
          <div className={`text-sm ${trendUp ? "text-green-500" : "text-red-500"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </div>
        )}
      </div>
    </div>
  )
}
