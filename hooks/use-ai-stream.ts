"use client"

import { useState, useCallback } from "react"

export interface ToolCall {
  toolName: string
  args: any
  status: "running" | "complete" | "error"
  result?: any
}

export function useAIStream() {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [error, setError] = useState<string | null>(null)

  const stream = useCallback(async (endpoint: string, body: any) => {
    setText("")
    setIsLoading(true)
    setToolCalls([])
    setError(null)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === "text") {
                setText((prev) => prev + parsed.content)
              } else if (parsed.type === "tool-call-start") {
                setToolCalls((prev) => [
                  ...prev,
                  {
                    toolName: parsed.toolName,
                    args: parsed.args,
                    status: "running",
                  },
                ])
              } else if (parsed.type === "tool-call-complete") {
                setToolCalls((prev) =>
                  prev.map((tc) =>
                    tc.toolName === parsed.toolName && tc.status === "running"
                      ? { ...tc, status: "complete", result: parsed.result }
                      : tc,
                  ),
                )
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    text,
    isLoading,
    toolCalls,
    error,
    stream,
  }
}
