"use client"

import React, { useCallback, useState, useEffect, useRef } from "react"
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
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Type,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { BuilderElement } from "@/lib/builder-types"

interface ElementContextMenuProps {
  children: React.ReactNode
  element: BuilderElement
  elements: BuilderElement[]
  selectedElements: string[]
  onElementSelect: (elementId: string, multiSelect?: boolean) => void
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  regions?: {
    header: { top: number; height: number }
    sections: { id: string; index: number; top: number; height: number }[]
    footer: { top: number; height: number }
  }
  disabled?: boolean
  contextMenuOpenRef?: React.MutableRefObject<boolean>
}

export function ElementContextMenu({
  children,
  element,
  elements,
  selectedElements,
  onElementSelect,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  regions,
  disabled = false,
  contextMenuOpenRef,
}: ElementContextMenuProps) {
  const [scrollIndicators, setScrollIndicators] = useState<{
    showTop: boolean
    showBottom: boolean
  }>({ showTop: false, showBottom: false })
  const contentRef = useRef<HTMLDivElement>(null)

  // Callback ref to check scroll position when element is mounted and combine with contentRef
  const setContentRef = useCallback((node: HTMLDivElement | null) => {
    // @ts-ignore - We need to set the ref for both callback and useRef
    contentRef.current = node
    if (node) {
      // Initial check
      const { scrollTop, scrollHeight, clientHeight } = node
      setScrollIndicators({
        showTop: scrollTop > 10,
        showBottom: scrollTop + clientHeight < scrollHeight - 10,
      })
    }
  }, [])

  // Helper function to get element's region and section
  const getElementRegion = useCallback((element: BuilderElement) => {
    if (!regions) return null
    const y = element.position?.y ?? 0
    const inRange = (y: number, top: number, height: number) => y >= top && y < top + height
    
    if (inRange(y, regions.header.top, regions.header.height)) {
      return { type: 'header' as const, region: regions.header }
    }
    for (let i = 0; i < regions.sections.length; i++) {
      const section = regions.sections[i]
      if (inRange(y, section.top, section.height)) {
        return { type: 'section' as const, region: section, sectionIndex: i }
      }
    }
    if (inRange(y, regions.footer.top, regions.footer.height)) {
      return { type: 'footer' as const, region: regions.footer }
    }
    return null
  }, [regions])

  // Get elements in the same region sorted by Y position (layer order)
  const getElementsInSameRegion = useCallback((element: BuilderElement) => {
    const elementRegion = getElementRegion(element)
    if (!elementRegion) return []

    return elements
      .filter(el => {
        const elRegion = getElementRegion(el)
        if (!elRegion) return false
        if (elementRegion.type !== elRegion.type) return false
        if (elementRegion.type === 'section' && elRegion.type === 'section') {
          return elementRegion.sectionIndex === elRegion.sectionIndex
        }
        return true
      })
      .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))
  }, [elements, getElementRegion])

  // Toggle visibility
  const toggleElementVisibility = useCallback(() => {
    const isHidden = element.styles.display === "none"
    onUpdateElement(element.id, {
      styles: {
        ...element.styles,
        display: isHidden ? "block" : "none",
      }
    })
  }, [element, onUpdateElement])

  // Toggle lock
  const toggleElementLock = useCallback(() => {
    const isLocked = element.props?.locked || false
    onUpdateElement(element.id, {
      props: {
        ...element.props,
        locked: !isLocked,
      }
    })
  }, [element, onUpdateElement])

  // Arrange functions - Using z-index for proper layering
  const moveElementForward = useCallback(() => {
    if (!element.position) return

    const sameRegionElements = getElementsInSameRegion(element)
    const currentZIndex = element.props?.zIndex ?? 0
    
    // Find elements with higher z-index
    const elementsAbove = sameRegionElements.filter(el => (el.props?.zIndex ?? 0) > currentZIndex)
    
    if (elementsAbove.length > 0) {
      // Sort by z-index to find the next immediate layer
      const sortedAbove = elementsAbove.sort((a, b) => (a.props?.zIndex ?? 0) - (b.props?.zIndex ?? 0))
      const nextElement = sortedAbove[0]
      const nextZIndex = nextElement.props?.zIndex ?? 0
      
      // Swap z-index with the next element
      onUpdateElement(element.id, {
        props: { ...element.props, zIndex: nextZIndex }
      })
      onUpdateElement(nextElement.id, {
        props: { ...nextElement.props, zIndex: currentZIndex }
      })
    }
  }, [element, getElementsInSameRegion, onUpdateElement])

  const moveElementBackward = useCallback(() => {
    if (!element.position) return

    const sameRegionElements = getElementsInSameRegion(element)
    const currentZIndex = element.props?.zIndex ?? 0
    
    // Find elements with lower z-index
    const elementsBelow = sameRegionElements.filter(el => (el.props?.zIndex ?? 0) < currentZIndex)
    
    if (elementsBelow.length > 0) {
      // Sort by z-index descending to find the next immediate layer below
      const sortedBelow = elementsBelow.sort((a, b) => (b.props?.zIndex ?? 0) - (a.props?.zIndex ?? 0))
      const prevElement = sortedBelow[0]
      const prevZIndex = prevElement.props?.zIndex ?? 0
      
      // Swap z-index with the previous element
      onUpdateElement(element.id, {
        props: { ...element.props, zIndex: prevZIndex }
      })
      onUpdateElement(prevElement.id, {
        props: { ...prevElement.props, zIndex: currentZIndex }
      })
    }
  }, [element, getElementsInSameRegion, onUpdateElement])

  const bringToFront = useCallback(() => {
    if (!element.position) return

    const sameRegionElements = getElementsInSameRegion(element)
    if (sameRegionElements.length === 0) return
    
    // Find the maximum z-index in the region
    const maxZIndex = Math.max(...sameRegionElements.map(el => el.props?.zIndex ?? 0), 0)
    const currentZIndex = element.props?.zIndex ?? 0
    
    // Only update if not already at front
    if (currentZIndex < maxZIndex) {
      onUpdateElement(element.id, {
        props: { ...element.props, zIndex: maxZIndex + 1 }
      })
    }
  }, [element, getElementsInSameRegion, onUpdateElement])

  const sendToBack = useCallback(() => {
    if (!element.position) return

    const sameRegionElements = getElementsInSameRegion(element)
    if (sameRegionElements.length === 0) return
    
    // Find the minimum z-index in the region
    const minZIndex = Math.min(...sameRegionElements.map(el => el.props?.zIndex ?? 0), 0)
    const currentZIndex = element.props?.zIndex ?? 0
    
    // Only update if not already at back
    if (currentZIndex > minZIndex) {
      onUpdateElement(element.id, {
        props: { ...element.props, zIndex: minZIndex - 1 }
      })
    }
  }, [element, getElementsInSameRegion, onUpdateElement])

  // Align functions
  const alignElement = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!element.position) return

    const elementRegion = getElementRegion(element)
    if (!elementRegion) return

    const region = elementRegion.region
    const elementWidth = element.position.width ?? 200
    const elementHeight = element.position.height ?? 100
    
    // Determine current usable canvas width dynamically instead of fixed 1200
    const canvasEl = document.getElementById('builder-canvas') as HTMLElement | null
    const canvasWidth = canvasEl?.clientWidth ?? 1200
    
    let newX = element.position.x
    let newY = element.position.y

    switch (alignment) {
      case 'left':
        newX = 0
        break
      case 'center':
        newX = (canvasWidth - elementWidth) / 2
        break
      case 'right':
        newX = canvasWidth - elementWidth
        break
      case 'top':
        newY = region.top
        break
      case 'middle':
        newY = region.top + (region.height - elementHeight) / 2
        break
      case 'bottom':
        newY = region.top + region.height - elementHeight
        break
    }

    onUpdateElement(element.id, {
      position: { ...element.position, x: newX, y: newY }
    })
  }, [element, getElementRegion, onUpdateElement])

  // Rotate function - Store rotation in props for proper frame rotation
  const rotateElement = useCallback((degrees: number) => {
    const currentRotation = element.props?.rotation ?? 0
    const newRotation = ((currentRotation + degrees) % 360 + 360) % 360 // Normalize to 0-359

    onUpdateElement(element.id, {
      props: {
        ...element.props,
        rotation: newRotation,
      }
    })
  }, [element, onUpdateElement])

  // Check scroll position for indicators
  const checkScrollPosition = useCallback(() => {
    const content = contentRef.current
    if (!content) return

    const { scrollTop, scrollHeight, clientHeight } = content
    setScrollIndicators({
      showTop: scrollTop > 10,
      showBottom: scrollTop + clientHeight < scrollHeight - 10,
    })
  }, [])

  // Scroll handlers
  const scrollUp = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: -100, behavior: 'smooth' })
    }
  }, [])

  const scrollDown = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: 100, behavior: 'smooth' })
    }
  }, [])

  const isHidden = element.styles.display === "none"
  const isLocked = element.props?.locked || false
  
  // Check if this element is part of a multi-selection
  const isMultiSelection = selectedElements.length > 1 && selectedElements.includes(element.id)
  const selectionCount = isMultiSelection ? selectedElements.length : 1

  if (disabled) {
    return <>{children}</>
  }

  // Handler for deleting selected elements (single or multiple)
  const handleDelete = () => {
    if (isMultiSelection) {
      // Delete all selected elements
      selectedElements.forEach(id => onDeleteElement(id))
    } else {
      onDeleteElement(element.id)
    }
  }

  // Handler for duplicating selected elements (single or multiple)
  const handleDuplicate = () => {
    if (isMultiSelection) {
      // Duplicate all selected elements
      selectedElements.forEach(id => onDuplicateElement(id))
    } else {
      onDuplicateElement(element.id)
    }
  }

  // Handler for hiding/showing selected elements
  const handleToggleVisibility = () => {
    if (isMultiSelection) {
      selectedElements.forEach(id => {
        const el = elements.find(e => e.id === id)
        if (el) {
          const isElHidden = el.styles.display === "none"
          onUpdateElement(id, {
            styles: {
              ...el.styles,
              display: isElHidden ? "block" : "none",
            }
          })
        }
      })
    } else {
      toggleElementVisibility()
    }
  }

  // Handler for locking/unlocking selected elements
  const handleToggleLock = () => {
    if (isMultiSelection) {
      selectedElements.forEach(id => {
        const el = elements.find(e => e.id === id)
        if (el) {
          const isElLocked = el.props?.locked || false
          onUpdateElement(id, {
            props: {
              ...el.props,
              locked: !isElLocked,
            }
          })
        }
      })
    } else {
      toggleElementLock()
    }
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (open) {
          // Select element when context menu opens
          if (!selectedElements.includes(element.id)) {
            onElementSelect(element.id)
          }
          // Mark that context menu is open
          if (contextMenuOpenRef) {
            contextMenuOpenRef.current = true
          }
        } else {
          // Mark that context menu is closing
          if (contextMenuOpenRef) {
            contextMenuOpenRef.current = true
          }
        }
      }}
    >
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent 
        className="w-56 max-h-[400px] overflow-hidden overflow-x-hidden relative z-[200]"
      >
        {/* Scroll Button - Top */}
        {scrollIndicators.showTop && (
          <button 
            className="sticky top-0 z-10 w-full flex items-center justify-center bg-gradient-to-b from-popover to-transparent h-8 hover:bg-accent/50 transition-colors"
            onClick={scrollUp}
          >
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Scrollable Content */}
        <div
          ref={setContentRef}
          className="max-h-[336px] overflow-y-auto overflow-x-hidden"
          onScroll={checkScrollPosition}
        >
          {/* Multi-selection header */}
          {isMultiSelection && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 rounded-sm mx-1 mb-1">
                {selectionCount} Elements Selected
              </div>
              <ContextMenuSeparator />
            </>
          )}
          
          {/* Arrange Submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Layers className="w-4 h-4 mr-2" />
              Arrange
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 z-[250]">
              <ContextMenuItem onClick={bringToFront}>
                <ArrowUp className="w-4 h-4 mr-2" />
                Bring to Front
              </ContextMenuItem>
              <ContextMenuItem onClick={moveElementForward}>
                <ArrowUp className="w-4 h-4 mr-2" />
                Move Forward
              </ContextMenuItem>
              <ContextMenuItem onClick={moveElementBackward}>
                <ArrowDown className="w-4 h-4 mr-2" />
                Move Backward
              </ContextMenuItem>
              <ContextMenuItem onClick={sendToBack}>
                <ArrowDown className="w-4 h-4 mr-2" />
                Send to Back
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Align To Submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <AlignCenter className="w-4 h-4 mr-2" />
              Align To
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 z-[250]">
              <ContextMenuItem onClick={() => alignElement('left')}>
                <AlignLeft className="w-4 h-4 mr-2" />
                Align Left
              </ContextMenuItem>
              <ContextMenuItem onClick={() => alignElement('center')}>
                <AlignCenter className="w-4 h-4 mr-2" />
                Align Center
              </ContextMenuItem>
              <ContextMenuItem onClick={() => alignElement('right')}>
                <AlignRight className="w-4 h-4 mr-2" />
                Align Right
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => alignElement('top')}>
                <AlignHorizontalJustifyStart className="w-4 h-4 mr-2" />
                Align Top
              </ContextMenuItem>
              <ContextMenuItem onClick={() => alignElement('middle')}>
                <AlignVerticalJustifyCenter className="w-4 h-4 mr-2" />
                Align Middle
              </ContextMenuItem>
              <ContextMenuItem onClick={() => alignElement('bottom')}>
                <AlignHorizontalJustifyEnd className="w-4 h-4 mr-2" />
                Align Bottom
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Rotate Submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <RotateCw className="w-4 h-4 mr-2" />
              Rotate
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 z-[250]">
              <ContextMenuItem onClick={() => rotateElement(90)}>
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate +90° 
              </ContextMenuItem>
              <ContextMenuItem onClick={() => rotateElement(-90)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rotate 90° 
              </ContextMenuItem>
              <ContextMenuItem onClick={() => rotateElement(45)}>
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate +45° 
              </ContextMenuItem>
              <ContextMenuItem onClick={() => rotateElement(-45)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rotate -45° 
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          {/* Visibility Toggle */}
          <ContextMenuItem onClick={handleToggleVisibility}>
            {isHidden ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                {isMultiSelection ? `Show ${selectionCount} Elements` : "Show"}
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                {isMultiSelection ? `Hide ${selectionCount} Elements` : "Hide"}
              </>
            )}
          </ContextMenuItem>

          {/* Lock Toggle */}
          <ContextMenuItem onClick={handleToggleLock}>
            {isLocked ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                {isMultiSelection ? `Unlock ${selectionCount} Elements` : "Unlock"}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                {isMultiSelection ? `Lock ${selectionCount} Elements` : "Lock"}
              </>
            )}
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Duplicate */}
          <ContextMenuItem onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            {isMultiSelection ? `Duplicate ${selectionCount} Elements` : "Duplicate"}
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Delete */}
          <ContextMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isMultiSelection ? `Delete ${selectionCount} Elements` : "Delete"}
          </ContextMenuItem>
        </div>

        {/* Scroll Button - Bottom */}
        {scrollIndicators.showBottom && (
          <button 
            className="sticky bottom-0 z-10 w-full flex items-center justify-center bg-gradient-to-t from-popover to-transparent h-8 hover:bg-accent/50 transition-colors"
            onClick={scrollDown}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

// Export shared menu action handlers for use in layers panel
export function useElementActions(
  elements: BuilderElement[],
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void,
  regions?: {
    header: { top: number; height: number }
    sections: { id: string; index: number; top: number; height: number }[]
    footer: { top: number; height: number }
  }
) {
  const getElementRegion = useCallback((element: BuilderElement) => {
    if (!regions) return null
    const y = element.position?.y ?? 0
    const inRange = (y: number, top: number, height: number) => y >= top && y < top + height
    
    if (inRange(y, regions.header.top, regions.header.height)) {
      return { type: 'header' as const, region: regions.header }
    }
    for (let i = 0; i < regions.sections.length; i++) {
      const section = regions.sections[i]
      if (inRange(y, section.top, section.height)) {
        return { type: 'section' as const, region: section, sectionIndex: i }
      }
    }
    if (inRange(y, regions.footer.top, regions.footer.height)) {
      return { type: 'footer' as const, region: regions.footer }
    }
    return null
  }, [regions])

  const getElementsInSameRegion = useCallback((element: BuilderElement) => {
    const elementRegion = getElementRegion(element)
    if (!elementRegion) return []

    return elements
      .filter(el => {
        const elRegion = getElementRegion(el)
        if (!elRegion) return false
        if (elementRegion.type !== elRegion.type) return false
        if (elementRegion.type === 'section' && elRegion.type === 'section') {
          return elementRegion.sectionIndex === elRegion.sectionIndex
        }
        return true
      })
      .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))
  }, [elements, getElementRegion])

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

  const moveElementForward = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (!element || !element.position) return

    const sameRegionElements = getElementsInSameRegion(element)
    const currentZIndex = element.props?.zIndex ?? 0
    
    // Find elements with higher z-index
    const elementsAbove = sameRegionElements.filter(el => (el.props?.zIndex ?? 0) > currentZIndex)
    
    if (elementsAbove.length > 0) {
      // Sort by z-index to find the next immediate layer
      const sortedAbove = elementsAbove.sort((a, b) => (a.props?.zIndex ?? 0) - (b.props?.zIndex ?? 0))
      const nextElement = sortedAbove[0]
      const nextZIndex = nextElement.props?.zIndex ?? 0
      
      // Swap z-index with the next element
      onUpdateElement(elementId, {
        props: { ...element.props, zIndex: nextZIndex }
      })
      onUpdateElement(nextElement.id, {
        props: { ...nextElement.props, zIndex: currentZIndex }
      })
    }
  }, [elements, getElementsInSameRegion, onUpdateElement])

  const moveElementBackward = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (!element || !element.position) return

    const sameRegionElements = getElementsInSameRegion(element)
    const currentZIndex = element.props?.zIndex ?? 0
    
    // Find elements with lower z-index
    const elementsBelow = sameRegionElements.filter(el => (el.props?.zIndex ?? 0) < currentZIndex)
    
    if (elementsBelow.length > 0) {
      // Sort by z-index descending to find the next immediate layer below
      const sortedBelow = elementsBelow.sort((a, b) => (b.props?.zIndex ?? 0) - (a.props?.zIndex ?? 0))
      const prevElement = sortedBelow[0]
      const prevZIndex = prevElement.props?.zIndex ?? 0
      
      // Swap z-index with the previous element
      onUpdateElement(elementId, {
        props: { ...element.props, zIndex: prevZIndex }
      })
      onUpdateElement(prevElement.id, {
        props: { ...prevElement.props, zIndex: currentZIndex }
      })
    }
  }, [elements, getElementsInSameRegion, onUpdateElement])

  const bringToFront = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (!element || !element.position) return

    const sameRegionElements = getElementsInSameRegion(element)
    if (sameRegionElements.length === 0) return
    
    // Find the maximum z-index in the region
    const maxZIndex = Math.max(...sameRegionElements.map(el => el.props?.zIndex ?? 0), 0)
    const currentZIndex = element.props?.zIndex ?? 0
    
    // Only update if not already at front
    if (currentZIndex < maxZIndex) {
      onUpdateElement(elementId, {
        props: { ...element.props, zIndex: maxZIndex + 1 }
      })
    }
  }, [elements, getElementsInSameRegion, onUpdateElement])

  const sendToBack = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (!element || !element.position) return

    const sameRegionElements = getElementsInSameRegion(element)
    if (sameRegionElements.length === 0) return
    
    // Find the minimum z-index in the region
    const minZIndex = Math.min(...sameRegionElements.map(el => el.props?.zIndex ?? 0), 0)
    const currentZIndex = element.props?.zIndex ?? 0
    
    // Only update if not already at back
    if (currentZIndex > minZIndex) {
      onUpdateElement(elementId, {
        props: { ...element.props, zIndex: minZIndex - 1 }
      })
    }
  }, [elements, getElementsInSameRegion, onUpdateElement])

  const alignElement = useCallback((elementId: string, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const element = elements.find(el => el.id === elementId)
    if (!element || !element.position) return

    const elementRegion = getElementRegion(element)
    if (!elementRegion) return

    const region = elementRegion.region
    const elementWidth = element.position.width ?? 200
    const elementHeight = element.position.height ?? 100
    
    // Dynamic canvas width detection (fallback to 1200 if not mounted yet)
    const canvasEl = document.getElementById('builder-canvas') as HTMLElement | null
    const canvasWidth = canvasEl?.clientWidth ?? 1200
    
    let newX = element.position.x
    let newY = element.position.y

    switch (alignment) {
      case 'left':
        newX = 0
        break
      case 'center':
        newX = (canvasWidth - elementWidth) / 2
        break
      case 'right':
        newX = canvasWidth - elementWidth
        break
      case 'top':
        newY = region.top
        break
      case 'middle':
        newY = region.top + (region.height - elementHeight) / 2
        break
      case 'bottom':
        newY = region.top + region.height - elementHeight
        break
    }

    onUpdateElement(elementId, {
      position: { ...element.position, x: newX, y: newY }
    })
  }, [elements, getElementRegion, onUpdateElement])

  const rotateElement = useCallback((elementId: string, degrees: number) => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    const currentRotation = element.props?.rotation ?? 0
    const newRotation = ((currentRotation + degrees) % 360 + 360) % 360 // Normalize to 0-359

    onUpdateElement(elementId, {
      props: {
        ...element.props,
        rotation: newRotation,
      }
    })
  }, [elements, onUpdateElement])

  return {
    toggleElementVisibility,
    toggleElementLock,
    moveElementForward,
    moveElementBackward,
    bringToFront,
    sendToBack,
    alignElement,
    rotateElement,
  }
}
