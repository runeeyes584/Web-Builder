"use client"

import type { Breakpoint, BuilderElement, SnapSettings } from "@/lib/builder-types"
import { useCallback, useState } from "react"

export function useBuilderState() {
  const [elements, setElements] = useState<BuilderElement[]>([
    {
      id: "1",
      type: "heading",
      content: "Welcome to Your Website",
      styles: { fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" },
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

  const addElement = useCallback((element: BuilderElement, position?: { x: number; y: number }) => {
    setElements((prev) => {
      const basePosition = element.position || { x: 100, y: 100, width: 200, height: 50 }
      const mergedPosition = position ? { ...basePosition, ...position } : basePosition
      const newElement = {
        ...element,
        position: mergedPosition,
      }
      const newElements = [...prev, newElement]
      
      // Save to history
      setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
      setHistoryIndex((idx) => idx + 1)
      
      return newElements
    })
  }, [historyIndex])

  const updateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    setElements((prev) => {
      const newElements = prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
      
      // Save to history
      setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
      setHistoryIndex((idx) => idx + 1)
      
      return newElements
    })
  }, [historyIndex])

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
    console.log('Delete element:', id)
    setElements((prev) => {
      const newElements = prev.filter((el) => el.id !== id)
      
      // Save to history
      setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
      setHistoryIndex((idx) => idx + 1)
      
      console.log('Element deleted, history updated:', { 
        newHistoryLength: historyIndex + 2, 
        newElementsCount: newElements.length 
      })
      
      return newElements
    })
    setSelectedElements((prev) => prev.filter((elId) => elId !== id))
  }, [historyIndex])

  const duplicateElement = useCallback(
    (id: string) => {
      const element = elements.find((el) => el.id === id)
      if (element) {
        const newElement = {
          ...element,
          id: `${element.id}-copy-${Date.now()}`,
        }
        addElement(newElement)
      }
    },
    [elements, addElement],
  )

  const updateElementPosition = useCallback(
    (id: string, position: { x: number; y: number; width?: number; height?: number }) => {
      setElements((prev) => {
        const newElements = prev.map((el) => (el.id === id ? { ...el, position: { ...el.position, ...position } } : el))
        
        // Save to history
        setHistory((hist) => [...hist.slice(0, historyIndex + 1), newElements])
        setHistoryIndex((idx) => idx + 1)
        
        return newElements
      })
    },
    [historyIndex],
  )

  const snapToGrid = useCallback((value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize
  }, [])

  const undo = useCallback(() => {
    console.log('Undo called:', { historyIndex, historyLength: history.length })
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
      console.log('Undo successful:', { newIndex, elementsCount: history[newIndex].length })
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    console.log('Redo called:', { historyIndex, historyLength: history.length })
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
      console.log('Redo successful:', { newIndex, elementsCount: history[newIndex].length })
    }
  }, [history, historyIndex])

  const saveToHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), elements])
    setHistoryIndex((prev) => prev + 1)
  }, [elements, historyIndex])

  const loadProject = useCallback((newElements: BuilderElement[]) => {
    setElements(newElements)
    setSelectedElements([])
    setHistory([newElements])
    setHistoryIndex(0)
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
  }
}
