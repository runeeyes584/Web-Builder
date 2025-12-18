"use client"

import React, { useCallback } from "react"
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
  Plus,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  MoveUp,
  MoveDown,
  Clipboard,
  Pencil,
} from "lucide-react"
import { BuilderElement } from "@/lib/builder-types"

interface SectionContextMenuProps {
  children: React.ReactNode
  sectionIndex: number
  sectionId: string
  sections: { id: string; height: number; name?: string }[]
  headerHeight: number
  elements: BuilderElement[]
  copiedElements: BuilderElement[] | null
  onAddSectionAbove: (index: number) => void
  onAddSectionBelow: (index: number) => void
  onMoveSectionUp: (index: number) => void
  onMoveSectionDown: (index: number) => void
  onCopyElements: (sectionIndex: number) => void
  onPasteElements: (sectionIndex: number) => void
  onDeleteSection: (index: number) => void
  onRenameSection?: (index: number) => void
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SectionContextMenu({
  children,
  sectionIndex,
  sectionId,
  sections,
  headerHeight,
  elements,
  copiedElements,
  onAddSectionAbove,
  onAddSectionBelow,
  onMoveSectionUp,
  onMoveSectionDown,
  onCopyElements,
  onPasteElements,
  onDeleteSection,
  onRenameSection,
  disabled = false,
  onOpenChange,
}: SectionContextMenuProps) {
  // Check if this section has elements
  const sectionHasElements = useCallback(() => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) return false

    // Calculate section bounds
    let sectionTop = headerHeight
    for (let i = 0; i < sectionIndex; i++) {
      sectionTop += sections[i]?.height || 0
    }
    const sectionBottom = sectionTop + (sections[sectionIndex]?.height || 0)

    // Check if any element exists within this section's boundaries
    return elements.some(element => {
      if (!element.position) return false
      const elemY = element.position.y
      return elemY >= sectionTop && elemY < sectionBottom
    })
  }, [elements, sections, headerHeight, sectionIndex])

  const isFirstSection = sectionIndex === 0
  const isLastSection = sectionIndex === sections.length - 1
  const hasCopiedElements = copiedElements && copiedElements.length > 0
  const hasElements = sectionHasElements()

  if (disabled) {
    return <>{children}</>
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        onOpenChange?.(open)
      }}
    >
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
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
                onAddSectionAbove(sectionIndex)
              }}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              <span>Add Above</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onAddSectionBelow(sectionIndex)
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
                onMoveSectionUp(sectionIndex)
              }}
              disabled={isFirstSection}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              <span>Move Up</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onMoveSectionDown(sectionIndex)
              }}
              disabled={isLastSection}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              <span>Move Down</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Rename Section */}
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onRenameSection?.(sectionIndex)
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename Section</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Copy Elements */}
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onCopyElements(sectionIndex)
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
            onPasteElements(sectionIndex)
          }}
          disabled={!hasCopiedElements}
        >
          <Clipboard className="mr-2 h-4 w-4" />
          <span>Paste Elements</span>
          {hasCopiedElements && (
            <span className="ml-auto text-xs text-muted-foreground">
              ({copiedElements.length})
            </span>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Delete Section */}
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onDeleteSection(sectionIndex)
          }}
          variant="destructive"
          disabled={sections.length <= 1}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Section</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

// Hook for section management operations
export function useSectionActions({
  sections,
  setSections,
  headerHeight,
  elements,
  onAddElement,
  onDeleteElement,
  onUpdateElementPosition,
  defaultSectionHeight,
  onSectionsChange,
  onBeforeSectionAdd,
}: {
  sections: { id: string; height: number; name?: string }[]
  setSections: React.Dispatch<React.SetStateAction<{ id: string; height: number; name?: string }[]>>
  headerHeight: number
  elements: BuilderElement[]
  onAddElement?: (element: BuilderElement, position?: { x: number; y: number }) => void
  onDeleteElement?: (id: string) => void
  onUpdateElementPosition?: (id: string, position: { x: number; y: number; width?: number; height?: number }) => void
  defaultSectionHeight: number
  onSectionsChange?: (sections: { id: string; height: number; name?: string }[], headerHeight: number, footerHeight: number) => void
  // Callback to notify parent before section is added (for shifting elements)
  onBeforeSectionAdd?: (insertIndex: number) => void
}) {
  // State to store copied elements
  const [copiedElements, setCopiedElements] = React.useState<BuilderElement[] | null>(null)
  // Store the original section's top position for relative positioning during paste
  const [copiedSectionTop, setCopiedSectionTop] = React.useState<number>(0)
  // State to track which section is being renamed (-1 means none)
  const [renamingSectionIndex, setRenamingSectionIndex] = React.useState<number>(-1)

  // Helper to get elements in a specific section
  const getElementsInSection = useCallback((sectionIndex: number): BuilderElement[] => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) return []

    let sectionTop = headerHeight
    for (let i = 0; i < sectionIndex; i++) {
      sectionTop += sections[i]?.height || 0
    }
    const sectionBottom = sectionTop + (sections[sectionIndex]?.height || 0)

    return elements.filter(element => {
      if (!element.position) return false
      const elemY = element.position.y
      return elemY >= sectionTop && elemY < sectionBottom
    })
  }, [elements, sections, headerHeight])

  // Add section above
  const addSectionAbove = useCallback((index: number) => {
    const newSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      height: defaultSectionHeight,
    }

    // Notify parent to shift elements BEFORE adding section
    // This sets the flag to skip percentage-based position adjustment in canvas effect
    onBeforeSectionAdd?.(index)

    setSections(prev => {
      const next = [...prev]
      next.splice(index, 0, newSection)
      return next
    })
  }, [defaultSectionHeight, setSections, onBeforeSectionAdd])

  // Add section below
  const addSectionBelow = useCallback((index: number) => {
    const newSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      height: defaultSectionHeight,
    }

    // Insert index is after the current section
    const insertIndex = index + 1

    // Notify parent to shift elements BEFORE adding section
    onBeforeSectionAdd?.(insertIndex)

    setSections(prev => {
      const next = [...prev]
      next.splice(insertIndex, 0, newSection)
      return next
    })
  }, [defaultSectionHeight, setSections, onBeforeSectionAdd])

  // Move section up - removes section from current position and inserts it above
  // This moves the entire partition (area name, color, and all elements) as a unit
  const moveSectionUp = useCallback((index: number) => {
    if (index <= 0) return

    // Get section heights for position calculations
    const currentSectionHeight = sections[index].height
    const prevSectionHeight = sections[index - 1].height
    
    // Calculate section tops before the move
    const prevSectionTop = headerHeight + sections.slice(0, index - 1).reduce((sum, s) => sum + s.height, 0)
    const currentSectionTop = prevSectionTop + prevSectionHeight

    // Get elements in both sections
    const elementsInCurrent = getElementsInSection(index)
    const elementsInPrev = getElementsInSection(index - 1)

    // Move current section's elements up by the height of the previous section
    elementsInCurrent.forEach(element => {
      if (!element.position) return
      onUpdateElementPosition?.(element.id, {
        x: element.position.x,
        y: element.position.y - prevSectionHeight,
        width: element.position.width,
        height: element.position.height,
      })
    })

    // Move previous section's elements down by the height of the current section
    elementsInPrev.forEach(element => {
      if (!element.position) return
      onUpdateElementPosition?.(element.id, {
        x: element.position.x,
        y: element.position.y + currentSectionHeight,
        width: element.position.width,
        height: element.position.height,
      })
    })

    // Reorder sections array - remove from current position and insert above
    setSections(prev => {
      const next = [...prev]
      const [movedSection] = next.splice(index, 1)
      next.splice(index - 1, 0, movedSection)
      return next
    })
  }, [sections, headerHeight, getElementsInSection, setSections, onUpdateElementPosition])

  // Move section down - removes section from current position and inserts it below
  // This moves the entire partition (area name, color, and all elements) as a unit
  const moveSectionDown = useCallback((index: number) => {
    if (index >= sections.length - 1) return

    // Get section heights for position calculations
    const currentSectionHeight = sections[index].height
    const nextSectionHeight = sections[index + 1].height
    
    // Calculate section tops before the move
    const currentSectionTop = headerHeight + sections.slice(0, index).reduce((sum, s) => sum + s.height, 0)

    // Get elements in both sections
    const elementsInCurrent = getElementsInSection(index)
    const elementsInNext = getElementsInSection(index + 1)

    // Move current section's elements down by the height of the next section
    elementsInCurrent.forEach(element => {
      if (!element.position) return
      onUpdateElementPosition?.(element.id, {
        x: element.position.x,
        y: element.position.y + nextSectionHeight,
        width: element.position.width,
        height: element.position.height,
      })
    })

    // Move next section's elements up by the height of the current section
    elementsInNext.forEach(element => {
      if (!element.position) return
      onUpdateElementPosition?.(element.id, {
        x: element.position.x,
        y: element.position.y - currentSectionHeight,
        width: element.position.width,
        height: element.position.height,
      })
    })

    // Reorder sections array - remove from current position and insert below
    setSections(prev => {
      const next = [...prev]
      const [movedSection] = next.splice(index, 1)
      next.splice(index + 1, 0, movedSection) // Insert after the next section (which is now at index)
      return next
    })
  }, [sections, headerHeight, getElementsInSection, setSections, onUpdateElementPosition])

  // Copy elements from section
  const copyElements = useCallback((sectionIndex: number) => {
    const elementsInSection = getElementsInSection(sectionIndex)
    if (elementsInSection.length === 0) return

    // Calculate section top for relative positioning
    let sectionTop = headerHeight
    for (let i = 0; i < sectionIndex; i++) {
      sectionTop += sections[i]?.height || 0
    }

    // Deep copy elements and store relative positions
    const copiedEls = elementsInSection.map(el => ({
      ...JSON.parse(JSON.stringify(el)),
      // Store relative Y position within the section
      _relativeY: el.position ? el.position.y - sectionTop : 0,
    }))

    setCopiedElements(copiedEls)
    setCopiedSectionTop(sectionTop)
  }, [getElementsInSection, headerHeight, sections])

  // Paste elements to section
  const pasteElements = useCallback((targetSectionIndex: number) => {
    if (!copiedElements || copiedElements.length === 0) return
    if (!onAddElement) return

    // Calculate target section top
    let targetSectionTop = headerHeight
    for (let i = 0; i < targetSectionIndex; i++) {
      targetSectionTop += sections[i]?.height || 0
    }

    // Create new elements with new IDs and adjusted positions
    copiedElements.forEach((originalEl) => {
      const relativeY = (originalEl as any)._relativeY || 0
      
      // Create new element with new ID
      const newElement: BuilderElement = {
        ...originalEl,
        id: `${originalEl.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        position: originalEl.position ? {
          ...originalEl.position,
          x: originalEl.position.x + 20, // Slight offset to show it's a new element
          y: targetSectionTop + relativeY,
        } : undefined,
      }

      // Remove the temporary relative position property
      delete (newElement as any)._relativeY

      onAddElement(newElement)
    })
  }, [copiedElements, headerHeight, sections, onAddElement])

  // Delete section and its elements
  const deleteSection = useCallback((index: number) => {
    if (sections.length <= 1) return // Keep at least one section

    // Get all elements in this section and delete them
    const elementsInSection = getElementsInSection(index)
    elementsInSection.forEach(element => {
      onDeleteElement?.(element.id)
    })

    // Calculate the height of the deleted section for shifting elements
    const deletedSectionHeight = sections[index].height
    const deletedSectionTop = headerHeight + sections.slice(0, index).reduce((sum, s) => sum + s.height, 0)

    // Remove the section
    setSections(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })

    // Shift all elements in sections after this index up
    elements.forEach(element => {
      if (!element.position) return
      if (element.position.y >= deletedSectionTop + deletedSectionHeight) {
        onUpdateElementPosition?.(element.id, {
          x: element.position.x,
          y: element.position.y - deletedSectionHeight,
          width: element.position.width,
          height: element.position.height,
        })
      }
    })
  }, [sections, headerHeight, elements, getElementsInSection, onDeleteElement, setSections, onUpdateElementPosition])

  // Start renaming a section
  const startRenameSection = useCallback((index: number) => {
    setRenamingSectionIndex(index)
  }, [])

  // Cancel renaming
  const cancelRenameSection = useCallback(() => {
    setRenamingSectionIndex(-1)
  }, [])

  // Confirm rename with new name
  const confirmRenameSection = useCallback((index: number, newName: string) => {
    setSections(prev => {
      const next = [...prev]
      if (next[index]) {
        next[index] = { ...next[index], name: newName.trim() || undefined }
      }
      return next
    })
    setRenamingSectionIndex(-1)
  }, [setSections])

  // Get section display name
  const getSectionName = useCallback((index: number) => {
    const section = sections[index]
    return section?.name || `Section ${index + 1}`
  }, [sections])

  return {
    copiedElements,
    addSectionAbove,
    addSectionBelow,
    moveSectionUp,
    moveSectionDown,
    copyElements,
    pasteElements,
    deleteSection,
    // Rename related
    renamingSectionIndex,
    startRenameSection,
    cancelRenameSection,
    confirmRenameSection,
    getSectionName,
  }
}
