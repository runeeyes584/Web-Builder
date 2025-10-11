"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Tablet, Smartphone, X } from "lucide-react"
import type { BuilderElement, Breakpoint } from "@/lib/builder-types"

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  elements: BuilderElement[]
}

export function PreviewModal({ isOpen, onClose, elements }: PreviewModalProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>("desktop")

  const breakpointWidths = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  }

  const breakpointIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  }

  const getElementStyles = (element: BuilderElement): Record<string, any> => {
    const baseStyles = element.styles || {}
    const responsiveStyles = element.responsiveStyles?.[currentBreakpoint] || {}
    return { ...baseStyles, ...responsiveStyles }
  }

  const renderElement = (element: BuilderElement): React.ReactNode => {
    const styles = getElementStyles(element)

    switch (element.type) {
      case "heading":
        return (
          <h1 key={element.id} style={styles} className="text-foreground">
            {element.content}
          </h1>
        )
      case "paragraph":
        return (
          <p key={element.id} style={styles} className="text-foreground">
            {element.content}
          </p>
        )
      case "image":
        return (
          <img
            key={element.id}
            src={element.content || "/placeholder.svg"}
            alt={element.props?.alt || "Preview"}
            style={styles}
            className="max-w-full h-auto"
          />
        )
      case "button":
        return (
          <button key={element.id} style={styles} className="text-foreground">
            {element.content}
          </button>
        )
      case "section":
      case "grid":
      case "footer":
        return (
          <div key={element.id} style={styles}>
            {element.children?.map(renderElement)}
          </div>
        )
      case "navigation":
        return (
          <nav key={element.id} style={styles} className="text-foreground">
            {element.content}
          </nav>
        )
      case "form":
        return (
          <div key={element.id} style={styles} className="text-foreground">
            {element.content}
          </div>
        )
      default:
        return (
          <div key={element.id} style={styles} className="text-foreground">
            {element.content}
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Website Preview</DialogTitle>
            <div className="flex items-center gap-2">
              {/* Breakpoint Controls */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((breakpoint) => {
                  const Icon = breakpointIcons[breakpoint]
                  return (
                    <Button
                      key={breakpoint}
                      variant={currentBreakpoint === breakpoint ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentBreakpoint(breakpoint)}
                      className="h-8 w-8 p-0"
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  )
                })}
              </div>
              <Badge variant="outline" className="ml-2">
                {currentBreakpoint}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="flex justify-center">
            <div
              className={`${breakpointWidths[currentBreakpoint]} transition-all duration-300 bg-background border border-border rounded-lg shadow-lg min-h-[600px] overflow-hidden`}
            >
              <div className="p-0">{elements.map(renderElement)}</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Preview your website as it will appear to visitors</p>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
