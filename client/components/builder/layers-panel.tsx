"use client"

import { Card } from "@/components/ui/card"
import type { BuilderElement } from "@/lib/builder-types"
import { Copy, Eye, EyeOff, Lock, Trash2, Unlock } from "lucide-react"
import { useState } from "react"

interface LayersPanelProps {
  elements: BuilderElement[]
  selectedElements: string[]
  onElementSelect: (elementId: string, multiSelect?: boolean) => void
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function LayersPanel({
  elements,
  selectedElements,
  onElementSelect,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  isOpen,
  onClose,
}: LayersPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["elements"]))

  if (!isOpen) return null

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleElementVisibility = (elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (element) {
      const isHidden = element.styles.display === "none"
      onUpdateElement(elementId, {
        styles: {
          ...element.styles,
          display: isHidden ? "block" : "none",
        }
      })
    }
  }

  const toggleElementLock = (elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (element) {
      const isLocked = element.props?.locked || false
      onUpdateElement(elementId, {
        props: {
          ...element.props,
          locked: !isLocked,
        }
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="absolute right-0 top-0 h-full w-80 bg-sidebar border-l border-sidebar-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border bg-gradient-to-r from-sidebar-accent/30 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-sidebar-foreground">Layers</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-sidebar-accent/50 rounded-md transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Elements Group */}
          <div>
            <button
              onClick={() => toggleGroup("elements")}
              className="flex items-center justify-between w-full p-2 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
            >
              <span className="font-medium text-sidebar-foreground">Elements ({elements.length})</span>
              <span className="text-sm text-muted-foreground">
                {expandedGroups.has("elements") ? "−" : "+"}
              </span>
            </button>

            {expandedGroups.has("elements") && (
              <div className="mt-2 space-y-1">
                {elements.map((element, index) => {
                  const isSelected = selectedElements.includes(element.id)
                  const isHidden = element.styles.display === "none"
                  const isLocked = element.props?.locked || false

                  return (
                    <Card
                      key={element.id}
                      className={`p-3 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30" 
                          : "hover:bg-sidebar-accent/50 border-sidebar-border/50"
                      }`}
                      onClick={() => onElementSelect(element.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Element Icon */}
                        <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {element.type.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Element Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              isHidden ? "text-muted-foreground line-through" : "text-sidebar-foreground"
                            }`}>
                              {element.type}
                            </span>
                            {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                            {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {element.content || "Empty element"}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleElementVisibility(element.id)
                            }}
                            className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors"
                            title={isHidden ? "Show element" : "Hide element"}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <Eye className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleElementLock(element.id)
                            }}
                            className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors"
                            title={isLocked ? "Unlock element" : "Lock element"}
                          >
                            {isLocked ? (
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <Unlock className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDuplicateElement(element.id)
                            }}
                            className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors"
                            title="Duplicate element"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteElement(element.id)
                            }}
                            className="p-1 hover:bg-destructive/20 rounded transition-colors"
                            title="Delete element"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
