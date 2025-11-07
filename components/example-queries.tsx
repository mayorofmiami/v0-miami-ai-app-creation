"use client"

import { useState } from "react"

interface ExampleQueriesProps {
  onQueryClick: (query: string) => void
  variant?: "default" | "compact"
}

const EXAMPLE_QUERIES = [
  { query: "Which Miami AI startups raised funding in 2025?", emoji: "🤖" },
  { query: "Is Miami real estate overvalued vs Austin?", emoji: "🏠" },
  { query: "Best coworking spaces in Wynwood", emoji: "💼" },
  { query: "Miami's crypto scene in 2025", emoji: "₿" },
  { query: "Top new restaurants in Brickell", emoji: "🍽️" },
  { query: "Remote work visa options for Miami", emoji: "✈️" },
  { query: "Miami Beach climate adaptation plans", emoji: "🌊" },
  { query: "Best nightlife spots in South Beach", emoji: "🎉" },
]

export function ExampleQueries({ onQueryClick, variant = "default" }: ExampleQueriesProps) {
  const [showAllExamples, setShowAllExamples] = useState(false)

  const isCompact = variant === "compact"

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {EXAMPLE_QUERIES.map((example, index) => {
        const shouldHide = index >= 3 && !showAllExamples
        const hideOnDesktop = index >= 6

        const buttonClasses = isCompact
          ? `group ${shouldHide ? "hidden md:inline-flex" : "inline-flex"} items-center gap-2 px-4 py-2 rounded-full border border-border/50 hover:border-miami-aqua/50 bg-background/50 hover:bg-miami-aqua/5 transition-all duration-200 hover:shadow-sm hover:shadow-miami-aqua/10`
          : `group ${shouldHide ? "hidden md:inline-flex" : "inline-flex"} items-center gap-2.5 px-5 py-3.5 md:px-5 md:py-3 rounded-full border border-border/50 hover:border-miami-aqua/50 bg-background/50 hover:bg-miami-aqua/5 transition-all duration-300 hover:shadow-md hover:shadow-miami-aqua/10 hover:scale-105 active:scale-95`

        const mobileButtonClasses = isCompact
          ? `group ${shouldHide ? "hidden" : "inline-flex"} md:hidden items-center gap-2 px-4 py-2 rounded-full border border-border/50 hover:border-miami-aqua/50 bg-background/50 hover:bg-miami-aqua/5 transition-all duration-200 hover:shadow-sm hover:shadow-miami-aqua/10`
          : `group ${shouldHide ? "hidden" : "inline-flex"} md:hidden items-center gap-2.5 px-5 py-3.5 md:px-5 md:py-3 rounded-full border border-border/50 hover:border-miami-aqua/50 bg-background/50 hover:bg-miami-aqua/5 transition-all duration-300 hover:shadow-md hover:shadow-miami-aqua/10 hover:scale-105 active:scale-95`

        const emojiClasses = isCompact
          ? "text-base group-hover:scale-110 transition-transform duration-200"
          : "text-xl md:text-lg group-hover:scale-110 transition-transform duration-200"

        const textClasses = isCompact
          ? "text-sm font-medium text-foreground/80 group-hover:text-miami-aqua transition-colors whitespace-nowrap"
          : "text-base md:text-base font-medium text-foreground/80 group-hover:text-miami-aqua transition-colors whitespace-nowrap"

        if (hideOnDesktop) {
          return (
            <button key={index} onClick={() => onQueryClick(example.query)} className={mobileButtonClasses}>
              <span className={emojiClasses}>{example.emoji}</span>
              <span className={textClasses}>{example.query}</span>
            </button>
          )
        }

        return (
          <button key={index} onClick={() => onQueryClick(example.query)} className={buttonClasses}>
            <span className={emojiClasses}>{example.emoji}</span>
            <span className={textClasses}>{example.query}</span>
          </button>
        )
      })}

      {!showAllExamples && (
        <button
          onClick={() => setShowAllExamples(true)}
          className={
            isCompact
              ? "md:hidden group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-miami-aqua/50 bg-miami-aqua/5 hover:bg-miami-aqua/10 transition-all duration-200"
              : "md:hidden group inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-miami-aqua/50 bg-miami-aqua/5 hover:bg-miami-aqua/10 transition-all duration-300 hover:shadow-md hover:shadow-miami-aqua/20 active:scale-95"
          }
        >
          <span
            className={
              isCompact
                ? "text-base group-hover:scale-110 transition-transform duration-200"
                : "text-xl group-hover:scale-110 transition-transform duration-200"
            }
          >
            +
          </span>
          <span
            className={
              isCompact
                ? "text-xs font-medium text-miami-aqua transition-colors whitespace-nowrap"
                : "text-base font-medium text-miami-aqua transition-colors whitespace-nowrap"
            }
          >
            More
          </span>
        </button>
      )}
    </div>
  )
}
