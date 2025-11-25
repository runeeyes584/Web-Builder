"use client"

import { useCollaboration } from "@/hooks/use-collaboration"
import type { Breakpoint } from "@/lib/builder-types"
import { useUser } from "@clerk/nextjs"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActiveUsers } from "./active-users"
import { BuilderCanvas as Canvas } from "./canvas"
import { CollaborativeCursor } from "./collaborative-cursor"

interface CollaborativeCanvasProps {
  projectId: string | null
  pageId?: string
  canEdit?: boolean
  elements: any[]
  selectedElements: string[]
  currentBreakpoint: Breakpoint
  onElementSelect: (id: string | string[], isMultiSelect?: boolean) => void
  onAddElement?: (element: any, position?: { x: number; y: number }) => void
  onUpdateElement?: (id: string, updates: any) => void
  onUpdateElementPosition?: (id: string, position: any) => void
  onDeleteElement?: (id: string) => void
  onDuplicateElement?: (id: string) => any
  onCollaborationReady?: (sendElementChange: (change: any) => void) => void
  onLayoutChangeReady?: (sendLayoutChange: (layout: any) => void) => void
  onLayoutUpdate?: (layout: { headerHeight: number; footerHeight: number; sections: { id: string; height: number }[] }) => void
  onSectionsChange?: (sections: { id: string; height: number }[], headerHeight: number, footerHeight: number) => void
  snapToGrid: (value: number, gridSize: number) => number
  snapSettings: { enabled: boolean; gridSize: number; snapToElements: boolean; snapDistance: number }
  zoom?: number
  showGrid?: boolean
  showSections?: boolean
  isPreviewMode?: boolean
  toggleCategoryRef?: any
  onRegionsChange?: any
  onShowLeftSidebar?: () => void
  onSetActiveLeftPanel?: (panel: 'components' | 'pages' | 'siteStyle') => void
  [key: string]: any
}

export function CollaborativeCanvas({
  projectId,
  pageId,
  canEdit = true,
  elements,
  selectedElements,
  currentBreakpoint,
  onElementSelect,
  onAddElement,
  onUpdateElement,
  onUpdateElementPosition,
  onDeleteElement,
  onDuplicateElement,
  onCollaborationReady,
  onLayoutChangeReady,
  onLayoutUpdate,
  onShowLeftSidebar,
  onSetActiveLeftPanel,
  ...canvasProps
}: CollaborativeCanvasProps) {
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Use refs for callbacks to prevent useEffect re-runs when parent recreates these functions
  const onAddElementRef = useRef(onAddElement)
  const onUpdateElementRef = useRef(onUpdateElement)
  const onUpdateElementPositionRef = useRef(onUpdateElementPosition)
  const onDeleteElementRef = useRef(onDeleteElement)

  // Update refs when callbacks change
  useEffect(() => {
    onAddElementRef.current = onAddElement
    onUpdateElementRef.current = onUpdateElement
    onUpdateElementPositionRef.current = onUpdateElementPosition
    onDeleteElementRef.current = onDeleteElement
  }, [onAddElement, onUpdateElement, onUpdateElementPosition, onDeleteElement])

  // Memoize username to prevent reconnections
  const username = useRef(user?.username || user?.emailAddresses[0]?.emailAddress || "Anonymous")

  // Update username ref only if it was "Anonymous" and now we have real data
  useEffect(() => {
    if (user && username.current === "Anonymous") {
      username.current = user.username || user.emailAddresses[0]?.emailAddress || "Anonymous"
    }
  }, [user])

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    activeUsers,
    elementChanges,
    layoutChanges,
    sendCursorPosition,
    sendElementChange,
    sendLayoutChange,
    clearElementChanges,
    clearLayoutChanges,
  } = useCollaboration({
    projectId,
    clerkId: user?.id || "",
    username: username.current,
    pageId,
    enabled: !!projectId && !!user,
  })

  // Expose sendElementChange to parent component
  useEffect(() => {
    if (onCollaborationReady) {
      onCollaborationReady(sendElementChange)
    }
  }, [sendElementChange, onCollaborationReady])

  // Expose sendLayoutChange to parent component
  useEffect(() => {
    if (onLayoutChangeReady) {
      onLayoutChangeReady(sendLayoutChange)
    }
  }, [sendLayoutChange, onLayoutChangeReady])

  // Apply element changes from other users
  useEffect(() => {
    if (elementChanges.length === 0) return

    elementChanges.forEach((change) => {
      // Skip changes from current user (already applied locally)
      if (change.userId === user?.id) {
        return
      }

      // Apply the change based on action type using refs
      switch (change.action) {
        case 'add':
          onAddElementRef.current?.(change.element)
          break
        case 'move':
          // For move action, use position update callback
          onUpdateElementPositionRef.current?.(change.element.id, {
            x: change.element.x,
            y: change.element.y,
            ...(change.element.width && { width: change.element.width }),
            ...(change.element.height && { height: change.element.height }),
          })
          break
        case 'update':
          onUpdateElementRef.current?.(change.element.id, change.element)
          break
        case 'delete':
          onDeleteElementRef.current?.(change.element.id)
          break
      }
    })

    // Clear processed changes
    clearElementChanges()
  }, [elementChanges, user?.id, clearElementChanges])

  // Apply layout changes from other users
  useEffect(() => {
    if (layoutChanges.length === 0) return

    layoutChanges.forEach((change) => {
      // Skip changes from current user (already applied locally)
      if (change.userId === user?.id) {
        return
      }

      // Apply the layout change
      onLayoutUpdate?.({
        headerHeight: change.headerHeight,
        footerHeight: change.footerHeight,
        sections: change.sections,
      })
    })

    // Clear processed layout changes
    clearLayoutChanges()
  }, [layoutChanges, user?.id, clearLayoutChanges, onLayoutUpdate])

  // Wrap canvas callbacks to broadcast changes
  const handleAddElement = useCallback((element: any, position?: { x: number; y: number }) => {
    if (!canEdit) return;

    // Apply locally first with position
    onAddElementRef.current?.(element, position)

    // Broadcast to others
    if (projectId) {
      sendElementChange({
        action: 'add',
        element,
      })
    }
  }, [canEdit, projectId, sendElementChange])

  const handleUpdateElement = useCallback((id: string, updates: any) => {
    if (!canEdit) return;

    // Apply locally first
    onUpdateElementRef.current?.(id, updates)

    // Broadcast to others
    if (projectId) {
      sendElementChange({
        action: 'update',
        element: { id, ...updates },
      })
    }
  }, [canEdit, projectId, sendElementChange])

  // Throttle function to limit broadcast frequency
  const throttleTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const lastBroadcastTime = useRef<Map<string, number>>(new Map())

  // Handle real-time drag movement (called on every mousemove during drag)
  const handleElementDragMove = useCallback((id: string, position: { x: number; y: number }) => {
    if (!canEdit || !projectId) return

    // Throttle: only broadcast max once per 50ms per element
    const now = Date.now()
    const lastTime = lastBroadcastTime.current.get(id) || 0

    if (now - lastTime < 50) {
      // Too soon, skip this update
      return
    }

    lastBroadcastTime.current.set(id, now)

    sendElementChange({
      action: 'move',
      element: { id, ...position },
    })
  }, [canEdit, projectId, sendElementChange])

  const handleUpdateElementPosition = useCallback((id: string, position: any) => {
    if (!canEdit) return;

    // Apply locally first (immediate UI update)
    onUpdateElementPositionRef.current?.(id, position)

    // Broadcast final position after drag ends
    if (projectId) {
      sendElementChange({
        action: 'move',
        element: { id, ...position },
      })

      // Clear throttle tracking
      lastBroadcastTime.current.delete(id)
    }
  }, [canEdit, projectId, sendElementChange])

  const handleDeleteElement = useCallback((id: string) => {
    if (!canEdit) return;

    // Find the element to be deleted
    const elementToDelete = elements.find(el => el.id === id)

    // List of IDs to delete (starting with the target element)
    const idsToDelete = [id]

    // If it's a section or card, find all elements inside it
    if ((elementToDelete?.type === 'section' || elementToDelete?.type === 'card') && elementToDelete.position) {
      const container = elementToDelete
      const children = elements.filter(el => {
        if (el.id === id) return false
        if (!el.position) return false

        // Check if element center is inside container
        const elCenterX = el.position.x + (el.position.width || 0) / 2
        const elCenterY = el.position.y + (el.position.height || 0) / 2

        return (
          elCenterX >= container.position!.x &&
          elCenterX <= container.position!.x + (container.position!.width || 0) &&
          elCenterY >= container.position!.y &&
          elCenterY <= container.position!.y + (container.position!.height || 0)
        )
      })

      children.forEach(child => idsToDelete.push(child.id))
    }

    // Delete all identified elements
    idsToDelete.forEach(deleteId => {
      // Apply locally first
      onDeleteElementRef.current?.(deleteId)

      // Broadcast to others
      if (projectId) {
        sendElementChange({
          action: 'delete',
          element: { id: deleteId },
        })
      }
    })
  }, [canEdit, projectId, sendElementChange, elements])

  const handleDuplicateElement = useCallback((id: string) => {
    if (!canEdit) return;

    // Apply locally first
    const newElement = onDuplicateElement?.(id)

    // Broadcast to others
    if (projectId && newElement) {
      sendElementChange({
        action: 'add',
        element: newElement,
      })
    }
  }, [canEdit, projectId, onDuplicateElement, sendElementChange])

  // Track mouse movement with throttling
  const lastCursorUpdate = useRef<number>(0)

  useEffect(() => {
    if (!projectId) return

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Throttle cursor updates to max 30 times per second (every ~33ms)
      const now = Date.now()
      if (now - lastCursorUpdate.current < 33) {
        return
      }
      lastCursorUpdate.current = now

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      sendCursorPosition(x, y, undefined, pageId)
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [projectId, pageId, sendCursorPosition])

  if (!mounted) {
    return null
  }

  return (
    <div className="relative w-full h-full" id="builder-canvas" ref={canvasRef}>
      {/* Active users display */}
      {projectId && activeUsers.length > 0 && (
        <div className="absolute top-4 right-4 z-50">
          <ActiveUsers
            users={activeUsers}
            currentUserClerkId={user?.id || ""}
          />
        </div>
      )}

      {/* Collaborative cursors - filter out current user and users on different pages */}
      <CollaborativeCursor
        users={activeUsers.filter(u => u.clerkId !== user?.id && u.pageId === pageId)}
        containerRef={canvasRef}
      />

      {/* Original canvas with collaborative callbacks */}
      <Canvas
        // Pass through all canvas props
        canEdit={canEdit}
        elements={elements}
        selectedElements={selectedElements}
        currentBreakpoint={currentBreakpoint}
        onElementSelect={onElementSelect}
        onAddElement={handleAddElement}
        onUpdateElement={handleUpdateElement}
        onUpdateElementPosition={handleUpdateElementPosition}
        onElementDragMove={handleElementDragMove}
        onDeleteElement={handleDeleteElement}
        onDuplicateElement={handleDuplicateElement}
        sendLayoutChange={sendLayoutChange}
        onShowLeftSidebar={onShowLeftSidebar}
        onSetActiveLeftPanel={onSetActiveLeftPanel}
        {...canvasProps}
      />
    </div>
  )
}
