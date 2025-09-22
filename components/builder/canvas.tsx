"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Copy } from "lucide-react"
import type { BuilderElement, DragData, Breakpoint } from "@/lib/builder-types"

interface CanvasProps {
  elements: BuilderElement[]
  selectedElements: string[]
  currentBreakpoint: Breakpoint
  onElementSelect: (elementId: string, multiSelect?: boolean) => void
  onAddElement: (element: BuilderElement, position?: { x: number; y: number }) => void
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void
  onUpdateElementPosition: (id: string, position: { x: number; y: number; width?: number; height?: number }) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  snapToGrid: (value: number, gridSize: number) => number
  snapSettings: { enabled: boolean; gridSize: number; snapToElements: boolean; snapDistance: number }
}

export function Canvas({
  elements,
  selectedElements,
  currentBreakpoint,
  onElementSelect,
  onAddElement,
  onUpdateElement,
  onUpdateElementPosition,
  onDeleteElement,
  onDuplicateElement,
  snapToGrid,
  snapSettings,
}: CanvasProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const createElementFromType = (type: string): BuilderElement => {
    const id = `${type}-${Date.now()}`

    const elementTemplates: Record<string, Partial<BuilderElement>> = {
      heading: {
        content: "New Heading",
        styles: { fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" },
        responsiveStyles: {
          desktop: { fontSize: "2rem" },
          tablet: { fontSize: "1.75rem" },
          mobile: { fontSize: "1.5rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 60 },
      },
      paragraph: {
        content: "New paragraph text. Click to edit this content.",
        styles: { marginBottom: "1rem", lineHeight: "1.6" },
        responsiveStyles: {
          desktop: { fontSize: "1rem", lineHeight: "1.6" },
          tablet: { fontSize: "0.95rem", lineHeight: "1.5" },
          mobile: { fontSize: "0.9rem", lineHeight: "1.4" },
        },
        position: { x: 100, y: 100, width: 400, height: 80 },
      },
      image: {
        content: "/placeholder.svg?height=200&width=400",
        styles: { width: "100%", height: "auto", marginBottom: "1rem" },
        responsiveStyles: {
          desktop: { width: "100%", maxWidth: "400px" },
          tablet: { width: "100%", maxWidth: "350px" },
          mobile: { width: "100%", maxWidth: "300px" },
        },
        position: { x: 100, y: 100, width: 400, height: 200 },
      },
      button: {
        content: "Click Me",
        styles: {
          padding: "0.75rem 1.5rem",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
          borderRadius: "0.5rem",
          border: "none",
          cursor: "pointer",
        },
        responsiveStyles: {
          desktop: { padding: "0.75rem 1.5rem", fontSize: "1rem" },
          tablet: { padding: "0.65rem 1.25rem", fontSize: "0.95rem" },
          mobile: { padding: "0.6rem 1rem", fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 120, height: 40 },
      },
      section: {
        content: "New Section",
        styles: { padding: "2rem", backgroundColor: "var(--color-muted)", marginBottom: "1rem" },
        responsiveStyles: {
          desktop: { padding: "2rem" },
          tablet: { padding: "1.5rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 500, height: 200 },
      },
    }

    return {
      id,
      type: type as BuilderElement["type"],
      content: elementTemplates[type]?.content || "New Element",
      styles: elementTemplates[type]?.styles || {},
      responsiveStyles: elementTemplates[type]?.responsiveStyles || {},
      position: elementTemplates[type]?.position || { x: 100, y: 100, width: 200, height: 50 },
      ...elementTemplates[type],
    }
  }

  const getElementStyles = (element: BuilderElement): Record<string, any> => {
    const baseStyles = element.styles || {}
    const responsiveStyles = element.responsiveStyles?.[currentBreakpoint] || {}
    return { ...baseStyles, ...responsiveStyles }
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsDragOver(true)
  }

  const handleCanvasDragLeave = () => {
    setIsDragOver(false)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    try {
      const dragData: DragData = JSON.parse(e.dataTransfer.getData("application/json"))

      if (dragData.type === "component" && dragData.componentType) {
        const newElement = createElementFromType(dragData.componentType)
        const snappedX = snapSettings.enabled ? snapToGrid(x, snapSettings.gridSize) : x
        const snappedY = snapSettings.enabled ? snapToGrid(y, snapSettings.gridSize) : y
        onAddElement(newElement, { x: snappedX, y: snappedY })
      }
    } catch (error) {
      console.error("Error handling drop:", error)
    }
  }

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.button !== 0) return // Only left click

    const element = elements.find((el) => el.id === elementId)
    if (!element?.position) return

    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startElementX = element.position.x
    const startElementY = element.position.y

    setDraggedElementId(elementId)
    setDragOffset({ x: startX - startElementX, y: startY - startElementY })

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      const snappedX = snapSettings.enabled ? snapToGrid(newX, snapSettings.gridSize) : newX
      const snappedY = snapSettings.enabled ? snapToGrid(newY, snapSettings.gridSize) : newY

      onUpdateElementPosition(elementId, { x: Math.max(0, snappedX), y: Math.max(0, snappedY) })
    }

    const handleMouseUp = () => {
      setDraggedElementId(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    const isMultiSelect = e.ctrlKey || e.metaKey
    onElementSelect(elementId, isMultiSelect)
  }

  const handleCanvasClick = () => {
    onElementSelect("")
  }

  const renderElement = (element: BuilderElement) => {
    const isSelected = selectedElements.includes(element.id)
    const elementStyles = getElementStyles(element)
    const position = element.position || { x: 0, y: 0, width: 200, height: 50 }

    return (
      <div
        key={element.id}
        className={`
          absolute cursor-pointer transition-all duration-200 rounded-md group
          ${isSelected ? "ring-2 ring-primary bg-element-selected" : "hover:bg-element-hover"}
          ${draggedElementId === element.id ? "z-50" : "z-10"}
        `}
        style={{
          left: position.x,
          top: position.y,
          width: position.width,
          height: position.height,
        }}
        onClick={(e) => handleElementClick(e, element.id)}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
      >
        {/* Element content */}
        <div className="p-2 w-full h-full overflow-hidden">
          {element.type === "heading" && (
            <h1 className="text-card-foreground truncate" style={elementStyles}>
              {element.content}
            </h1>
          )}
          {element.type === "paragraph" && (
            <p className="text-card-foreground text-sm leading-tight" style={elementStyles}>
              {element.content}
            </p>
          )}
          {element.type === "image" && (
            <img
              src={element.content || "/placeholder.svg"}
              alt="Element"
              className="w-full h-full object-cover"
              style={elementStyles}
            />
          )}
          {element.type === "button" && (
            <button className="text-card-foreground w-full h-full" style={elementStyles}>
              {element.content}
            </button>
          )}
          {element.type === "section" && (
            <div className="text-card-foreground w-full h-full" style={elementStyles}>
              {element.content}
            </div>
          )}
        </div>

        {/* Element label and controls */}
        {isSelected && (
          <>
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1 z-20">
              <span>{element.type}</span>
              <span className="text-xs opacity-75">({currentBreakpoint})</span>
            </div>
            <div className="absolute -top-6 right-0 flex gap-1 z-20">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicateElement(element.id)
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteElement(element.id)
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Resize handles */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize z-20" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-primary rounded cursor-s-resize z-20" />
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-3 bg-primary rounded cursor-e-resize z-20" />
          </>
        )}
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full min-h-[800px] bg-canvas overflow-auto ${isDragOver ? "bg-drop-zone/20" : ""}`}
      onClick={handleCanvasClick}
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
    >
      {/* Grid overlay */}
      {snapSettings.enabled && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--color-border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
            `,
            backgroundSize: `${snapSettings.gridSize}px ${snapSettings.gridSize}px`,
          }}
        />
      )}

      {/* Breakpoint indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">
          <span>Editing for:</span>
          <span className="font-medium text-foreground capitalize">{currentBreakpoint}</span>
        </div>
      </div>

      {/* Elements */}
      {elements.map(renderElement)}

      {/* Drop zone indicator */}
      {isDragOver && (
        <div className="absolute inset-4 border-2 border-dashed border-primary rounded-lg flex items-center justify-center text-primary bg-drop-zone/10 pointer-events-none z-20">
          <p className="text-lg font-medium">Drop component anywhere on the canvas</p>
        </div>
      )}
    </div>
  )
}
