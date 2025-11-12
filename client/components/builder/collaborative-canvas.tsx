"use client"

import { useCollaboration } from "@/hooks/use-collaboration"
import type { Breakpoint } from "@/lib/builder-types"
import { useUser } from "@clerk/nextjs"
import { useEffect, useRef, useState } from "react"
import { ActiveUsers } from "./active-users"
import { Canvas } from "./canvas"
import { CollaborativeCursor } from "./collaborative-cursor"

interface CollaborativeCanvasProps {
  projectId: string | null
  elements: any[]
  selectedElements: string[]
  currentBreakpoint: Breakpoint
  onElementSelect: (id: string, isMultiSelect?: boolean) => void
  onAddElement?: (element: any) => void
  onUpdateElement?: (id: string, updates: any) => void
  onUpdateElementPosition?: (id: string, position: any) => void
  onDeleteElement?: (id: string) => void
  onDuplicateElement?: (id: string) => any
  onCollaborationReady?: (sendElementChange: (change: any) => void) => void
  snapToGrid: (value: number, gridSize: number) => number
  snapSettings: { enabled: boolean; gridSize: number; snapToElements: boolean; snapDistance: number }
  zoom?: number
  showGrid?: boolean
  showSections?: boolean
  isPreviewMode?: boolean
  toggleCategoryRef?: any
  onRegionsChange?: any
  [key: string]: any
}

export function CollaborativeCanvas({ 
  projectId, 
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
  ...canvasProps 
}: CollaborativeCanvasProps) {
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

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
    sendCursorPosition,
    sendElementChange,
    clearElementChanges,
  } = useCollaboration({
    projectId,
    clerkId: user?.id || "",
    username: username.current,
    enabled: !!projectId && !!user,
  })

  // Expose sendElementChange to parent component
  useEffect(() => {
    if (onCollaborationReady) {
      onCollaborationReady(sendElementChange)
    }
  }, [sendElementChange, onCollaborationReady])

  // Apply element changes from other users
  useEffect(() => {
    if (elementChanges.length === 0) return

    elementChanges.forEach((change) => {
      // Skip changes from current user (already applied locally)
      if (change.userId === user?.id) {
        return
      }

      // Apply the change based on action type
      switch (change.action) {
        case 'add':
          onAddElement?.(change.element)
          break
        case 'move':
          // For move action, use position update callback
          onUpdateElementPosition?.(change.element.id, {
            x: change.element.x,
            y: change.element.y,
            ...(change.element.width && { width: change.element.width }),
            ...(change.element.height && { height: change.element.height }),
          })
          break
        case 'update':
          onUpdateElement?.(change.element.id, change.element)
          break
        case 'delete':
          onDeleteElement?.(change.element.id)
          break
      }
    })

    // Clear processed changes
    clearElementChanges()
  }, [elementChanges, user?.id, onAddElement, onUpdateElement, onUpdateElementPosition, onDeleteElement, clearElementChanges])

  // Wrap canvas callbacks to broadcast changes
  const handleAddElement = (element: any) => {
    // Apply locally first
    onAddElement?.(element)
    
    // Broadcast to others
    if (projectId) {
      sendElementChange({
        action: 'add',
        element,
      })
    }
  }

  const handleUpdateElement = (id: string, updates: any) => {
    // Apply locally first
    onUpdateElement?.(id, updates)
    
    // Broadcast to others
    if (projectId) {
      sendElementChange({
        action: 'update',
        element: { id, ...updates },
      })
    }
  }

  // Throttle function to limit broadcast frequency
  const throttleTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const lastBroadcastTime = useRef<Map<string, number>>(new Map())
  
  // Handle real-time drag movement (called on every mousemove during drag)
  const handleElementDragMove = (id: string, position: { x: number; y: number }) => {
    if (!projectId) return
    
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
  }
  
  const handleUpdateElementPosition = (id: string, position: any) => {
    // Apply locally first (immediate UI update)
    onUpdateElementPosition?.(id, position)
    
    // Broadcast final position after drag ends
    if (projectId) {
      sendElementChange({
        action: 'move',
        element: { id, ...position },
      })
      
      // Clear throttle tracking
      lastBroadcastTime.current.delete(id)
    }
  }

  const handleDeleteElement = (id: string) => {
    // Apply locally first
    onDeleteElement?.(id)
    
    // Broadcast to others
    if (projectId) {
      sendElementChange({
        action: 'delete',
        element: { id },
      })
    }
  }

  const handleDuplicateElement = (id: string) => {
    // Apply locally first
    const newElement = onDuplicateElement?.(id)
    
    // Broadcast to others
    if (projectId && newElement) {
      sendElementChange({
        action: 'add',
        element: newElement,
      })
    }
  }

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

      sendCursorPosition(x, y)
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [projectId, sendCursorPosition])

  if (!mounted) {
    return null
  }

  // Filter out current user from active users
  const otherUsers = activeUsers.filter(u => u.clerkId !== user?.id)

  return (
    <div className="relative w-full h-full" id="builder-canvas" ref={canvasRef}>
      {/* Active users display */}
      {projectId && otherUsers.length > 0 && (
        <div className="absolute top-4 right-4 z-50">
          <ActiveUsers 
            users={otherUsers} 
            currentUserClerkId={user?.id || ""}
          />
        </div>
      )}

      {/* Collaborative cursors */}
      <CollaborativeCursor users={otherUsers} containerRef={canvasRef} />

      {/* Original canvas with collaborative callbacks */}
      <Canvas 
        {...canvasProps}
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
      />
    </div>
  )
}
