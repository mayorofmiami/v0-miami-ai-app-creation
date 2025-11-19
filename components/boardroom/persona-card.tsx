'use client'

import { useState } from 'react'
import { BoardResponse } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react'

interface PersonaCardProps {
  name: string
  role: string
  avatar: string
  model: string
  responses: BoardResponse[]
  currentRound: number
  tldr?: string
  vote?: 'agree' | 'disagree' | null
  onVote?: (voteType: 'agree' | 'disagree') => void
  // </CHANGE>
}

export function PersonaCard({ 
  name, 
  role, 
  avatar, 
  model, 
  responses, 
  currentRound,
  tldr,
  vote,
  onVote
}: PersonaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  // </CHANGE>

  const response = responses.find((r) => r.round === currentRound)
  const isLoading = !response || !response.content

  const modelDisplay = model.split('/')[1]?.replace(/-/g, ' ').toUpperCase() || model

  return (
    <Card className="p-4 flex flex-col min-h-[200px] hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b">
        <div className="text-3xl">{avatar}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{name}</h3>
          <p className="text-xs text-muted-foreground truncate">{role}</p>
          <Badge variant="secondary" className="mt-1 text-xs">
            {modelDisplay}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            <span>Thinking...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {tldr && !isExpanded ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {tldr}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="text-xs h-auto py-1 px-2"
                >
                  Read more <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm leading-relaxed space-y-3">
                  {response.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {tldr && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="text-xs h-auto py-1 px-2"
                  >
                    Show less <ChevronUp className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            )}
            {/* </CHANGE> */}
          </div>
        )}
      </div>

      {!isLoading && onVote && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground mr-auto">Your take:</span>
          <Button
            variant={vote === 'agree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onVote('agree')}
            className="gap-1 h-8 text-xs"
          >
            <ThumbsUp className="w-3 h-3" />
            Agree
          </Button>
          <Button
            variant={vote === 'disagree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onVote('disagree')}
            className="gap-1 h-8 text-xs"
          >
            <ThumbsDown className="w-3 h-3" />
            Disagree
          </Button>
        </div>
      )}
      {/* </CHANGE> */}
    </Card>
  )
}
