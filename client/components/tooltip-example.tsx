"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface TooltipExampleProps {
  tooltipText?: string
  triggerText?: string
  position?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function TooltipExample({ 
  tooltipText = "This is a tooltip with hover effects!",
  triggerText = "Hover me",
  position = "top",
  className = ""
}: TooltipExampleProps) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            className="px-4 py-2 bg-card hover:bg-card/80 border border-border hover:border-border/80 rounded-lg transition-all duration-200 text-sm font-medium text-card-foreground hover:text-card-foreground hover:shadow-md hover:scale-105"
          >
            <Info className="w-4 h-4 mr-2" />
            {triggerText}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={position} className="max-w-xs">
          <p className="font-medium">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
