"use client"

import { useState, useEffect } from "react"

interface ExampleQueriesProps {
  onQueryClick: (query: string) => void
  variant?: "default" | "compact"
}

const EXAMPLE_QUERIES = [
  "What's happening in Miami tech scene?",
  "How do hurricanes form?",
  "Explain quantum computing simply",
  "Best places to work remotely in 2025",
  "Is artificial consciousness possible?",
  "How does the human brain store memories?",
  "What causes the northern lights?",
  "Future of renewable energy",
  "Can we reverse climate change?",
  "What is dark matter?",
  "How do languages evolve over time?",
  "The science behind lucid dreaming",
]

export function ExampleQueries({ onQueryClick, variant = "default" }: ExampleQueriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayText, setDisplayText] = useState(EXAMPLE_QUERIES[0])

  const isCompact = variant === "compact"

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length)
        setIsTransitioning(false)
      }, 600)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isTransitioning) {
      setDisplayText(EXAMPLE_QUERIES[currentIndex])
    }
  }, [currentIndex, isTransitioning])

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <button
        onClick={() => onQueryClick(EXAMPLE_QUERIES[currentIndex])}
        className="group relative px-4 py-2 active:scale-95"
        style={{
          transition: "transform var(--duration-fast) var(--easing-spring)",
        }}
      >
        <div
          className={`
            text-lg md:text-xl font-medium text-center
            bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple 
            bg-clip-text text-transparent
            ${isTransitioning ? "opacity-0 blur-sm scale-95" : "opacity-100 blur-0 scale-100"}
          `}
          style={{
            backgroundSize: "200% auto",
            animation: "gradient-shift 8s ease infinite",
            transition:
              "opacity var(--duration-slower) var(--easing-standard), filter var(--duration-slower) var(--easing-standard), transform var(--duration-slower) var(--easing-standard)",
          }}
        >
          {displayText}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-miami-aqua via-miami-blue to-miami-purple opacity-0 group-hover:opacity-60 rounded-full"
          style={{ transition: "opacity var(--duration-normal) var(--easing-standard)" }}
        />
      </button>

      <div className="mt-4">
        <p className="text-xs text-muted-foreground/50">Click to search • New idea every 3 seconds</p>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  )
}
