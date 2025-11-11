"use client"

import { Card } from "@/components/ui/card"
import type { BuilderElement, RegionsLayout } from "@/lib/builder-types"
import { Copy, Eye, EyeOff, Lock, Trash2, Unlock } from "lucide-react"
import React, { useCallback, useMemo, useState } from "react"

interface LayersPanelProps {
  elements: BuilderElement[]
  selectedElements: string[]
  onElementSelect: (elementId: string, multiSelect?: boolean) => void
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  isOpen: boolean
  onClose: () => void
  regions?: RegionsLayout
}

export const LayersPanel = React.memo(function LayersPanel({
  elements,
  selectedElements,
  onElementSelect,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  isOpen,
  onClose,
  regions,
}: LayersPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["header", "footer", "section-0"]))

  if (!isOpen) return null

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(groupName)) {
        newExpanded.delete(groupName)
      } else {
        newExpanded.add(groupName)
      }
      return newExpanded
    })
  }, [])

  const toggleElementVisibility = useCallback((elementId: string) => {
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
  }, [elements, onUpdateElement])

  const toggleElementLock = useCallback((elementId: string) => {
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
  }, [elements, onUpdateElement])

  // Helper to group elements by region using the passed layout - memoized để tránh tính toán lại
  const grouped = useMemo(() => {
    if (!regions) {
      return {
        header: [] as BuilderElement[],
        sections: [] as { key: string; index: number; elements: BuilderElement[] }[],
        footer: [] as BuilderElement[],
      }
    }

    const headerEls: BuilderElement[] = []
    const footerEls: BuilderElement[] = []
    const sectionGroups = regions.sections.map((s) => ({ key: `section-${s.index}`, index: s.index, elements: [] as BuilderElement[] }))

    const inRange = (y: number, top: number, height: number) => y >= top && y < top + height

    elements.forEach((el) => {
      const y = el.position?.y ?? 0
      if (inRange(y, regions.header.top, regions.header.height)) {
        headerEls.push(el)
        return
      }
      for (const s of regions.sections) {
        if (inRange(y, s.top, s.height)) {
          const grp = sectionGroups.find((g) => g.index === s.index)
          grp?.elements.push(el)
          return
        }
      }
      if (inRange(y, regions.footer.top, regions.footer.height)) {
        footerEls.push(el)
      }
    })

    // Sort elements within groups by their Y position for consistent order
    const byY = (a: BuilderElement, b: BuilderElement) => (a.position?.y ?? 0) - (b.position?.y ?? 0)
    headerEls.sort(byY)
    footerEls.sort(byY)
    sectionGroups.forEach((g) => g.elements.sort(byY))

    return { header: headerEls, sections: sectionGroups, footer: footerEls }
  }, [elements, regions])

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
          {regions ? (
            <>
              {/* Header Group */}
              <div>
                <button
                  onClick={() => toggleGroup("header")}
                  className="flex items-center justify-between w-full p-2 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                >
                  <span className="font-medium text-sidebar-foreground">Header (#{grouped.header.length})</span>
                  <span className="text-sm text-muted-foreground">{expandedGroups.has("header") ? "−" : "+"}</span>
                </button>
                {expandedGroups.has("header") && (
                  <div className="mt-2 space-y-1">
                    {grouped.header.map((element) => {
                      const isSelected = selectedElements.includes(element.id)
                      const isHidden = element.styles.display === "none"
                      const isLocked = element.props?.locked || false
                      return (
                        <Card
                          key={element.id}
                          className={`p-3 cursor-pointer transition-all duration-200 ${isSelected ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30" : "hover:bg-sidebar-accent/50 border-sidebar-border/50"}`}
                          onClick={() => onElementSelect(element.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">{element.type.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isHidden ? "text-muted-foreground line-through" : "text-sidebar-foreground"}`}>{element.type}</span>
                                {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                                {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{element.content || "Empty element"}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); toggleElementVisibility(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title={isHidden ? "Show element" : "Hide element"}>{isHidden ? (<EyeOff className="w-3 h-3 text-muted-foreground" />) : (<Eye className="w-3 h-3 text-muted-foreground" />)}</button>
                              <button onClick={(e) => { e.stopPropagation(); toggleElementLock(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title={isLocked ? "Unlock element" : "Lock element"}>{isLocked ? (<Lock className="w-3 h-3 text-muted-foreground" />) : (<Unlock className="w-3 h-3 text-muted-foreground" />)}</button>
                              <button onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title="Duplicate element"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                              <button onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id) }} className="p-1 hover:bg-destructive/20 rounded transition-colors" title="Delete element"><Trash2 className="w-3 h-3 text-destructive" /></button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sections Groups */}
              {grouped.sections.map((sec) => (
                <div key={sec.key}>
                  <button
                    onClick={() => toggleGroup(sec.key)}
                    className="flex items-center justify-between w-full p-2 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                  >
                    <span className="font-medium text-sidebar-foreground">Section {sec.index + 1} (#{sec.elements.length})</span>
                    <span className="text-sm text-muted-foreground">{expandedGroups.has(sec.key) ? "−" : "+"}</span>
                  </button>
                  {expandedGroups.has(sec.key) && (
                    <div className="mt-2 space-y-1">
                      {sec.elements.map((element) => {
                        const isSelected = selectedElements.includes(element.id)
                        const isHidden = element.styles.display === "none"
                        const isLocked = element.props?.locked || false
                        return (
                          <Card
                            key={element.id}
                            className={`p-3 cursor-pointer transition-all duration-200 ${isSelected ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30" : "hover:bg-sidebar-accent/50 border-sidebar-border/50"}`}
                            onClick={() => onElementSelect(element.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">{element.type.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${isHidden ? "text-muted-foreground line-through" : "text-sidebar-foreground"}`}>{element.type}</span>
                                  {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                                  {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{element.content || "Empty element"}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); toggleElementVisibility(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title={isHidden ? "Show element" : "Hide element"}>{isHidden ? (<EyeOff className="w-3 h-3 text-muted-foreground" />) : (<Eye className="w-3 h-3 text-muted-foreground" />)}</button>
                                <button onClick={(e) => { e.stopPropagation(); toggleElementLock(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title={isLocked ? "Unlock element" : "Lock element"}>{isLocked ? (<Lock className="w-3 h-3 text-muted-foreground" />) : (<Unlock className="w-3 h-3 text-muted-foreground" />)}</button>
                                <button onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title="Duplicate element"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id) }} className="p-1 hover:bg-destructive/20 rounded transition-colors" title="Delete element"><Trash2 className="w-3 h-3 text-destructive" /></button>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Footer Group */}
              <div>
                <button
                  onClick={() => toggleGroup("footer")}
                  className="flex items-center justify-between w-full p-2 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                >
                  <span className="font-medium text-sidebar-foreground">Footer (#{grouped.footer.length})</span>
                  <span className="text-sm text-muted-foreground">{expandedGroups.has("footer") ? "−" : "+"}</span>
                </button>
                {expandedGroups.has("footer") && (
                  <div className="mt-2 space-y-1">
                    {grouped.footer.map((element) => {
                      const isSelected = selectedElements.includes(element.id)
                      const isHidden = element.styles.display === "none"
                      const isLocked = element.props?.locked || false
                      return (
                        <Card
                          key={element.id}
                          className={`p-3 cursor-pointer transition-all duration-200 ${isSelected ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30" : "hover:bg-sidebar-accent/50 border-sidebar-border/50"}`}
                          onClick={() => onElementSelect(element.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">{element.type.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isHidden ? "text-muted-foreground line-through" : "text-sidebar-foreground"}`}>{element.type}</span>
                                {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                                {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{element.content || "Empty element"}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); toggleElementVisibility(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title={isHidden ? "Show element" : "Hide element"}>{isHidden ? (<EyeOff className="w-3 h-3 text-muted-foreground" />) : (<Eye className="w-3 h-3 text-muted-foreground" />)}</button>
                              <button onClick={(e) => { e.stopPropagation(); toggleElementLock(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title={isLocked ? "Unlock element" : "Lock element"}>{isLocked ? (<Lock className="w-3 h-3 text-muted-foreground" />) : (<Unlock className="w-3 h-3 text-muted-foreground" />)}</button>
                              <button onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title="Duplicate element"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                              <button onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id) }} className="p-1 hover:bg-destructive/20 rounded transition-colors" title="Delete element"><Trash2 className="w-3 h-3 text-destructive" /></button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            // Fallback to legacy flat list if regions are not yet available
            <div>
              <button
                onClick={() => toggleGroup("elements")}
                className="flex items-center justify-between w-full p-2 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
              >
                <span className="font-medium text-sidebar-foreground">Elements ({elements.length})</span>
                <span className="text-sm text-muted-foreground">{expandedGroups.has("elements") ? "−" : "+"}</span>
              </button>
              {expandedGroups.has("elements") && (
                <div className="mt-2 space-y-1">
                  {elements.map((element) => {
                    const isSelected = selectedElements.includes(element.id)
                    const isHidden = element.styles.display === "none"
                    const isLocked = element.props?.locked || false
                    return (
                      <Card key={element.id} className={`p-3 cursor-pointer transition-all duration-200 ${isSelected ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30" : "hover:bg-sidebar-accent/50 border-sidebar-border/50"}`} onClick={() => onElementSelect(element.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{element.type.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${isHidden ? "text-muted-foreground line-through" : "text-sidebar-foreground"}`}>{element.type}</span>
                              {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                              {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{element.content || "Empty element"}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); toggleElementVisibility(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title={isHidden ? "Show element" : "Hide element"}>{isHidden ? (<EyeOff className="w-3 h-3 text-muted-foreground" />) : (<Eye className="w-3 h-3 text-muted-foreground" />)}</button>
                            <button onClick={(e) => { e.stopPropagation(); toggleElementLock(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title={isLocked ? "Unlock element" : "Lock element"}>{isLocked ? (<Lock className="w-3 h-3 text-muted-foreground" />) : (<Unlock className="w-3 h-3 text-muted-foreground" />)}</button>
                            <button onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id) }} className="p-1 hover:bg-sidebar-accent/50 rounded transition-colors" title="Duplicate element"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id) }} className="p-1 hover:bg-destructive/20 rounded transition-colors" title="Delete element"><Trash2 className="w-3 h-3 text-destructive" /></button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
