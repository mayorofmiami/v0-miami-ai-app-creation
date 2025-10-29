"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface AdminChartProps {
  data: Array<{ date: string; count: number }>
  title: string
  color?: string
}

export function AdminChart({ data, title, color = "#02D8E9" }: AdminChartProps) {
  const formattedData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: Number(item.count),
  }))

  return (
    <div className="bg-muted/50 border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#888" style={{ fontSize: "12px" }} />
          <YAxis stroke="#888" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
          />
          <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={{ fill: color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
