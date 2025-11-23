"use client"

import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { BuilderElement, RegionsLayout } from "@/lib/builder-types"
import { 
  AlignCenter, 
  AlignHorizontalJustifyCenter, 
  AlignHorizontalJustifyEnd, 
  AlignHorizontalJustifyStart, 
  AlignVerticalJustifyCenter, 
  AlignVerticalJustifyEnd, 
  AlignVerticalJustifyStart, 
  ArrowDown, 
  ArrowUp, 
  Copy, 
  Eye, 
  EyeOff, 
  Lock, 
  MoreVertical, 
  MoveDown, 
  MoveUp, 
  RotateCcw, 
  RotateCw, 
  Type,
  Trash2, 
  Unlock,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import React, { useCallback, useMemo, useState } from "react"
import { useElementActions } from "./element-context-menu"

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
  // All hooks must be called before any conditional returns
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["header", "footer", "section-0"]))

  // Use shared element actions from context menu
  const {
    toggleElementVisibility,
    toggleElementLock,
    moveElementForward,
    moveElementBackward,
    bringToFront,
    sendToBack,
    alignElement,
    rotateElement,
  } = useElementActions(elements, onUpdateElement, regions)

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

  // Rename function
  const [renamingElementId, setRenamingElementId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const startRename = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (element) {
      setRenamingElementId(elementId)
      setRenameValue(element.props?.name || element.type)
    }
  }, [elements])

  const finishRename = useCallback((elementId: string) => {
    if (renameValue.trim()) {
      const element = elements.find(el => el.id === elementId)
      if (element) {
        onUpdateElement(elementId, {
          props: {
            ...element.props,
            name: renameValue.trim(),
          }
        })
      }
    }
    setRenamingElementId(null)
    setRenameValue('')
  }, [renameValue, elements, onUpdateElement])

  // Reusable LayerElementCard component with all actions
  const LayerElementCard = useCallback(({ element }: { element: BuilderElement }) => {
    const isSelected = selectedElements.includes(element.id)
    const isHidden = element.styles.display === "none"
    const isLocked = element.props?.locked || false
    const isRenaming = renamingElementId === element.id
    const displayName = element.props?.name || element.type

    return (
      <Card
        key={element.id}
        className={`p-3 cursor-pointer transition-all duration-200 ${
          isSelected
            ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30"
            : "hover:bg-sidebar-accent/50 border-sidebar-border/50"
        }`}
        onClick={() => !isRenaming && onElementSelect(element.id)}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {element.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isRenaming ? (
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => finishRename(element.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRename(element.id)
                    if (e.key === 'Escape') {
                      setRenamingElementId(null)
                      setRenameValue('')
                    }
                    e.stopPropagation()
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 text-sm px-2"
                  autoFocus
                />
              ) : (
                <span
                  className={`text-sm font-medium ${
                    isHidden ? "text-muted-foreground line-through" : "text-sidebar-foreground"
                  }`}
                >
                  {displayName}
                </span>
              )}
              {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
              {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
            </div>
            {!isRenaming && (
              <p className="text-xs text-muted-foreground truncate">
                {element.content || "Empty element"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Quick action buttons with enhanced hover effects */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleElementVisibility(element.id)
              }}
              className="p-1 hover:bg-sidebar-accent rounded transition-all duration-200 group"
              title={isHidden ? "Show element" : "Hide element"}
            >
              {isHidden ? (
                <EyeOff className="w-3 h-3 text-muted-foreground group-hover:text-sidebar-foreground group-hover:scale-110 transition-all" />
              ) : (
                <Eye className="w-3 h-3 text-muted-foreground group-hover:text-sidebar-foreground group-hover:scale-110 transition-all" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleElementLock(element.id)
              }}
              className="p-1 hover:bg-sidebar-accent rounded transition-all duration-200 group"
              title={isLocked ? "Unlock element" : "Lock element"}
            >
              {isLocked ? (
                <Lock className="w-3 h-3 text-muted-foreground group-hover:text-sidebar-foreground group-hover:scale-110 transition-all" />
              ) : (
                <Unlock className="w-3 h-3 text-muted-foreground group-hover:text-sidebar-foreground group-hover:scale-110 transition-all" />
              )}
            </button>

            {/* Quick delete button with enhanced hover effect */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteElement(element.id)
              }}
              className="p-1 hover:bg-destructive/20 rounded transition-all duration-200 group"
              title="Delete element"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground group-hover:text-destructive group-hover:scale-110 transition-all" />
            </button>

            {/* Dropdown menu with more options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-sidebar-accent rounded transition-all duration-200 group"
                  title="More options"
                >
                  <MoreVertical className="w-3 h-3 text-muted-foreground group-hover:text-sidebar-foreground group-hover:scale-110 transition-all" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[150]">
                {/* Arrange Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <MoveUp className="w-4 h-4 mr-2" />
                    Arrange
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="z-[150]">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        bringToFront(element.id)
                      }}
                    >
                      <ArrowUp className="w-4 h-4 mr-2" />
                      Bring to Front
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        moveElementForward(element.id)
                      }}
                    >
                      <MoveUp className="w-4 h-4 mr-2" />
                      Move Forward
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        moveElementBackward(element.id)
                      }}
                    >
                      <MoveDown className="w-4 h-4 mr-2" />
                      Move Backward
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        sendToBack(element.id)
                      }}
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Send to Back
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Align To Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <AlignCenter className="w-4 h-4 mr-2" />
                    Align To
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="z-[150]">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        alignElement(element.id, 'left')
                      }}
                    >
                      <AlignHorizontalJustifyStart className="w-4 h-4 mr-2" />
                      Left
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        alignElement(element.id, 'center')
                      }}
                    >
                      <AlignHorizontalJustifyCenter className="w-4 h-4 mr-2" />
                      Center
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        alignElement(element.id, 'right')
                      }}
                    >
                      <AlignHorizontalJustifyEnd className="w-4 h-4 mr-2" />
                      Right
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        alignElement(element.id, 'top')
                      }}
                    >
                      <AlignVerticalJustifyStart className="w-4 h-4 mr-2" />
                      Top
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        alignElement(element.id, 'middle')
                      }}
                    >
                      <AlignVerticalJustifyCenter className="w-4 h-4 mr-2" />
                      Middle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        alignElement(element.id, 'bottom')
                      }}
                    >
                      <AlignVerticalJustifyEnd className="w-4 h-4 mr-2" />
                      Bottom
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Rotate Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RotateCw className="w-4 h-4 mr-2" />
                    Rotate
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="z-[150]">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        rotateElement(element.id, 90)
                      }}
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      Rotate +90°
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        rotateElement(element.id, -90)
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Rotate -90°
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* Rename */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    startRename(element.id)
                  }}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Existing actions */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleElementVisibility(element.id)
                  }}
                >
                  {isHidden ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleElementLock(element.id)
                  }}
                >
                  {isLocked ? (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Lock
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicateElement(element.id)
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteElement(element.id)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    )
  }, [selectedElements, onElementSelect, toggleElementVisibility, toggleElementLock, onDuplicateElement, onDeleteElement, renamingElementId, renameValue, setRenameValue, finishRename, startRename, bringToFront, moveElementForward, moveElementBackward, sendToBack, alignElement, rotateElement])

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

  // Early return AFTER all hooks are called
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="absolute right-0 top-0 h-full w-80 bg-sidebar border-l border-sidebar-border shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border bg-gradient-to-r from-sidebar-accent/30 to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-sidebar-foreground">Layers</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive rounded-md transition-all duration-200 text-muted-foreground"
              title="Close Layers"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
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
                    {grouped.header.map((element) => (
                      <LayerElementCard key={element.id} element={element} />
                    ))}
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
                      {sec.elements.map((element) => (
                        <LayerElementCard key={element.id} element={element} />
                      ))}
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
                    {grouped.footer.map((element) => (
                      <LayerElementCard key={element.id} element={element} />
                    ))}
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
                  {elements.map((element) => (
                    <LayerElementCard key={element.id} element={element} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
