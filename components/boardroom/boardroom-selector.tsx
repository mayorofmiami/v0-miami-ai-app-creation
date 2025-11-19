"use client"

import { BoardType } from "@/types"
import { Button } from "@/components/ui/button"

const BOARD_OPTIONS = [
  {
    type: "startup" as BoardType,
    label: "Startup Board",
    description: "CFO, CMO, CEO perspectives",
    icon: "💼",
  },
  {
    type: "ethical" as BoardType,
    label: "Ethical Board",
    description: "Ethics, pragmatism, optimism",
    icon: "⚖️",
  },
  {
    type: "creative" as BoardType,
    label: "Creative Board",
    description: "Artist, engineer, UX views",
    icon: "🎨",
  },
]

interface BoardroomSelectorProps {
  selectedBoard: BoardType
  onSelectBoard: (boardType: BoardType) => void
}

export function BoardroomSelector({ selectedBoard, onSelectBoard }: BoardroomSelectorProps) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-background/50 rounded-lg border">
      <p className="text-sm font-medium">Select Board Type:</p>
      <div className="flex gap-2 flex-wrap">
        {BOARD_OPTIONS.map((option) => (
          <Button
            key={option.type}
            variant={selectedBoard === option.type ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectBoard(option.type)}
            className="flex items-center gap-2"
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
