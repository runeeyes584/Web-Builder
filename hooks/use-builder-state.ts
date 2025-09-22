"use client"

import { useState, useCallback } from "react"
import type { BuilderElement, Breakpoint, SnapSettings } from "@/lib/builder-types"

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
      const newElement = {
        ...element,
        position: position || element.position || { x: 100, y: 100, width: 200, height: 50 },
      }
      return [...prev, newElement]
    })
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)))
  }, [])

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
    setElements((prev) => prev.filter((el) => el.id !== id))
    setSelectedElements((prev) => prev.filter((elId) => elId !== id))
  }, [])

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
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, position: { ...el.position, ...position } } : el)),
      )
    },
    [],
  )

  const snapToGrid = useCallback((value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize
  }, [])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      setElements(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      setElements(history[historyIndex + 1])
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
