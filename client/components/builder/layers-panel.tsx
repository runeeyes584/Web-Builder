"use client"

import { Card } from "@/components/ui/card"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
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
  Plus,
  Clipboard,
  LayoutTemplate,
  PanelTop,
  PanelBottom,
  Pencil,
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
  // Section action callbacks
  sections?: { id: string; height: number; name?: string }[]
  headerHeight?: number
  footerHeight?: number
  copiedElements?: BuilderElement[] | null
  onAddSectionAbove?: (index: number) => void
  onAddSectionBelow?: (index: number) => void
  onMoveSectionUp?: (index: number) => void
  onMoveSectionDown?: (index: number) => void
  onCopyElements?: (sectionIndex: number) => void
  onPasteElements?: (sectionIndex: number) => void
  onDeleteSection?: (index: number) => void
  onRenameSection?: (index: number, newName: string) => void
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
  // Section action props
  sections = [],
  headerHeight = 96,
  footerHeight = 96,
  copiedElements = null,
  onAddSectionAbove,
  onAddSectionBelow,
  onMoveSectionUp,
  onMoveSectionDown,
  onCopyElements,
  onPasteElements,
  onDeleteSection,
  onRenameSection,
}: LayersPanelProps) {
  // All hooks must be called before any conditional returns
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["header", "footer", "section-0"]))
  // Track which section is being renamed in layers panel
  const [renamingSectionIndex, setRenamingSectionIndex] = useState<number>(-1)

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

  // Reusable LayerElementCard component with all actions
  const LayerElementCard = useCallback(({ element }: { element: BuilderElement }) => {
    const isSelected = selectedElements.includes(element.id)
    const isHidden = element.styles.display === "none"
    const isLocked = element.props?.locked || false
    const displayName = element.props?.name || element.type

    return (
      <Card
        key={element.id}
        className={`p-3 cursor-pointer transition-all duration-200 ${
          isSelected
            ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30"
            : "hover:bg-sidebar-accent/50 border-sidebar-border/50"
        }`}
        onClick={(e) => onElementSelect(element.id, e.ctrlKey || e.metaKey || e.shiftKey)}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {element.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  isHidden ? "text-muted-foreground line-through" : "text-sidebar-foreground"
                }`}
              >
                {displayName}
              </span>
              {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
              {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {element.content || "Empty element"}
            </p>
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
  }, [selectedElements, onElementSelect, toggleElementVisibility, toggleElementLock, onDuplicateElement, onDeleteElement, bringToFront, moveElementForward, moveElementBackward, sendToBack, alignElement, rotateElement])

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
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {regions ? (
            <>
              {/* Header Group - with distinct styling and icon */}
              <div className="bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                <button
                  onClick={() => toggleGroup("header")}
                  className="flex items-center justify-between w-full p-3 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <PanelTop className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-emerald-500">Header</span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {grouped.header.length}
                    </span>
                  </div>
                  {expandedGroups.has("header") ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedGroups.has("header") && grouped.header.length > 0 && (
                  <div className="px-3 pb-3 space-y-1 ml-4 border-l-2 border-emerald-500/30">
                    {grouped.header.map((element) => (
                      <LayerElementCard key={element.id} element={element} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sections Groups - each with context menu */}
              {grouped.sections.map((sec) => {
                const sectionIndex = sec.index
                const sectionData = sections[sectionIndex]
                const sectionName = sectionData?.name || `Section ${sectionIndex + 1}`
                const isFirstSection = sectionIndex === 0
                const isLastSection = sectionIndex === sections.length - 1
                const hasCopied = copiedElements && copiedElements.length > 0
                const hasElements = sec.elements.length > 0
                const isRenaming = renamingSectionIndex === sectionIndex

                return (
                  <ContextMenu key={sec.key}>
                    <ContextMenuTrigger asChild>
                      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20">
                        <div className="flex items-center justify-between w-full p-3 hover:bg-blue-500/10 rounded-lg transition-colors">
                          {/* Clickable area for toggle */}
                          <div 
                            onClick={() => !isRenaming && toggleGroup(sec.key)}
                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && !isRenaming && toggleGroup(sec.key)}
                          >
                            <LayoutTemplate className="w-4 h-4 text-blue-500 shrink-0" />
                            {isRenaming ? (
                              <input
                                type="text"
                                autoFocus
                                defaultValue={sectionName}
                                className="bg-background border border-blue-400/50 rounded px-2 py-0.5 text-sm font-semibold text-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full max-w-[150px]"
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                  const newName = e.target.value.trim()
                                  onRenameSection?.(sectionIndex, newName)
                                  setRenamingSectionIndex(-1)
                                }}
                                onKeyDown={(e) => {
                                  e.stopPropagation()
                                  if (e.key === 'Enter') {
                                    const newName = e.currentTarget.value.trim()
                                    onRenameSection?.(sectionIndex, newName)
                                    setRenamingSectionIndex(-1)
                                  } else if (e.key === 'Escape') {
                                    setRenamingSectionIndex(-1)
                                  }
                                }}
                              />
                            ) : (
                              <span className="font-semibold text-blue-500 truncate">{sectionName}</span>
                            )}
                            <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                              {sec.elements.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            {/* Rename button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setRenamingSectionIndex(sectionIndex)
                              }}
                              className="p-1 rounded transition-all duration-200 group hover:bg-blue-500/20"
                              title="Rename section"
                            >
                              <Pencil className="w-3 h-3 text-muted-foreground group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                            </button>
                            {/* Copy elements button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onCopyElements?.(sectionIndex)
                              }}
                              disabled={!hasElements}
                              className={`p-1 rounded transition-all duration-200 group ${
                                !hasElements 
                                  ? 'opacity-30 cursor-not-allowed' 
                                  : 'hover:bg-blue-500/20'
                              }`}
                              title="Copy elements"
                            >
                              <Copy className="w-3 h-3 text-muted-foreground group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                            </button>
                            {/* Paste elements button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onPasteElements?.(sectionIndex)
                              }}
                              disabled={!hasCopied}
                              className={`p-1 rounded transition-all duration-200 group ${
                                !hasCopied 
                                  ? 'opacity-30 cursor-not-allowed' 
                                  : 'hover:bg-blue-500/20'
                              }`}
                              title={hasCopied ? `Paste elements (${copiedElements?.length})` : "No elements copied"}
                            >
                              <Clipboard className="w-3 h-3 text-muted-foreground group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                            </button>
                            {/* 3-dots menu for more actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded transition-all duration-200 group hover:bg-blue-500/20"
                                  title="More actions"
                                >
                                  <MoreVertical className="w-3 h-3 text-muted-foreground group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 z-[150]">
                                {/* Add Section */}
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>Add Section</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-40">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onAddSectionAbove?.(sectionIndex)
                                      }}
                                    >
                                      <ArrowUp className="mr-2 h-4 w-4" />
                                      <span>Add Above</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onAddSectionBelow?.(sectionIndex)
                                      }}
                                    >
                                      <ArrowDown className="mr-2 h-4 w-4" />
                                      <span>Add Below</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                
                                {/* Move Section */}
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger disabled={isFirstSection && isLastSection}>
                                    <MoveUp className="mr-2 h-4 w-4" />
                                    <span>Move Section</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-40">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onMoveSectionUp?.(sectionIndex)
                                      }}
                                      disabled={isFirstSection}
                                    >
                                      <ArrowUp className="mr-2 h-4 w-4" />
                                      <span>Move Up</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onMoveSectionDown?.(sectionIndex)
                                      }}
                                      disabled={isLastSection}
                                    >
                                      <ArrowDown className="mr-2 h-4 w-4" />
                                      <span>Move Down</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                
                                <DropdownMenuSeparator />
                                
                                {/* Delete Section */}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteSection?.(sectionIndex)
                                  }}
                                  disabled={sections.length <= 1}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Section</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {/* Toggle indicator */}
                            <div 
                              onClick={() => toggleGroup(sec.key)}
                              className="cursor-pointer p-1"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && toggleGroup(sec.key)}
                            >
                              {expandedGroups.has(sec.key) ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                        {expandedGroups.has(sec.key) && sec.elements.length > 0 && (
                          <div className="px-3 pb-3 space-y-1 ml-4 border-l-2 border-blue-500/30">
                            {sec.elements.map((element) => (
                              <LayerElementCard key={element.id} element={element} />
                            ))}
                          </div>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56">
                      {/* Rename Section */}
                      <ContextMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setRenamingSectionIndex(sectionIndex)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Rename Section</span>
                      </ContextMenuItem>
                      
                      <ContextMenuSeparator />
                      
                      {/* Add Section Submenu */}
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <Plus className="mr-2 h-4 w-4" />
                          <span>Add Section</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                          <ContextMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddSectionAbove?.(sectionIndex)
                            }}
                          >
                            <ArrowUp className="mr-2 h-4 w-4" />
                            <span>Add Above</span>
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddSectionBelow?.(sectionIndex)
                            }}
                          >
                            <ArrowDown className="mr-2 h-4 w-4" />
                            <span>Add Below</span>
                          </ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>

                      {/* Move Section Submenu */}
                      <ContextMenuSub>
                        <ContextMenuSubTrigger disabled={isFirstSection && isLastSection}>
                          <MoveUp className="mr-2 h-4 w-4" />
                          <span>Move Section</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                          <ContextMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onMoveSectionUp?.(sectionIndex)
                            }}
                            disabled={isFirstSection}
                          >
                            <ArrowUp className="mr-2 h-4 w-4" />
                            <span>Move Up</span>
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onMoveSectionDown?.(sectionIndex)
                            }}
                            disabled={isLastSection}
                          >
                            <ArrowDown className="mr-2 h-4 w-4" />
                            <span>Move Down</span>
                          </ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>

                      <ContextMenuSeparator />

                      {/* Copy Elements */}
                      <ContextMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onCopyElements?.(sectionIndex)
                        }}
                        disabled={!hasElements}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copy Element Design</span>
                      </ContextMenuItem>

                      {/* Paste Elements */}
                      <ContextMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onPasteElements?.(sectionIndex)
                        }}
                        disabled={!hasCopied}
                      >
                        <Clipboard className="mr-2 h-4 w-4" />
                        <span>Paste Elements</span>
                        {hasCopied && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            ({copiedElements?.length})
                          </span>
                        )}
                      </ContextMenuItem>

                      <ContextMenuSeparator />

                      {/* Delete Section */}
                      <ContextMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSection?.(sectionIndex)
                        }}
                        disabled={sections.length <= 1}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Section</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}

              {/* Footer Group - with distinct styling and icon */}
              <div className="bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                <button
                  onClick={() => toggleGroup("footer")}
                  className="flex items-center justify-between w-full p-3 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <PanelBottom className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-emerald-500">Footer</span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {grouped.footer.length}
                    </span>
                  </div>
                  {expandedGroups.has("footer") ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedGroups.has("footer") && grouped.footer.length > 0 && (
                  <div className="px-3 pb-3 space-y-1 ml-4 border-l-2 border-emerald-500/30">
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
