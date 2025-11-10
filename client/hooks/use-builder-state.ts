"use client"

import { editHistoryApi } from "@/api/editHistory.api"
import type { Breakpoint, BuilderElement, SnapSettings } from "@/lib/builder-types"
import { useUser } from "@clerk/nextjs"
import { useCallback, useRef, useState } from "react"

export function useBuilderState() {
  const { user } = useUser()
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  
  // Track last action to prevent duplicates
  const lastActionRef = useRef<{ action: string; elementId: string; timestamp: number } | null>(null)
  
  // Debounce timers
  const moveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const updateDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [elements, setElements] = useState<BuilderElement[]>([
    {
      id: "1",
      type: "heading",
      content: "Welcome to Your Website",
      styles: { fontSize: "2rem", marginBottom: "1rem" },
      responsiveStyles: {
        desktop: { fontSize: "2rem" },
        tablet: { fontSize: "1.75rem" },
        mobile: { fontSize: "1.5rem" },
      },
      position: { x: 50, y: 50, width: 400, height: 60 },
    },
    {
      id: "2",
      type: "paragraph",
      content: "This is a sample paragraph. Click to edit or drag new elements from the sidebar.",
      styles: { marginBottom: "1rem", color: "var(--color-muted-foreground)" },
      responsiveStyles: {
        desktop: { fontSize: "1rem", lineHeight: "1.6" },
        tablet: { fontSize: "0.95rem", lineHeight: "1.5" },
        mobile: { fontSize: "0.9rem", lineHeight: "1.4" },
      },
      position: { x: 50, y: 130, width: 500, height: 80 },
    },
  ])

  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>("desktop")
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [history, setHistory] = useState<BuilderElement[][]>([elements])
  const [historyIndex, setHistoryIndex] = useState(0)

  const [snapSettings, setSnapSettings] = useState<SnapSettings>({
    enabled: true,
    gridSize: 10,
    snapToElements: true,
    snapDistance: 5,
  })

  const [showSections, setShowSections] = useState<boolean>(false)
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false)

  // Helper function to save action to database (with duplicate prevention)
  const saveActionToDB = useCallback(async (
    action: 'ADD' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'MOVE',
    componentSnapshot: any
  ) => {
    // Only save if we have pageId and user
    if (!currentPageId || !user?.id) {
      console.warn('Cannot save to DB: missing pageId or user')
      return
    }

    // Prevent duplicate saves within 1 second
    const now = Date.now()
    const lastAction = lastActionRef.current
    const elementId = componentSnapshot?.id || 'unknown'
    
    if (
      lastAction &&
      lastAction.action === action &&
      lastAction.elementId === elementId &&
      now - lastAction.timestamp < 1000 // 1 second debounce
    ) {
      return
    }

    // Update last action tracker
    lastActionRef.current = { action, elementId, timestamp: now }

    try {
      await editHistoryApi.createHistory({
        page_id: currentPageId,
        clerk_id: user.id,
        action,
        component_snapshot: componentSnapshot,
      })
    } catch (error) {
      console.error(`Failed to save ${action} to DB:`, error)
    }
  }, [currentPageId, user])

  const addElement = useCallback((element: BuilderElement, position?: { x: number; y: number }) => {
    setElements((prev) => {
      const basePosition = element.position || { x: 100, y: 100, width: 200, height: 50 }
      const mergedPosition = position ? { ...basePosition, ...position } : basePosition
      const newElement = {
        ...element,
        position: mergedPosition,
      }
      const newElements = [...prev, newElement]
      
      // Save to local history (for Undo/Redo)
      setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
      setHistoryIndex((idx) => idx + 1)
      
      // Save to database (async, non-blocking)
      saveActionToDB('ADD', newElement)
      
      return newElements
    })
  }, [historyIndex, saveActionToDB])

  const updateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    setElements((prev) => {
      const newElements = prev.map((el) => {
        if (el.id === id) {
          const updated = { ...el, ...updates };
          
          // Debounce UPDATE action (chỉ save sau 1 giây không có changes nữa)
          if (updateDebounceTimerRef.current) {
            clearTimeout(updateDebounceTimerRef.current)
          }
          
          updateDebounceTimerRef.current = setTimeout(() => {
            saveActionToDB('UPDATE', updated)
          }, 1000) // Đợi 1 giây sau khi user ngừng gõ
          
          return updated;
        }
        return el;
      });
      
      // Save to local history (ngay lập tức cho Undo/Redo)
      setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
      setHistoryIndex((idx) => idx + 1)
      
      return newElements
    })
  }, [historyIndex, saveActionToDB])

  const updateElementResponsiveStyle = useCallback(
    (id: string, breakpoint: Breakpoint, styles: Record<string, any>) => {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === id) {
            return {
              ...el,
              responsiveStyles: {
                ...el.responsiveStyles,
                [breakpoint]: {
                  ...el.responsiveStyles?.[breakpoint],
                  ...styles,
                },
              },
            }
          }
          return el
        }),
      )
    },
    [],
  )

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => {
      // Get element before deleting (để lưu vào history)
      const deletedElement = prev.find((el) => el.id === id)
      const newElements = prev.filter((el) => el.id !== id)
      
      // Save to local history
      setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
      setHistoryIndex((idx) => idx + 1)
      
      // Save to database (async)
      if (deletedElement) {
        saveActionToDB('DELETE', deletedElement)
      }
      
      return newElements
    })
    setSelectedElements((prev) => prev.filter((elId) => elId !== id))
  }, [historyIndex, saveActionToDB])

  const duplicateElement = useCallback(
    (id: string) => {
      const element = elements.find((el) => el.id === id)
      if (element) {
        const newElement = {
          ...element,
          id: `${element.id}-copy-${Date.now()}`,
        }
        
        // Save to database with DUPLICATE action
        // Không gọi addElement() vì nó sẽ tạo thêm record với action ADD
        setElements((prev) => {
          const newElements = [...prev, newElement]
          
          // Save to local history
          setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
          setHistoryIndex((idx) => idx + 1)
          
          return newElements
        })
        
        // Save to database (async)
        saveActionToDB('DUPLICATE', newElement)
      }
    },
    [elements, historyIndex, saveActionToDB],
  )

  const updateElementPosition = useCallback(
    (id: string, position: { x: number; y: number; width?: number; height?: number }) => {
      setElements((prev) => {
        const newElements = prev.map((el) => {
          if (el.id === id) {
            const movedElement = { ...el, position: { ...el.position, ...position } }
            
            // Debounce MOVE action (chỉ save sau 500ms không có movement nữa)
            if (moveDebounceTimerRef.current) {
              clearTimeout(moveDebounceTimerRef.current)
            }
            
            moveDebounceTimerRef.current = setTimeout(() => {
              saveActionToDB('MOVE', movedElement)
            }, 500) // Đợi 500ms sau khi user ngừng drag
            
            return movedElement
          }
          return el
        })
        
        // Save to local history
        setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
        setHistoryIndex((idx) => idx + 1)
        
        return newElements
      })
    },
    [historyIndex, saveActionToDB],
  )

  const snapToGrid = useCallback((value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize
  }, [])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
    }
  }, [history, historyIndex])

  const saveToHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), elements])
    setHistoryIndex((prev) => prev + 1)
  }, [elements, historyIndex])

  const loadProject = useCallback((newElements: BuilderElement[], pageId?: string) => {
    setElements(newElements)
    setSelectedElements([])
    setHistory([newElements])
    setHistoryIndex(0)
    
    // Set pageId để có thể save history
    if (pageId) {
      setCurrentPageId(pageId)
    }
  }, [])

  return {
    elements,
    selectedElements,
    setSelectedElements,
    currentBreakpoint,
    setCurrentBreakpoint,
    draggedElement,
    setDraggedElement,
    snapSettings,
    setSnapSettings,
    showSections,
    setShowSections,
    isPreviewMode,
    setIsPreviewMode,
    addElement,
    updateElement,
    updateElementResponsiveStyle,
    updateElementPosition,
    deleteElement,
    duplicateElement,
    undo,
    redo,
    saveToHistory,
    snapToGrid,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    loadProject,
    currentPageId,
    setCurrentPageId,
  }
}
