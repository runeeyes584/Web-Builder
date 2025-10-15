"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import type { Breakpoint, BuilderElement } from "@/lib/builder-types"
import { Copy, Trash2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useDrop } from "react-dnd"

// Components that should fill the entire box without padding
const NO_PADDING_COMPONENTS: ReadonlySet<BuilderElement["type"]> = new Set([
  "video",
  "image",
])

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
  zoom?: number
  showGrid?: boolean
  showSections?: boolean
  isPreviewMode?: boolean
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
  zoom = 100,
  showGrid = true,
  showSections = true,
  isPreviewMode = false,
}: CanvasProps) {
  // Partition dynamic sizes
  const [headerHeight, setHeaderHeight] = useState<number>(96)
  const [footerHeight, setFooterHeight] = useState<number>(96)
  const MIN_HEADER = 48
  const MIN_FOOTER = 48
  const MIN_SECTION = 128

  // Sections model: vertical stacks between header and footer
  type Section = { id: string; height: number }
  const DEFAULT_SECTION = 608 // 800 - 96 - 96 (matches initial min canvas height minus header/footer)
  const [sections, setSections] = useState<Section[]>([
    { id: `sec-${Date.now()}`, height: Math.max(MIN_SECTION, DEFAULT_SECTION) },
  ])
  const totalSectionsHeight = sections.reduce((sum, s) => sum + s.height, 0)
  const contentHeight = headerHeight + totalSectionsHeight + footerHeight

  // Focused region for persistent controls
  const [focusedRegion, setFocusedRegion] = useState<null | "header" | "section" | "footer" >(null)
  const [focusedSectionIndex, setFocusedSectionIndex] = useState<number | null>(null)

  const [draggedElementId, setDraggedElementId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null)

  // Transient positions/sizes while dragging/resizing to avoid heavy global updates
  const transientRef = useRef(new Map<string, { x?: number; y?: number; width?: number; height?: number }>())
  const rafIdRef = useRef<number | null>(null)
  const dragGroupRef = useRef<{
    ids: string[]
    startPositions: Map<string, { x: number; y: number }>
    mouseStart: { x: number; y: number }
  } | null>(null)
  // Local tick to trigger at most one render per animation frame
  const [, setRafTick] = useState(0)
  const scheduleRerender = useCallback(() => {
    if (rafIdRef.current != null) return
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null
      setRafTick((t) => (t + 1) % 1000000)
    })
  }, [])
  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  type ComponentDragItem = { type: "COMPONENT"; componentType: string }

  const [{ isOver }, dropRef] = useDrop<
    ComponentDragItem,
    void,
    { isOver: boolean }
  >(() => ({
    accept: "COMPONENT",
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
    drop: (item, monitor) => {
      console.log('Drop event triggered:', item)
      if (!canvasEl) {
        console.warn('Canvas element not found')
        return
      }
      
      const client = monitor.getClientOffset()
      if (!client) {
        console.warn('Client offset not found')
        return
      }
      
      const rect = canvasEl.getBoundingClientRect()
      const scale = zoom / 100
      
      // Calculate position with cursor at center of dropped element
      let x = (client.x - rect.left) / scale
      let y = (client.y - rect.top) / scale

      // Snap into dynamic partitions (header/sections/footer)
        const headerH = headerHeight
        const footerTop = headerHeight + totalSectionsHeight
        const canvasHeight = Math.max(contentHeight, rect.height / scale)
        const sectionTop = headerH
        const sectionBottom = footerTop
        if (y < sectionTop) {
          y = Math.max(8, y) // keep inside header
        } else if (y > sectionBottom) {
          // In footer area
          y = Math.min(canvasHeight - 8, y)
        } else {
          // Inside sections: if near middle of the specific section, snap to its mid
          let acc = sectionTop
          for (let i = 0; i < sections.length; i++) {
            const top = acc
            const bottom = top + sections[i].height
            const mid = (top + bottom) / 2
            if (y >= top && y <= bottom) {
              if (Math.abs(y - mid) < 20) y = mid
              break
            }
            acc = bottom
          }
        }
      
      console.log('Drop position:', { x, y, scale })
      
      const newElement = createElementFromType(item.componentType)
      const width = newElement.position?.width || 0
      const height = newElement.position?.height || 0
      
      // Center the element on the cursor position
      const centeredX = x - width / 2
      const centeredY = y - height / 2
      
      // Apply grid snapping if enabled
      const snappedX = snapSettings.enabled ? snapToGrid(centeredX, snapSettings.gridSize) : centeredX
      const snappedY = snapSettings.enabled ? snapToGrid(centeredY, snapSettings.gridSize) : centeredY
      
      console.log('Adding element:', newElement.type)
      onAddElement(newElement, { x: Math.max(0, snappedX), y: Math.max(0, snappedY) })
    },
  }), [canvasEl, zoom, snapSettings, snapToGrid, onAddElement, headerHeight, footerHeight, sections, totalSectionsHeight, contentHeight])

  const setCanvasNode = useCallback((node: HTMLDivElement | null) => {
    console.log('Setting canvas node:', !!node)
    setCanvasEl(node)
    dropRef(node)
  }, [dropRef])

  const createElementFromType = (type: string): BuilderElement => {
    const id = `${type}-${Date.now()}`

    const elementTemplates: Record<string, Partial<BuilderElement>> = {
      heading: {
        content: "New Heading",
        styles: { fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem", color: "var(--color-foreground)" },
        responsiveStyles: {
          desktop: { fontSize: "2rem" },
          tablet: { fontSize: "1.75rem" },
          mobile: { fontSize: "1.5rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 60 },
        animations: { type: "fadeIn", duration: 600, delay: 0, direction: "up" },
      },
      paragraph: {
        content: "New paragraph text. Click to edit this content.",
        styles: { marginBottom: "1rem", lineHeight: "1.6", color: "var(--color-muted-foreground)" },
        responsiveStyles: {
          desktop: { fontSize: "1rem", lineHeight: "1.6" },
          tablet: { fontSize: "0.95rem", lineHeight: "1.5" },
          mobile: { fontSize: "0.9rem", lineHeight: "1.4" },
        },
        position: { x: 100, y: 100, width: 400, height: 80 },
        animations: { type: "slideIn", duration: 800, delay: 200, direction: "up" },
      },
      image: {
        content: "/placeholder.svg?height=250&width=300",
        styles: { width: "100%", height: "auto", marginBottom: "1rem", borderRadius: "0.5rem" },
        responsiveStyles: {
          desktop: { width: "100%" },
          tablet: { width: "100%" },
          mobile: { width: "100%" },
        },
        position: { x: 100, y: 100, width: 300, height: 250 },
        animations: { type: "zoomIn", duration: 700, delay: 100 },
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
          fontWeight: "500",
          transition: "all 0.2s ease",
        },
        responsiveStyles: {
          desktop: { padding: "0.75rem 1.5rem", fontSize: "1rem" },
          tablet: { padding: "0.65rem 1.25rem", fontSize: "0.95rem" },
          mobile: { padding: "0.6rem 1rem", fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 150, height: 50 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      section: {
        content: "New Section",
        styles: { 
          padding: "2rem", 
          backgroundColor: "var(--color-muted)", 
          marginBottom: "1rem",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)"
        },
        responsiveStyles: {
          desktop: { padding: "2rem" },
          tablet: { padding: "1.5rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 600, height: 250 },
        animations: { type: "slideIn", duration: 800, delay: 0, direction: "up" },
      },
      card: {
        content: "Card Content",
        styles: {
          padding: "1.5rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          marginBottom: "1rem",
        },
        responsiveStyles: {
          desktop: { padding: "1.5rem" },
          tablet: { padding: "1.25rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 350, height: 250 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      quote: {
        content: "This is an inspiring quote that will motivate your visitors.",
        styles: {
          padding: "1.5rem",
          borderLeft: "4px solid var(--color-primary)",
          backgroundColor: "var(--color-muted)",
          fontStyle: "italic",
          fontSize: "1.1rem",
          borderRadius: "0.5rem",
        },
        props: {
          author: "Author Name",
          authorFontSize: "12px",
          authorFontWeight: "400",
        },
        responsiveStyles: {
          desktop: { fontSize: "1.1rem" },
          tablet: { fontSize: "1rem" },
          mobile: { fontSize: "0.95rem" },
        },
        position: { x: 100, y: 100, width: 450, height: 140 },
        animations: { type: "slideIn", duration: 700, delay: 100, direction: "left" },
      },
      separator: {
        content: "",
        styles: {
          height: "2px",
          backgroundColor: "#6b7280",
          margin: "0",
          width: "100%",
        },
        position: { x: 100, y: 100, width: 300, height: 2 },
        props: {
          thickness: "2px",
          orientation: "horizontal",
          separatorStyle: "solid"
        },
        animations: { type: "fadeIn", duration: 500, delay: 0 },
      },
      list: {
        content: "• First item\n• Second item\n• Third item",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          lineHeight: "1.8",
        },
        responsiveStyles: {
          desktop: { fontSize: "1rem" },
          tablet: { fontSize: "0.95rem" },
          mobile: { fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 140 },
        animations: { type: "slideIn", duration: 600, delay: 200, direction: "up" },
      },
      input: {
        content: "Enter text here...",
        styles: {
          padding: "0.75rem",
          border: "1px solid var(--color-border)",
          borderRadius: "0.5rem",
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
          fontSize: "1rem",
          width: "100%",
        },
        responsiveStyles: {
          desktop: { padding: "0.75rem", fontSize: "1rem" },
          tablet: { padding: "0.65rem", fontSize: "0.95rem" },
          mobile: { padding: "0.6rem", fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 250, height: 50 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      textarea: {
        content: "Enter your message here...",
        styles: {
          padding: "0.75rem",
          border: "1px solid var(--color-border)",
          borderRadius: "0.5rem",
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
          fontSize: "1rem",
          width: "100%",
          resize: "vertical",
        },
        responsiveStyles: {
          desktop: { padding: "0.75rem", fontSize: "1rem" },
          tablet: { padding: "0.65rem", fontSize: "0.95rem" },
          mobile: { padding: "0.6rem", fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 350, height: 120 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      select: {
        content: "Select an option",
        styles: {
          padding: "0.75rem",
          border: "1px solid var(--color-border)",
          borderRadius: "0.5rem",
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
          fontSize: "1rem",
          width: "100%",
        },
        responsiveStyles: {
          desktop: { padding: "0.75rem", fontSize: "1rem" },
          tablet: { padding: "0.65rem", fontSize: "0.95rem" },
          mobile: { padding: "0.6rem", fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 200, height: 40 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      checkbox: {
        content: "Checkbox option",
        styles: {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "1rem",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { fontSize: "1rem" },
          tablet: { fontSize: "0.95rem" },
          mobile: { fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 150, height: 30 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      radio: {
        content: "Radio option",
        styles: {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "1rem",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { fontSize: "1rem" },
          tablet: { fontSize: "0.95rem" },
          mobile: { fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 150, height: 30 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      switch: {
        content: "Toggle switch",
        styles: {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "1rem",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { fontSize: "1rem" },
          tablet: { fontSize: "0.95rem" },
          mobile: { fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 150, height: 30 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      video: {
        content: "/placeholder.svg?height=300&width=500",
        styles: {
          width: "100%",
          height: "100%",
          borderRadius: "0.5rem",
          backgroundColor: "var(--color-muted)",
        },
        responsiveStyles: {
          desktop: { width: "100%", height: "100%" },
          tablet: { width: "100%", height: "100%" },
          mobile: { width: "100%", height: "100%" },
        },
        position: { x: 100, y: 100, width: 500, height: 300 },
        animations: { type: "zoomIn", duration: 700, delay: 100 },
      },
      audio: {
        content: "Audio Player",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 80 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      gallery: {
        content: "Image Gallery",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "zoomIn", duration: 700, delay: 100 },
      },
      icon: {
        content: "⭐",
        styles: {
          fontSize: "2rem",
          textAlign: "center",
          color: "var(--color-primary)",
        },
        responsiveStyles: {
          desktop: { fontSize: "2rem" },
          tablet: { fontSize: "1.75rem" },
          mobile: { fontSize: "1.5rem" },
        },
        position: { x: 100, y: 100, width: 60, height: 60 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      badge: {
        content: "New",
        styles: {
          padding: "0.25rem 0.75rem",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
          borderRadius: "9999px",
          fontSize: "0.875rem",
          fontWeight: "500",
        },
        responsiveStyles: {
          desktop: { fontSize: "0.875rem" },
          tablet: { fontSize: "0.8rem" },
          mobile: { fontSize: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 60, height: 30 },
        animations: { type: "pulse", duration: 1000, delay: 0 },
      },
      avatar: {
        content: "👤",
        styles: {
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "var(--color-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
        },
        responsiveStyles: {
          desktop: { width: "60px", height: "60px", fontSize: "1.5rem" },
          tablet: { width: "50px", height: "50px", fontSize: "1.25rem" },
          mobile: { width: "40px", height: "40px", fontSize: "1rem" },
        },
        position: { x: 100, y: 100, width: 60, height: 60 },
        animations: { type: "zoomIn", duration: 600, delay: 200 },
      },
      modal: {
        content: "Modal Content",
        styles: {
          padding: "2rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "2rem" },
          tablet: { padding: "1.5rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "zoomIn", duration: 500, delay: 0 },
      },
      tooltip: {
        content: "Tooltip text",
        styles: {
          padding: "0.5rem 0.75rem",
          backgroundColor: "var(--color-popover)",
          color: "var(--color-popover-foreground)",
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
          border: "1px solid var(--color-border)",
        },
        responsiveStyles: {
          desktop: { fontSize: "0.875rem" },
          tablet: { fontSize: "0.8rem" },
          mobile: { fontSize: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 120, height: 40 },
        animations: { type: "fadeIn", duration: 300, delay: 0 },
      },
      dropdown: {
        content: "Dropdown Menu",
        styles: {
          padding: "0.75rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
          fontSize: "1rem",
        },
        responsiveStyles: {
          desktop: { fontSize: "1rem" },
          tablet: { fontSize: "0.95rem" },
          mobile: { fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 200, height: 40 },
        animations: { type: "slideIn", duration: 300, delay: 0, direction: "down" },
      },
      tabs: {
        content: "Tab Content",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      accordion: {
        content: "Accordion Content",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 100 },
        animations: { type: "slideIn", duration: 500, delay: 100, direction: "up" },
      },
      carousel: {
        content: "Image Carousel",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "slideIn", duration: 600, delay: 200, direction: "left" },
      },
      table: {
        content: "Data Table",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
          fontSize: "0.875rem",
        },
        responsiveStyles: {
          desktop: { fontSize: "0.875rem" },
          tablet: { fontSize: "0.8rem" },
          mobile: { fontSize: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 400, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      chart: {
        content: "Data Chart",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "zoomIn", duration: 700, delay: 100 },
      },
      progress: {
        content: "Progress Bar",
        styles: {
          padding: "0.5rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "0.5rem" },
          tablet: { padding: "0.4rem" },
          mobile: { padding: "0.3rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 40 },
        animations: { type: "slideIn", duration: 500, delay: 100, direction: "left" },
      },
      timeline: {
        content: "Timeline Event",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
          borderLeft: "4px solid var(--color-primary)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 100 },
        animations: { type: "slideIn", duration: 600, delay: 200, direction: "left" },
      },
      stats: {
        content: "Statistics",
        styles: {
          padding: "1.5rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
        responsiveStyles: {
          desktop: { padding: "1.5rem" },
          tablet: { padding: "1.25rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 200, height: 120 },
        animations: { type: "zoomIn", duration: 600, delay: 200 },
      },
      counter: {
        content: "0",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
          borderRadius: "0.5rem",
          fontSize: "2rem",
          fontWeight: "bold",
          textAlign: "center",
        },
        responsiveStyles: {
          desktop: { fontSize: "2rem" },
          tablet: { fontSize: "1.75rem" },
          mobile: { fontSize: "1.5rem" },
        },
        position: { x: 100, y: 100, width: 80, height: 80 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      "product-card": {
        content: "Product Name",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 200, height: 250 },
        animations: { type: "zoomIn", duration: 600, delay: 200 },
      },
      price: {
        content: "$99.99",
        styles: {
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "var(--color-primary)",
          textAlign: "center",
        },
        responsiveStyles: {
          desktop: { fontSize: "1.5rem" },
          tablet: { fontSize: "1.25rem" },
          mobile: { fontSize: "1.125rem" },
        },
        position: { x: 100, y: 100, width: 100, height: 40 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      rating: {
        content: "⭐⭐⭐⭐⭐",
        styles: {
          fontSize: "1.25rem",
          textAlign: "center",
          color: "var(--color-primary)",
        },
        responsiveStyles: {
          desktop: { fontSize: "1.25rem" },
          tablet: { fontSize: "1.125rem" },
          mobile: { fontSize: "1rem" },
        },
        position: { x: 100, y: 100, width: 120, height: 30 },
        animations: { type: "pulse", duration: 1000, delay: 0 },
      },
      cart: {
        content: "Add to Cart",
        styles: {
          padding: "0.75rem 1.5rem",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
          borderRadius: "0.5rem",
          fontSize: "1rem",
          fontWeight: "600",
          textAlign: "center",
          cursor: "pointer",
        },
        responsiveStyles: {
          desktop: { padding: "0.75rem 1.5rem", fontSize: "1rem" },
          tablet: { padding: "0.65rem 1.25rem", fontSize: "0.95rem" },
          mobile: { padding: "0.6rem 1rem", fontSize: "0.9rem" },
        },
        position: { x: 100, y: 100, width: 120, height: 40 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      checkout: {
        content: "Checkout",
        styles: {
          padding: "1rem 2rem",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
          borderRadius: "0.5rem",
          fontSize: "1.1rem",
          fontWeight: "600",
          textAlign: "center",
          cursor: "pointer",
        },
        responsiveStyles: {
          desktop: { padding: "1rem 2rem", fontSize: "1.1rem" },
          tablet: { padding: "0.875rem 1.75rem", fontSize: "1rem" },
          mobile: { padding: "0.75rem 1.5rem", fontSize: "0.95rem" },
        },
        position: { x: 100, y: 100, width: 120, height: 50 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      "social-links": {
        content: "Social Media",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 200, height: 80 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "contact-info": {
        content: "Contact Information",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 250, height: 120 },
        animations: { type: "slideIn", duration: 600, delay: 200, direction: "up" },
      },
      map: {
        content: "Map Location",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-muted)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "zoomIn", duration: 700, delay: 100 },
      },
      newsletter: {
        content: "Newsletter Signup",
        styles: {
          padding: "1.5rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1.5rem" },
          tablet: { padding: "1.25rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      team: {
        content: "Team Member",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 200, height: 250 },
        animations: { type: "zoomIn", duration: 600, delay: 200 },
      },
      testimonial: {
        content: "Customer Review",
        styles: {
          padding: "1.5rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
          fontStyle: "italic",
        },
        responsiveStyles: {
          desktop: { padding: "1.5rem" },
          tablet: { padding: "1.25rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      grid: {
        content: "Grid Layout",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1rem",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      navigation: {
        content: "Navigation Menu",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
        props: {
          logo: "Logo",
          menuItems: ["Home", "About", "Contact"],
          menuItemFontSize: "14px",
          menuItemFontWeight: "400",
          menuItemFontFamily: "inherit"
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 400, height: 60 },
        animations: { type: "slideIn", duration: 500, delay: 100, direction: "down" },
      },
      footer: {
        content: "Footer Content",
        styles: {
          padding: "2rem",
          backgroundColor: "var(--color-muted)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "2rem" },
          tablet: { padding: "1.5rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 400, height: 120 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      header: {
        content: "Header Content",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 400, height: 100 },
        animations: { type: "slideIn", duration: 500, delay: 100, direction: "down" },
      },
      sidebar: {
        content: "Sidebar Content",
        styles: {
          padding: "1rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1rem" },
          tablet: { padding: "0.875rem" },
          mobile: { padding: "0.75rem" },
        },
        position: { x: 100, y: 100, width: 200, height: 300 },
        animations: { type: "slideIn", duration: 500, delay: 100, direction: "left" },
      },
      form: {
        content: "Contact Form",
        styles: {
          padding: "1.5rem",
          backgroundColor: "var(--color-card)",
          borderRadius: "0.75rem",
          border: "1px solid var(--color-border)",
          color: "var(--color-foreground)",
        },
        responsiveStyles: {
          desktop: { padding: "1.5rem" },
          tablet: { padding: "1.25rem" },
          mobile: { padding: "1rem" },
        },
        position: { x: 100, y: 100, width: 300, height: 250 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      // Advanced UI Components
      calendar: {
        content: "Calendar",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "search-bar": {
        content: "Search...",
        styles: { padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", backgroundColor: "var(--color-background)", color: "var(--color-foreground)", fontSize: "1rem", width: "100%" },
        responsiveStyles: { desktop: { padding: "0.75rem", fontSize: "1rem" }, tablet: { padding: "0.65rem", fontSize: "0.95rem" }, mobile: { padding: "0.6rem", fontSize: "0.9rem" } },
        position: { x: 100, y: 100, width: 250, height: 40 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      filter: {
        content: "Filter Options",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 120 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      breadcrumb: {
        content: "Home > About > Contact",
        styles: { padding: "0.5rem", backgroundColor: "var(--color-muted)", borderRadius: "0.375rem", color: "var(--color-foreground)", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 35 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      pagination: {
        content: "1 2 3 ... 10",
        styles: { padding: "0.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.375rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", textAlign: "center", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 40 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      spinner: {
        content: "Loading...",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", textAlign: "center", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 120, height: 80 },
        animations: { type: "pulse", duration: 1000, delay: 0 },
      },
      skeleton: {
        content: "Loading skeleton",
        styles: { padding: "1rem", backgroundColor: "var(--color-muted)", borderRadius: "0.5rem", color: "var(--color-muted-foreground)", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 100 },
        animations: { type: "pulse", duration: 1500, delay: 0 },
      },
      alert: {
        content: "Alert message",
        styles: { padding: "0.75rem", backgroundColor: "var(--color-destructive)", color: "var(--color-destructive-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 50 },
        animations: { type: "shake", duration: 500, delay: 0 },
      },
      toast: {
        content: "Toast notification",
        styles: { padding: "0.75rem", backgroundColor: "var(--color-card)", color: "var(--color-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 50 },
        animations: { type: "slideIn", duration: 300, delay: 0, direction: "up" },
      },
      drawer: {
        content: "Side drawer",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", width: "250px" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 250, height: 300 },
        animations: { type: "slideIn", duration: 500, delay: 100, direction: "left" },
      },
      // Content & Text Components
      "code-block": {
        content: "console.log('Hello World');",
        styles: { padding: "1rem", backgroundColor: "var(--color-muted)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "monospace", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 100 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      markdown: {
        content: "# Markdown Content\n\nThis is **bold** text and *italic* text.",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontSize: "0.875rem", lineHeight: "1.6" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 120 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "rich-text": {
        content: "Rich Text Editor",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      typography: {
        content: "Typography Styles",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontSize: "1.125rem", fontWeight: "600" },
        responsiveStyles: { desktop: { fontSize: "1.125rem" }, tablet: { fontSize: "1rem" }, mobile: { fontSize: "0.95rem" } },
        position: { x: 100, y: 100, width: 200, height: 80 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      link: {
        content: "External Link",
        styles: { padding: "0.5rem", backgroundColor: "transparent", color: "var(--color-primary)", fontSize: "0.875rem", textDecoration: "underline", cursor: "pointer" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 120, height: 30 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      tag: {
        content: "Tag",
        styles: { padding: "0.25rem 0.75rem", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "500" },
        responsiveStyles: { desktop: { fontSize: "0.75rem" }, tablet: { fontSize: "0.7rem" }, mobile: { fontSize: "0.65rem" } },
        position: { x: 100, y: 100, width: 60, height: 25 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      label: {
        content: "Label Text",
        styles: { padding: "0.25rem 0.5rem", backgroundColor: "var(--color-muted)", color: "var(--color-foreground)", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: "500" },
        responsiveStyles: { desktop: { fontSize: "0.75rem" }, tablet: { fontSize: "0.7rem" }, mobile: { fontSize: "0.65rem" } },
        position: { x: 100, y: 100, width: 80, height: 25 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      // File & Media Components
      "file-upload": {
        content: "Choose File",
        styles: { padding: "0.75rem", border: "2px dashed var(--color-border)", borderRadius: "0.5rem", backgroundColor: "var(--color-background)", color: "var(--color-foreground)", fontSize: "0.875rem", textAlign: "center", cursor: "pointer" },
        responsiveStyles: { desktop: { padding: "0.75rem", fontSize: "0.875rem" }, tablet: { padding: "0.65rem", fontSize: "0.8rem" }, mobile: { padding: "0.6rem", fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 80 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      "file-download": {
        content: "Download File",
        styles: { padding: "0.75rem", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", borderRadius: "0.5rem", fontSize: "0.875rem", textAlign: "center", cursor: "pointer" },
        responsiveStyles: { desktop: { padding: "0.75rem", fontSize: "0.875rem" }, tablet: { padding: "0.65rem", fontSize: "0.8rem" }, mobile: { padding: "0.6rem", fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 150, height: 50 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      "pdf-viewer": {
        content: "PDF Document",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      document: {
        content: "Document Viewer",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 250, height: 150 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      folder: {
        content: "Folder Name",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 150, height: 100 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      "image-gallery": {
        content: "Image Gallery",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "video-gallery": {
        content: "Video Gallery",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "media-player": {
        content: "Media Player",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      // Navigation & Menu Components
      menu: {
        content: "Dropdown Menu",
        styles: { padding: "0.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.375rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 150, height: 40 },
        animations: { type: "slideIn", duration: 300, delay: 0, direction: "down" },
      },
      "tab-nav": {
        content: "Tab Navigation",
        styles: { padding: "0.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.375rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "flex", gap: "0.5rem" },
        responsiveStyles: { desktop: { padding: "0.5rem" }, tablet: { padding: "0.4rem" }, mobile: { padding: "0.3rem" } },
        position: { x: 100, y: 100, width: 300, height: 50 },
        animations: { type: "slideIn", duration: 400, delay: 100, direction: "up" },
      },
      "side-menu": {
        content: "Side Menu",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", width: "200px" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 300 },
        animations: { type: "slideIn", duration: 500, delay: 100, direction: "left" },
      },
      "mobile-menu": {
        content: "Mobile Menu",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "flex", flexDirection: "column", gap: "0.5rem" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 250, height: 200 },
        animations: { type: "slideIn", duration: 500, delay: 100, direction: "down" },
      },
      "back-button": {
        content: "← Back",
        styles: { padding: "0.5rem 1rem", backgroundColor: "var(--color-muted)", color: "var(--color-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", cursor: "pointer" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 80, height: 35 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      "home-button": {
        content: "🏠 Home",
        styles: { padding: "0.5rem 1rem", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", cursor: "pointer" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 80, height: 35 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      // Feedback & Status Components
      loading: {
        content: "Loading...",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", textAlign: "center", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 120, height: 80 },
        animations: { type: "pulse", duration: 1000, delay: 0 },
      },
      "progress-ring": {
        content: "75%",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "50%", border: "1px solid var(--color-border)", textAlign: "center", color: "var(--color-foreground)", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 80, height: 80 },
        animations: { type: "pulse", duration: 2000, delay: 0 },
      },
      "status-badge": {
        content: "Active",
        styles: { padding: "0.25rem 0.75rem", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "500" },
        responsiveStyles: { desktop: { fontSize: "0.75rem" }, tablet: { fontSize: "0.7rem" }, mobile: { fontSize: "0.65rem" } },
        position: { x: 100, y: 100, width: 60, height: 25 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      notification: {
        content: "🔔 3",
        styles: { padding: "0.25rem 0.5rem", backgroundColor: "var(--color-destructive)", color: "var(--color-destructive-foreground)", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "500", textAlign: "center" },
        responsiveStyles: { desktop: { fontSize: "0.75rem" }, tablet: { fontSize: "0.7rem" }, mobile: { fontSize: "0.65rem" } },
        position: { x: 100, y: 100, width: 40, height: 25 },
        animations: { type: "shake", duration: 500, delay: 0 },
      },
      "alert-banner": {
        content: "Important Notice",
        styles: { padding: "0.75rem", backgroundColor: "var(--color-destructive)", color: "var(--color-destructive-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 50 },
        animations: { type: "shake", duration: 500, delay: 0 },
      },
      "success-message": {
        content: "✅ Success!",
        styles: { padding: "0.75rem", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 150, height: 50 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      "error-message": {
        content: "❌ Error!",
        styles: { padding: "0.75rem", backgroundColor: "var(--color-destructive)", color: "var(--color-destructive-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 120, height: 50 },
        animations: { type: "shake", duration: 500, delay: 0 },
      },
      "warning-message": {
        content: "⚠️ Warning!",
        styles: { padding: "0.75rem", backgroundColor: "var(--color-secondary)", color: "var(--color-secondary-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 130, height: 50 },
        animations: { type: "shake", duration: 500, delay: 0 },
      },
      // Utility & Tools Components
      divider: {
        content: "",
        styles: { height: "1px", backgroundColor: "var(--color-border)", width: "100%" },
        responsiveStyles: { desktop: {}, tablet: {}, mobile: {} },
        position: { x: 100, y: 100, width: 200, height: 1 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      spacer: {
        content: "",
        styles: { backgroundColor: "transparent", width: "100%", height: "2rem" },
        responsiveStyles: { desktop: { height: "2rem" }, tablet: { height: "1.5rem" }, mobile: { height: "1rem" } },
        position: { x: 100, y: 100, width: 200, height: 32 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      container: {
        content: "Container",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      wrapper: {
        content: "Wrapper",
        styles: { padding: "0.5rem", backgroundColor: "var(--color-muted)", borderRadius: "0.375rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "0.5rem" }, tablet: { padding: "0.4rem" }, mobile: { padding: "0.3rem" } },
        position: { x: 100, y: 100, width: 250, height: 100 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      flexbox: {
        content: "Flex Container",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "flex", gap: "0.5rem", alignItems: "center" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 100 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      "grid-container": {
        content: "Grid Container",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      center: {
        content: "Centered Content",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 100 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      stack: {
        content: "Stack Container",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", display: "flex", flexDirection: "column", gap: "0.5rem" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 150 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      // Business & Marketing Components
      "pricing-table": {
        content: "Pricing Plans",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "feature-list": {
        content: "Feature Highlights",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      faq: {
        content: "FAQ Section",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "blog-post": {
        content: "Blog Article",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 250 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "case-study": {
        content: "Case Study",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      cta: {
        content: "Call to Action",
        styles: { padding: "2rem", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", borderRadius: "0.75rem", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "2rem" }, tablet: { padding: "1.5rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 150 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      hero: {
        content: "Hero Section",
        styles: { padding: "3rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "3rem" }, tablet: { padding: "2rem" }, mobile: { padding: "1.5rem" } },
        position: { x: 100, y: 100, width: 400, height: 300 },
        animations: { type: "fadeIn", duration: 800, delay: 200 },
      },
      about: {
        content: "About Us",
        styles: { padding: "2rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "2rem" }, tablet: { padding: "1.5rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 350, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      // Forms & Validation Components
      "contact-form": {
        content: "Contact Us Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 250 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "newsletter-signup": {
        content: "Newsletter Signup",
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 250, height: 120 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      "login-form": {
        content: "Login Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 250, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "registration-form": {
        content: "Registration Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 300 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "survey-form": {
        content: "Survey Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 250 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "order-form": {
        content: "Order Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "booking-form": {
        content: "Booking Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 250 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "feedback-form": {
        content: "Feedback Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
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

    // Build the element and ensure required fields like `type` are present
    const element: BuilderElement = {
      id,
      type: type as BuilderElement["type"],
      content: elementTemplates[type]?.content as string || "New Element",
      styles: elementTemplates[type]?.styles || {},
      responsiveStyles: elementTemplates[type]?.responsiveStyles || {},
      position: elementTemplates[type]?.position || { x: 100, y: 100, width: 200, height: 50 },
      animations: (elementTemplates[type] as any)?.animations,
    }
    return element
  }

  const getElementStyles = (element: BuilderElement): Record<string, any> => {
    const baseStyles = element.styles || {}
    const responsiveStyles = element.responsiveStyles?.[currentBreakpoint] || {}
    
    // Only apply auto-scaling if enabled
    if (element.props?.autoScale === false) {
      return { ...baseStyles, ...responsiveStyles }
    }
    
    // Calculate scale factor for auto-scaling content
    const originalPosition = element.position || { x: 0, y: 0, width: 200, height: 50 }
    const currentPosition = {
      width: transientRef.current.get(element.id)?.width ?? originalPosition.width,
      height: transientRef.current.get(element.id)?.height ?? originalPosition.height,
    }
    
    const scaleX = (currentPosition.width || 200) / (originalPosition.width || 200)
    const scaleY = (currentPosition.height || 50) / (originalPosition.height || 50)
    
    // Apply scaling to font sizes and other scalable properties
    const scaledStyles: Record<string, any> = {}
    
    Object.entries({ ...baseStyles, ...responsiveStyles }).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('px')) {
        const numericValue = parseFloat(value)
        if (!isNaN(numericValue)) {
          // Scale font sizes, padding, margins, etc.
          if (key.includes('fontSize') || key.includes('padding') || key.includes('margin') || 
              key.includes('borderRadius') || key.includes('gap') || key.includes('lineHeight')) {
            scaledStyles[key] = `${numericValue * Math.min(scaleX, scaleY)}px`
          }
          // Scale width/height properties
          else if (key.includes('width') || key.includes('height')) {
            if (key.includes('width')) {
              scaledStyles[key] = `${numericValue * scaleX}px`
            } else {
              scaledStyles[key] = `${numericValue * scaleY}px`
            }
          }
          else {
            scaledStyles[key] = value
          }
        } else {
          scaledStyles[key] = value
        }
      } else {
        scaledStyles[key] = value
      }
    })
    
    return scaledStyles
  }

  const getFormInputStyles = (element: BuilderElement) => {
    const baseStyles = {
      padding: element.props?.inputPadding || '8px 12px',
      fontSize: element.props?.inputFontSize || '12px',
      borderRadius: element.props?.inputBorderRadius || '4px',
      borderColor: element.props?.inputBorderColor || '#374151',
      backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
    }
    
    // Only apply scaling if autoScale is enabled
    if (element.props?.autoScale === false) {
      return baseStyles
    }
    
    const originalPosition = element.position || { x: 0, y: 0, width: 200, height: 50 }
    const currentPosition = {
      width: transientRef.current.get(element.id)?.width ?? originalPosition.width,
      height: transientRef.current.get(element.id)?.height ?? originalPosition.height,
    }
    
    const scaleX = (currentPosition.width || 200) / (originalPosition.width || 200)
    const scaleY = (currentPosition.height || 50) / (originalPosition.height || 50)
    const scale = Math.min(scaleX, scaleY)
    
    return {
      ...baseStyles,
      fontSize: `${(parseFloat(element.props?.inputFontSize) || 12) * scale}px`,
      borderRadius: `${(parseFloat(element.props?.inputBorderRadius) || 4) * scale}px`,
    }
  }

  const getFormButtonStyles = (element: BuilderElement) => {
    const baseStyles = {
      padding: element.props?.buttonPadding || '8px 12px',
      fontSize: element.props?.buttonFontSize || '12px',
      borderRadius: element.props?.buttonBorderRadius || '4px',
      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
      color: element.props?.buttonTextColor || '#ffffff',
      border: 'none',
      cursor: 'pointer'
    }
    
    // Only apply scaling if autoScale is enabled
    if (element.props?.autoScale === false) {
      return baseStyles
    }
    
    const originalPosition = element.position || { x: 0, y: 0, width: 200, height: 50 }
    const currentPosition = {
      width: transientRef.current.get(element.id)?.width ?? originalPosition.width,
      height: transientRef.current.get(element.id)?.height ?? originalPosition.height,
    }
    
    const scaleX = (currentPosition.width || 200) / (originalPosition.width || 200)
    const scaleY = (currentPosition.height || 50) / (originalPosition.height || 50)
    const scale = Math.min(scaleX, scaleY)
    
    return {
      ...baseStyles,
      fontSize: `${(parseFloat(element.props?.buttonFontSize) || 12) * scale}px`,
      borderRadius: `${(parseFloat(element.props?.buttonBorderRadius) || 4) * scale}px`,
    }
  }

  // overlay uses `isOver` directly

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.button !== 0) return // Only left click

    const element = elements.find((el) => el.id === elementId)
    if (!element?.position) return

    e.preventDefault()
    e.stopPropagation()

    if (!canvasEl) return
    const rect = canvasEl.getBoundingClientRect()
    const scale = zoom / 100
    const startX = (e.clientX - rect.left) / scale
    const startY = (e.clientY - rect.top) / scale
    // Determine which elements are affected (multi-select drag support)
    const idsToDrag = selectedElements.includes(elementId) && selectedElements.length > 1
      ? selectedElements
      : [elementId]

    // Build start positions per element for delta-based movement
    const startPositions = new Map<string, { x: number; y: number }>()
    for (const id of idsToDrag) {
      const el = elements.find((x) => x.id === id)
      if (el?.position) startPositions.set(id, { x: el.position.x, y: el.position.y })
    }

    dragGroupRef.current = {
      ids: idsToDrag,
      startPositions,
      mouseStart: { x: startX, y: startY },
    }

    setDraggedElementId(elementId)

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasEl) return
      const rect = canvasEl.getBoundingClientRect()
      const scale = zoom / 100
      const localX = (e.clientX - rect.left) / scale
      const localY = (e.clientY - rect.top) / scale
      const group = dragGroupRef.current
      if (!group) return
      const dx = localX - group.mouseStart.x
      const dy = localY - group.mouseStart.y

      for (const id of group.ids) {
        const start = group.startPositions.get(id)
        if (!start) continue
        const newX = start.x + dx
        const newY = start.y + dy
        const snappedX = snapSettings.enabled ? snapToGrid(newX, snapSettings.gridSize) : newX
        const snappedY = snapSettings.enabled ? snapToGrid(newY, snapSettings.gridSize) : newY
        const prev = transientRef.current.get(id) || {}
        transientRef.current.set(id, { ...prev, x: Math.max(0, snappedX), y: Math.max(0, snappedY) })
      }
      scheduleRerender()
    }

    const handleMouseUp = () => {
      // Commit final position(s) once
      const group = dragGroupRef.current
      if (group) {
        for (const id of group.ids) {
          const start = group.startPositions.get(id)
          const last = transientRef.current.get(id)
          if (start && (last?.x != null || last?.y != null)) {
            onUpdateElementPosition(id, {
              x: last?.x ?? start.x,
              y: last?.y ?? start.y,
            })
          }
          transientRef.current.delete(id)
        }
      }
      dragGroupRef.current = null
      setDraggedElementId(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Resizing support for all Elements
  const RESIZABLE_TYPES = new Set([
    // Basic Elements
    "heading",
    "paragraph",
    "image",
    "button",
    "card",
    "quote",
    "separator",
    "list",
    // Layout
    "section",
    "grid",
    "navigation",
    "footer",
    "header",
    "sidebar",
    // Forms & Inputs
    "form",
    "input",
    "textarea",
    "select",
    "checkbox",
    "radio",
    "switch",
    // Media & Icons
    "video",
    "audio",
    "gallery",
    "icon",
    "badge",
    "avatar",
    // Interactive
    "modal",
    "tooltip",
    "dropdown",
    "tabs",
    "accordion",
    "carousel",
    // Data Display
    "table",
    "chart",
    "progress",
    "timeline",
    "stats",
    "counter",
    // E-commerce
    "product-card",
    "price",
    "rating",
    "cart",
    "checkout",
    // Social & Contact
    "social-links",
    "contact-info",
    "map",
    "newsletter",
    "team",
    "testimonial",
    // Advanced UI
    "calendar",
    "search-bar",
    "filter",
    "breadcrumb",
    "pagination",
    "spinner",
    "skeleton",
    "alert",
    "toast",
    "drawer",
    // Content & Text
    "code-block",
    "markdown",
    "rich-text",
    "typography",
    "link",
    "tag",
    "label",
    // File & Media
    "file-upload",
    "file-download",
    "pdf-viewer",
    "document",
    "folder",
    "image-gallery",
    "video-gallery",
    "media-player",
    // Navigation & Menu
    "menu",
    "tab-nav",
    "side-menu",
    "mobile-menu",
    "back-button",
    "home-button",
    // Feedback & Status
    "loading",
    "progress-ring",
    "status-badge",
    "notification",
    "alert-banner",
    "success-message",
    "error-message",
    "warning-message",
    // Utility & Tools
    "divider",
    "spacer",
    "container",
    "wrapper",
    "flexbox",
    "grid-container",
    "center",
    "stack",
    // Business & Marketing
    "pricing-table",
    "feature-list",
    "faq",
    "blog-post",
    "case-study",
    "cta",
    "hero",
    "about",
    // Forms & Validation
    "contact-form",
    "newsletter-signup",
    "login-form",
    "registration-form",
    "survey-form",
    "order-form",
    "booking-form",
    "feedback-form",
  ])

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    elementId: string,
    direction: "e" | "s" | "se" | "n" | "w" | "ne" | "nw" | "sw"
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const element = elements.find((el) => el.id === elementId)
    if (!element?.position) return
    setIsResizing(elementId)

    const startPos = { ...element.position }
    if (!canvasEl) return
    const rect = canvasEl.getBoundingClientRect()
    const scale = zoom / 100

    const onMouseMove = (ev: MouseEvent) => {
      const localX = (ev.clientX - rect.left) / scale
      const localY = (ev.clientY - rect.top) / scale
      let nextWidth = startPos.width || 0
      let nextHeight = startPos.height || 0
      let nextX = startPos.x
      let nextY = startPos.y
      const isE = direction === "e" || direction === "se" || direction === "ne"
      const isS = direction === "s" || direction === "se" || direction === "sw"
      const isW = direction === "w" || direction === "sw" || direction === "nw"
      const isN = direction === "n" || direction === "ne" || direction === "nw"

      if (isE) {
        nextWidth = Math.max(20, localX - startPos.x)
      }
      if (isS) {
        nextHeight = Math.max(20, localY - startPos.y)
      }
      if (isW) {
        const rawW = Math.max(20, startPos.x + (startPos.width || 0) - localX)
        const snappedW = snapSettings.enabled && startPos.width !== undefined
          ? snapToGrid(rawW, snapSettings.gridSize)
          : rawW
        nextWidth = snappedW
        nextX = startPos.x + (startPos.width! - snappedW)
      }
      if (isN) {
        const rawH = Math.max(20, startPos.y + (startPos.height || 0) - localY)
        const snappedH = snapSettings.enabled && startPos.height !== undefined
          ? snapToGrid(rawH, snapSettings.gridSize)
          : rawH
        nextHeight = snappedH
        nextY = startPos.y + (startPos.height! - snappedH)
      }
      const snappedW = snapSettings.enabled && startPos.width !== undefined
        ? snapToGrid(nextWidth, snapSettings.gridSize)
        : nextWidth
      const snappedH = snapSettings.enabled && startPos.height !== undefined
        ? snapToGrid(nextHeight, snapSettings.gridSize)
        : nextHeight
      // Update transient size/position and render on next animation frame (no global commit yet)
      const prev = transientRef.current.get(elementId) || {}
      const payload: any = { width: snappedW, height: snappedH }
      if (isW) payload.x = Math.max(0, nextX)
      if (isN) payload.y = Math.max(0, nextY)
      transientRef.current.set(elementId, { ...prev, ...payload })
      scheduleRerender()
    }

    const onMouseUp = () => {
      setIsResizing(null)
      // Commit final size/position once
      const last = transientRef.current.get(elementId)
      if (last?.width != null || last?.height != null || last?.x != null || last?.y != null) {
        onUpdateElementPosition(elementId, {
          x: last?.x ?? startPos.x,
          y: last?.y ?? startPos.y,
          width: last?.width ?? startPos.width,
          height: last?.height ?? startPos.height,
        })
      }
      transientRef.current.delete(elementId)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    const isMultiSelect = e.ctrlKey || e.metaKey
    onElementSelect(elementId, isMultiSelect)
  }

  const handleCanvasClick = () => {
    onElementSelect("")
    setFocusedRegion(null)
    setFocusedSectionIndex(null)
  }

  // Resize partitions by dragging top/bottom boundaries
  const boundaryDragRef = useRef<{
    which: "header" | "footer"
    startY: number
    startHeader: number
    startFooter: number
    scale: number
    canvasHeight: number
  } | null>(null)

  const startBoundaryResize = useCallback((which: "header" | "footer", clientY: number) => {
    if (!canvasEl) return
    const rect = canvasEl.getBoundingClientRect()
    const scale = zoom / 100
    boundaryDragRef.current = {
      which,
      startY: clientY,
      startHeader: headerHeight,
      startFooter: footerHeight,
      scale,
      canvasHeight: Math.max(contentHeight, rect.height / scale),
    }

    const onMouseMove = (ev: MouseEvent) => {
      const state = boundaryDragRef.current
      if (!state) return
      const dy = (ev.clientY - state.startY) / state.scale
      if (state.which === "header") {
        // Move boundary between header and section
        let nextHeader = state.startHeader + dy
        const maxHeader = state.canvasHeight - state.startFooter - Math.max(MIN_SECTION, totalSectionsHeight)
        nextHeader = Math.max(MIN_HEADER, Math.min(maxHeader, nextHeader))
        setHeaderHeight(nextHeader)
      } else {
        // Move boundary (top of footer); positive dy moves boundary down -> footer shrinks
        let nextFooter = state.startFooter - dy
        const maxFooter = state.canvasHeight - headerHeight - Math.max(MIN_SECTION, totalSectionsHeight)
        nextFooter = Math.max(MIN_FOOTER, Math.min(maxFooter, nextFooter))
        setFooterHeight(nextFooter)
      }
    }
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      boundaryDragRef.current = null
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [canvasEl, zoom, headerHeight, footerHeight, contentHeight, totalSectionsHeight])

  // Resize between sections by dragging a divider line (index is boundary between index and index+1)
  const sectionDividerDragRef = useRef<{
    index: number
    startY: number
    scale: number
    startTop: number
    startBottom: number
  } | null>(null)
  const startSectionDividerResize = useCallback((index: number, clientY: number) => {
    const scale = zoom / 100
    sectionDividerDragRef.current = {
      index,
      startY: clientY,
      scale,
      startTop: sections[index].height,
      startBottom: sections[index + 1].height,
    }
    const onMouseMove = (ev: MouseEvent) => {
      const st = sectionDividerDragRef.current
      if (!st) return
      const dy = (ev.clientY - st.startY) / st.scale
      setSections((prev) => {
        const next = [...prev]
        const topH = Math.max(MIN_SECTION, st.startTop + dy)
        const bottomH = Math.max(MIN_SECTION, st.startBottom - dy)
        next[st.index] = { ...next[st.index], height: topH }
        next[st.index + 1] = { ...next[st.index + 1], height: bottomH }
        return next
      })
    }
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      sectionDividerDragRef.current = null
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [sections, zoom])

  const renderElement = (element: BuilderElement) => {
    const isSelected = selectedElements.includes(element.id)
    const elementStyles = getElementStyles(element)
    const position = element.position || { x: 0, y: 0, width: 200, height: 50 }
    const transient = transientRef.current.get(element.id)

    // Use transform for dragging (GPU-accelerated) and direct width/height for resizing
    const dx = transient?.x != null ? (transient.x - position.x) : 0
    const dy = transient?.y != null ? (transient.y - position.y) : 0
    const finalWidth = transient?.width != null ? transient.width : position.width
    const finalHeight = transient?.height != null ? transient.height : position.height

    const isActiveMove = draggedElementId === element.id
    const isActiveResize = isResizing === element.id

    return (
      <div
        key={element.id}
        className={`
          absolute cursor-pointer rounded-md group
          ${isActiveMove || isActiveResize ? "transition-none" : "transition-all duration-200"}
          ${isSelected ? "ring-2 ring-primary bg-primary/20" : "hover:bg-primary/10"}
          ${isActiveMove ? "z-50" : "z-10"}
        `}
        style={{
          left: position.x,
          top: position.y,
          width: finalWidth,
          height: finalHeight,
          transform: dx !== 0 || dy !== 0 ? `translate(${dx}px, ${dy}px)` : undefined,
          willChange: dx !== 0 || dy !== 0 ? "transform" : isActiveResize ? "width, height" : undefined,
        }}
        onClick={(e) => handleElementClick(e, element.id)}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
      >
        {/* Element content */}
        <div 
          className="w-full h-full overflow-hidden"
          style={{
            padding: NO_PADDING_COMPONENTS.has(element.type) ? 0 : '0.5rem'
          }}
        >
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
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `rotate(${element.props?.rotation || 0}deg)`,
              }}
            >
              <img
                src={element.content || "/placeholder.svg"}
                alt="Element"
                className="max-w-full max-h-full object-contain"
                style={elementStyles}
              />
            </div>
          )}
          {element.type === "button" && (
            <button className="text-card-foreground w-full h-full hover:opacity-90 transition-opacity" style={elementStyles}>
              {element.content}
            </button>
          )}
          {element.type === "section" && (
            <div className="text-card-foreground w-full h-full" style={elementStyles}>
              {element.content}
            </div>
          )}
          {element.type === "card" && (
            <div className="text-card-foreground w-full h-full" style={elementStyles}>
              <h3 
                className="mb-2"
                style={{
                  fontSize: element.props?.titleFontSize || "1.125rem",
                  fontWeight: element.props?.titleFontWeight || "600",
                  textAlign: element.props?.titleTextAlign || "left",
                  fontFamily: element.props?.fontFamily || "inherit",
                }}
              >
                {element.props?.title || "Card Title"}
              </h3>
              <p 
                className="text-sm text-muted-foreground"
                style={{
                  fontSize: element.props?.descriptionFontSize || "0.875rem",
                  fontWeight: element.props?.descriptionFontWeight || "400",
                  textAlign: element.props?.descriptionTextAlign || "left",
                  fontFamily: element.props?.fontFamily || "inherit",
                }}
              >
                {element.props?.description || element.content}
              </p>
              {element.props?.buttonText && (
                <button 
                  className="mt-3 px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:opacity-90"
                  style={{
                    fontSize: element.props?.buttonFontSize || "0.75rem",
                    fontWeight: element.props?.buttonFontWeight || "500",
                    fontFamily: element.props?.fontFamily || "inherit",
                  }}
                >
                  {element.props.buttonText}
                </button>
              )}
            </div>
          )}
          {element.type === "quote" && (
            <div className="text-card-foreground w-full h-full" style={elementStyles}>
              <p 
                className="text-sm italic mb-2"
                style={{
                  fontSize: element.props?.fontSize || "0.875rem",
                  fontWeight: element.props?.fontWeight || "400",
                  textAlign: element.props?.textAlign || "left",
                  fontFamily: element.props?.fontFamily || "inherit",
                  fontStyle: element.props?.fontStyle || "italic",
                }}
              >
                "{element.content}"
              </p>
              {element.props?.author && (
                <p 
                  className="text-xs text-muted-foreground"
                  style={{
                    fontSize: element.props?.authorFontSize || "12px",
                    fontWeight: element.props?.authorFontWeight || "400",
                    textAlign: element.props?.textAlign || "left",
                    fontFamily: element.props?.fontFamily || "inherit",
                  }}
                >
                  — {element.props.author} —
                </p>
              )}
            </div>
          )}
          {element.type === "separator" && (
            <div 
              className="w-full flex items-center justify-center" 
              style={{
                ...elementStyles,
                height: element.props?.orientation === "vertical" ? "100%" : element.props?.thickness || "2px",
                minHeight: element.props?.orientation === "vertical" ? "100%" : element.props?.thickness || "2px",
              }}
            >
              <div 
                className="bg-gray-500"
                style={{
                  height: element.props?.orientation === "vertical" ? "100%" : element.props?.thickness || "2px",
                  width: element.props?.orientation === "vertical" ? element.props?.thickness || "2px" : "100%",
                  borderStyle: element.props?.separatorStyle || "solid",
                  borderWidth: element.props?.separatorStyle !== "solid" ? "1px" : "0",
                  borderColor: element.props?.separatorStyle !== "solid" ? "currentColor" : "transparent",
                  backgroundColor: element.styles?.backgroundColor || "#6b7280",
                  minHeight: "2px",
                  minWidth: "2px",
                }}
              ></div>
            </div>
          )}
    {element.type === "list" && (
      <div className="text-card-foreground w-full h-full" style={elementStyles}>
        {element.props?.title && (
          <h3 
            className="mb-3"
            style={{
              fontSize: element.props?.titleFontSize || "1.125rem",
              fontWeight: element.props?.titleFontWeight || "600",
              textAlign: element.props?.titleTextAlign || "left",
              fontFamily: element.props?.fontFamily || "inherit",
              fontStyle: element.props?.titleFontStyle || "normal",
            }}
          >
            {element.props.title}
          </h3>
        )}
        {element.props?.listType === "ol" ? (
          <ol 
            className="space-y-1"
            style={{
              fontFamily: element.props?.fontFamily || "inherit",
              fontSize: element.props?.itemsFontSize || "0.875rem",
              fontWeight: element.props?.itemsFontWeight || "400",
              fontStyle: element.props?.itemsFontStyle || "normal",
              textAlign: element.props?.itemsTextAlign || "left",
            }}
          >
            {(element.props?.listItems || element.content.split('\n')).map((item: string, index: number) => (
              <li key={index} className="flex items-center">
                <span className="mr-2 font-medium">{index + 1}.</span>
                {item.replace('• ', '')}
              </li>
            ))}
          </ol>
        ) : (
          <ul 
            className="space-y-1"
            style={{
              fontFamily: element.props?.fontFamily || "inherit",
              fontSize: element.props?.itemsFontSize || "0.875rem",
              fontWeight: element.props?.itemsFontWeight || "400",
              fontStyle: element.props?.itemsFontStyle || "normal",
              textAlign: element.props?.itemsTextAlign || "left",
            }}
          >
            {(element.props?.listItems || element.content.split('\n')).map((item: string, index: number) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                {item.replace('• ', '')}
              </li>
            ))}
          </ul>
        )}
      </div>
    )}
    {element.type === "input" && (
      <input
        type="text"
        placeholder={element.content}
        className="w-full h-full bg-background text-foreground border border-border rounded-md px-3 py-2"
        style={elementStyles}
      />
    )}
    {element.type === "textarea" && (
      <textarea
        placeholder={element.content}
        className="w-full h-full bg-background text-foreground border border-border rounded-md px-3 py-2 resize-none"
        style={elementStyles}
      />
    )}
    {element.type === "select" && (
      <select className="w-full h-full bg-background text-foreground border border-border rounded-md px-3 py-2" style={elementStyles}>
        <option>{element.content}</option>
        <option>Option 1</option>
        <option>Option 2</option>
        <option>Option 3</option>
      </select>
    )}
    {element.type === "checkbox" && (
      <div className="text-card-foreground w-full h-full flex items-center gap-2" style={elementStyles}>
        <input type="checkbox" className="w-4 h-4" />
        <span className="text-sm">{element.content}</span>
      </div>
    )}
    {element.type === "radio" && (
      <div className="text-card-foreground w-full h-full flex items-center gap-2" style={elementStyles}>
        <input type="radio" name="radio-group" className="w-4 h-4" />
        <span className="text-sm">{element.content}</span>
      </div>
    )}
    {element.type === "switch" && (
      <div className="text-card-foreground w-full h-full flex items-center gap-2" style={elementStyles}>
        <div className="w-10 h-6 bg-muted rounded-full relative">
          <div className="w-4 h-4 bg-primary rounded-full absolute top-1 left-1 transition-transform"></div>
        </div>
        <span className="text-sm">{element.content}</span>
      </div>
    )}
    {element.type === "video" && (
      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center overflow-hidden relative" style={elementStyles}>
        {(() => {
          const videoUrl = element.content || ''
          
          // Check for YouTube URL (supports all formats including short links with ?si parameter)
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
          const youtubeMatch = videoUrl.match(youtubeRegex)
          
          // Check for Vimeo URL
          const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/
          const vimeoMatch = videoUrl.match(vimeoRegex)
          
          // Check for Facebook video URL
          const facebookRegex = /facebook\.com\/.*\/videos\/(\d+)|fb\.watch\/([a-zA-Z0-9_-]+)/
          const facebookMatch = videoUrl.match(facebookRegex)
          
          if (youtubeMatch) {
            // Render YouTube embed
            const videoId = youtubeMatch[1]
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${element.props?.autoplay ? 1 : 0}&controls=${element.props?.controls !== false ? 1 : 0}&loop=${element.props?.loop ? 1 : 0}${element.props?.loop ? `&playlist=${videoId}` : ''}&rel=0`
            
            return (
              <>
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  style={{ border: 'none', borderRadius: 'inherit' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  title="YouTube video player"
                />
                {/* Overlay to prevent iframe interaction in edit mode */}
                {!isPreviewMode && (
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementSelect(element.id)
                    }}
                  />
                )}
              </>
            )
          } else if (vimeoMatch) {
            // Render Vimeo embed
            const videoId = vimeoMatch[1]
            return (
              <>
                <iframe
                  src={`https://player.vimeo.com/video/${videoId}?autoplay=${element.props?.autoplay ? 1 : 0}&loop=${element.props?.loop ? 1 : 0}`}
                  className="w-full h-full"
                  style={{ border: 'none', borderRadius: 'inherit' }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Vimeo video player"
                />
                {/* Overlay to prevent iframe interaction in edit mode */}
                {!isPreviewMode && (
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementSelect(element.id)
                    }}
                  />
                )}
              </>
            )
          } else if (facebookMatch) {
            // Render Facebook embed
            return (
              <>
                <iframe
                  src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&autoplay=${element.props?.autoplay ? 'true' : 'false'}`}
                  className="w-full h-full"
                  style={{ border: 'none', borderRadius: 'inherit' }}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  title="Facebook video player"
                />
                {/* Overlay to prevent iframe interaction in edit mode */}
                {!isPreviewMode && (
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementSelect(element.id)
                    }}
                  />
                )}
              </>
            )
          } else if (videoUrl.startsWith('blob:')) {
            // Show uploaded video file
            return (
              <>
                <video
                  src={videoUrl}
                  controls={element.props?.controls !== false}
                  autoPlay={element.props?.autoplay || false}
                  loop={element.props?.loop || false}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 'inherit' }}
                >
                  Your browser does not support the video tag.
                </video>
                {/* Overlay to prevent video interaction in edit mode */}
                {!isPreviewMode && (
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementSelect(element.id)
                    }}
                  />
                )}
              </>
            )
          } else if (videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))) {
            // Show direct video URL (.mp4, .webm, etc.)
            return (
              <>
                <video
                  src={videoUrl}
                  controls={element.props?.controls !== false}
                  autoPlay={element.props?.autoplay || false}
                  loop={element.props?.loop || false}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 'inherit' }}
                >
                  Your browser does not support the video tag.
                </video>
                {/* Overlay to prevent video interaction in edit mode */}
                {!isPreviewMode && (
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementSelect(element.id)
                    }}
                  />
                )}
              </>
            )
          } else {
            // Show placeholder if no video
            return (
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-sm">Video Player</p>
              </div>
            )
          }
        })()}
      </div>
    )}
    {element.type === "audio" && (
      <div 
        className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" 
        style={{
          ...elementStyles,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
        }}
      >
        {element.content ? (
          <audio
            src={element.content}
            controls={element.props?.controls !== false}
            autoPlay={element.props?.autoplay || false}
            muted={element.props?.muted || false}
            loop={element.props?.loop || false}
            className="w-full"
            style={{ 
              maxWidth: '100%',
              outline: 'none',
            }}
          />
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Audio Player</p>
            <p className="text-xs text-muted-foreground mt-1">Upload audio in properties</p>
          </div>
        )}
      </div>
    )}
    {element.type === "gallery" && (
      <div className="w-full h-full bg-card border border-border rounded-lg p-3 overflow-auto" style={elementStyles}>
        {element.props?.images && element.props.images.length > 0 ? (
          <div 
            className={element.props?.layout === 'row' ? 'flex gap-2 h-full overflow-x-auto' : 'grid gap-2'}
            style={element.props?.layout === 'row' ? {} : { 
              gridTemplateColumns: `repeat(${element.props?.columns || 3}, 1fr)`,
            }}
          >
            {element.props.images.map((imageUrl: string, index: number) => (
              <div 
                key={index}
                className={`relative bg-muted rounded overflow-hidden ${element.props?.layout === 'row' ? 'flex-shrink-0 h-full' : 'w-full'}`}
                style={element.props?.layout === 'row' 
                  ? { aspectRatio: '1/1' } 
                  : { paddingBottom: '100%', position: 'relative' }
                }
              >
                <img 
                  src={imageUrl} 
                  alt={element.props?.imageNames?.[index] || `Image ${index + 1}`}
                  className={element.props?.layout === 'row' 
                    ? 'w-full h-full object-cover' 
                    : 'absolute inset-0 w-full h-full object-cover'
                  }
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{element.content || 'Image Gallery'}</p>
            <p className="text-xs text-muted-foreground mt-1">Upload images in properties</p>
          </div>
        )}
      </div>
    )}
    {element.type === "icon" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        {element.props?.iconImage ? (
          <img 
            src={element.props.iconImage} 
            alt={element.props?.iconFileName || 'Icon'}
            style={{ 
              pointerEvents: 'none',
              width: `${element.props?.size || 24}px`,
              height: `${element.props?.size || 24}px`,
              objectFit: 'contain'
            }}
          />
        ) : (
          <span style={{ fontSize: `${element.props?.size || 24}px` }}>
            {element.content}
          </span>
        )}
      </div>
    )}
    {element.type === "badge" && (
      <div 
        className="w-full h-full flex items-center justify-center" 
        style={{
          ...elementStyles,
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontFamily: elementStyles.fontFamily,
          fontSize: elementStyles.fontSize,
          fontWeight: elementStyles.fontWeight,
          ...(element.props?.variant === 'default' && {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }),
          ...(element.props?.variant === 'secondary' && {
            backgroundColor: 'var(--color-secondary)',
            color: 'var(--color-secondary-foreground)',
          }),
          ...(element.props?.variant === 'destructive' && {
            backgroundColor: 'var(--color-destructive)',
            color: 'var(--color-destructive-foreground)',
          }),
          ...(element.props?.variant === 'outline' && {
            backgroundColor: 'transparent',
            color: 'var(--color-foreground)',
            border: '1px solid var(--color-border)',
          }),
          ...(!element.props?.variant && {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }),
        }}
      >
        {element.content}
      </div>
    )}
    {element.type === "avatar" && (
      <div 
        className="w-full h-full" 
        style={{
          ...elementStyles,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Override any width/height from elementStyles
          width: '100%',
          height: '100%',
        }}
      >
        {element.props?.src ? (
          <img 
            src={element.props.src} 
            alt={element.content || 'Avatar'}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: '50%',
              backgroundColor: elementStyles.backgroundColor || 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: (() => {
                // Use avatarSize from props, fallback to position height
                const size = element.props?.avatarSize 
                  ? parseInt(element.props.avatarSize) 
                  : (element.position?.height || 60);
                // Icon size is 40% of container
                return `${size * 0.4}px`;
              })(),
              color: elementStyles.color || 'var(--color-foreground)',
            }}
          >
            {element.content || '👤'}
          </div>
        )}
      </div>
    )}
    {element.type === "modal" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg flex items-center justify-center" style={elementStyles}>
        <div className="text-center">
          <h3 className="font-semibold mb-2">Modal</h3>
          <p className="text-sm text-muted-foreground">{element.content}</p>
        </div>
      </div>
    )}
    {element.type === "tooltip" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <span className="text-sm">{element.content}</span>
      </div>
    )}
    {element.type === "dropdown" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex items-center justify-between px-3" style={elementStyles}>
        <span className="text-sm">{element.content}</span>
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    )}
    {element.type === "tabs" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="flex border-b border-border mb-3">
          <div className="px-3 py-2 text-sm font-medium border-b-2 border-primary">Tab 1</div>
          <div className="px-3 py-2 text-sm text-muted-foreground">Tab 2</div>
        </div>
        <p className="text-sm">{element.content}</p>
      </div>
    )}
    {element.type === "accordion" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg" style={elementStyles}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Accordion Item</span>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{element.content}</p>
        </div>
      </div>
    )}
    {element.type === "carousel" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex items-center justify-center" style={elementStyles}>
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm">{element.content}</p>
        </div>
      </div>
    )}
    {element.type === "table" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg overflow-hidden" style={elementStyles}>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Header 1</th>
              <th className="p-2 text-left">Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="p-2">Row 1, Col 1</td>
              <td className="p-2">Row 1, Col 2</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-2">Row 2, Col 1</td>
              <td className="p-2">Row 2, Col 2</td>
            </tr>
          </tbody>
        </table>
      </div>
    )}
    {element.type === "chart" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex items-center justify-center" style={elementStyles}>
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm">{element.content}</p>
        </div>
      </div>
    )}
    {element.type === "progress" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="mb-2">
          <span className="text-sm font-medium">{element.content}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
        </div>
      </div>
    )}
    {element.type === "timeline" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 bg-primary rounded-full mt-1"></div>
          <div>
            <h4 className="text-sm font-medium">Timeline Event</h4>
            <p className="text-xs text-muted-foreground mt-1">{element.content}</p>
          </div>
        </div>
      </div>
    )}
    {element.type === "stats" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg flex flex-col items-center justify-center" style={elementStyles}>
        <div className="text-2xl font-bold text-primary mb-1">1,234</div>
        <div className="text-sm text-muted-foreground">{element.content}</div>
      </div>
    )}
    {element.type === "counter" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <span className="text-3xl font-bold">{element.content}</span>
      </div>
    )}
    {element.type === "product-card" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg overflow-hidden" style={elementStyles}>
        <div className="h-24 bg-muted flex items-center justify-center">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1">{element.content}</h3>
          <p className="text-xs text-muted-foreground mb-2">Product description</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">$99.99</span>
            <button className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Add</button>
          </div>
        </div>
      </div>
    )}
    {element.type === "price" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <span className="text-2xl font-bold">{element.content}</span>
      </div>
    )}
    {element.type === "rating" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <span className="text-lg">{element.content}</span>
      </div>
    )}
    {element.type === "cart" && (
      <button className="w-full h-full bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors" style={elementStyles}>
        {element.content}
      </button>
    )}
    {element.type === "checkout" && (
      <button className="w-full h-full bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors" style={elementStyles}>
        {element.content}
      </button>
    )}
    {element.type === "social-links" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex items-center justify-center" style={elementStyles}>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </div>
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
            </svg>
          </div>
        </div>
      </div>
    )}
    {element.type === "contact-info" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm">+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">info@example.com</span>
          </div>
        </div>
      </div>
    )}
    {element.type === "map" && (
      <div className="text-card-foreground w-full h-full bg-muted border border-border rounded-lg flex items-center justify-center" style={elementStyles}>
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm">{element.content}</p>
        </div>
      </div>
    )}
    {element.type === "newsletter" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="text-center">
          <h3 className="font-semibold text-sm mb-2">Subscribe to Newsletter</h3>
          <p className="text-xs text-muted-foreground mb-3">Get updates delivered to your inbox</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Enter email" className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background" />
            <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">Subscribe</button>
          </div>
        </div>
      </div>
    )}
    {element.type === "team" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg overflow-hidden" style={elementStyles}>
        <div className="h-20 bg-muted flex items-center justify-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <div className="p-3 text-center">
          <h3 className="font-semibold text-sm mb-1">{element.content}</h3>
          <p className="text-xs text-muted-foreground">Team Member</p>
        </div>
      </div>
    )}
    {element.type === "testimonial" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg p-4" style={elementStyles}>
        <div className="text-center">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
          </div>
          <p className="text-sm italic mb-2">"{element.content}"</p>
          <div className="text-xs text-muted-foreground">- Customer Name</div>
        </div>
      </div>
    )}
    {element.type === "grid" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="grid grid-cols-2 gap-2 h-full">
          <div className="bg-muted rounded p-2 text-xs text-center">Item 1</div>
          <div className="bg-muted rounded p-2 text-xs text-center">Item 2</div>
          <div className="bg-muted rounded p-2 text-xs text-center">Item 3</div>
          <div className="bg-muted rounded p-2 text-xs text-center">Item 4</div>
        </div>
      </div>
    )}
    {element.type === "navigation" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex items-center px-4" style={{
        ...elementStyles,
        justifyContent: element.props?.logoPosition === "center" ? "center" : 
                        element.props?.logoPosition === "right" ? "flex-end" : "space-between"
      }}>
        {element.props?.logoType === "image" && element.props?.logoImageUrl ? (
          <img 
            src={element.props.logoImageUrl}
            alt="Logo"
            className="object-contain"
            style={{
              height: element.props?.autoScale ? 
                `${Math.min(Number.parseInt(element.props?.logoImageHeight) || 32, (element.position?.height || 50) - 20)}px` :
                element.props?.logoImageHeight || '32px',
              width: element.props?.autoScale ? 
                `${Math.min(Number.parseInt(element.props?.logoImageWidth) || 120, (element.position?.width || 300) * 0.4)}px` :
                element.props?.logoImageWidth || '120px',
              maxHeight: element.props?.logoImageHeight || '32px',
              maxWidth: element.props?.logoImageWidth || '120px'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div 
            className="font-semibold text-sm"
            style={{
              fontSize: element.props?.logoFontSize || '16px',
              fontWeight: element.props?.logoFontWeight || '600',
              fontFamily: element.props?.logoFontFamily || 'inherit'
            }}
          >
            {element.props?.logo || 'Logo'}
          </div>
        )}
        <div className="flex gap-4">
          {(element.props?.menuItems || ['Home', 'About', 'Contact']).map((item: string, index: number) => (
            <span 
              key={index}
              className="text-sm"
              style={{
                fontSize: element.props?.menuItemFontSize || '14px',
                fontWeight: element.props?.menuItemFontWeight || '400',
                fontFamily: element.props?.menuItemFontFamily || 'inherit'
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    )}
    {element.type === "footer" && (
      <div className="text-card-foreground w-full h-full bg-muted border border-border rounded-lg flex flex-col justify-center px-4" style={elementStyles}>
        <div className="w-full" style={{ fontFamily: element.props?.fontFamily || "inherit" }}>
          <p 
            className="mb-1"
            style={{
              fontSize: element.props?.titleFontSize || "18px",
              fontWeight: element.props?.titleFontWeight || "600",
              color: element.styles?.color || "#ffffff",
              textAlign: element.props?.titlePosition || "center"
            }}
          >
            {element.content}
          </p>
          <p 
            className="text-muted-foreground"
            style={{
              fontSize: element.props?.textFontSize || "14px",
              fontWeight: element.props?.textFontWeight || "400",
              color: element.styles?.color || "#ffffff",
              textAlign: element.props?.textPosition || "center"
            }}
          >
            {element.props?.copyright || "© 2024 Your Company"}
          </p>
        </div>
      </div>
    )}
    {element.type === "header" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex items-center justify-center px-4" style={elementStyles}>
        <div className="w-full" style={{ fontFamily: element.props?.fontFamily || "inherit" }}>
          <h1 
            className="mb-1"
            style={{
              fontSize: element.props?.titleFontSize || "24px",
              fontWeight: element.props?.titleFontWeight || "700",
              textAlign: element.props?.titlePosition || "center"
            }}
          >
            {element.content}
          </h1>
          <p 
            className="text-muted-foreground"
            style={{
              fontSize: element.props?.subtitleFontSize || "16px",
              fontWeight: element.props?.subtitleFontWeight || "400",
              textAlign: element.props?.subtitlePosition || "center"
            }}
          >
            {element.props?.subtitle || "Welcome to our website"}
          </p>
        </div>
      </div>
    )}
    {element.type === "sidebar" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="space-y-3" style={{ fontFamily: element.props?.fontFamily || "inherit" }}>
          <div 
            className="font-medium"
            style={{
              fontSize: element.props?.titleFontSize || "14px",
              fontWeight: element.props?.titleFontWeight || "500",
              textAlign: element.props?.titlePosition || "left"
            }}
          >
            {element.content || "Menu"}
          </div>
          <div className="space-y-2">
            {(element.props?.sidebarItems || ["Dashboard", "Settings", "Profile", "Logout"]).map((item: string, index: number) => (
              <div 
                key={index} 
                className="text-muted-foreground"
                style={{
                  fontSize: element.props?.itemFontSize || "12px",
                  fontWeight: element.props?.itemFontWeight || "400",
                  textAlign: element.props?.itemPosition || "left"
                }}
              >
                • {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {element.type === "form" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="space-y-3 h-full flex flex-col">
          <h3 
            className="font-semibold flex-shrink-0" 
            style={{
              fontSize: element.props?.titleFontSize || '14px',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2 flex-1 flex flex-col">
            <input 
              type="text" 
              placeholder="Name" 
              className="w-full border flex-shrink-0" 
              style={element.props?.enableScaling ? {
                padding: `${Math.max(4, (element.position?.height || 200) * 0.02)}px ${Math.max(8, (element.position?.width || 300) * 0.03)}px`,
                fontSize: `${Math.max(10, (element.position?.height || 200) * 0.06)}px`,
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              } : {
                padding: element.props?.inputPadding || '8px 12px',
                fontSize: element.props?.inputFontSize || '12px',
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              }}
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full border flex-shrink-0" 
              style={element.props?.enableScaling ? {
                padding: `${Math.max(4, (element.position?.height || 200) * 0.02)}px ${Math.max(8, (element.position?.width || 300) * 0.03)}px`,
                fontSize: `${Math.max(10, (element.position?.height || 200) * 0.06)}px`,
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              } : {
                padding: element.props?.inputPadding || '8px 12px',
                fontSize: element.props?.inputFontSize || '12px',
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              }}
            />
            <textarea 
              placeholder="Message" 
              className="w-full border resize-none flex-1" 
              style={element.props?.enableScaling ? {
                padding: `${Math.max(4, (element.position?.height || 200) * 0.02)}px ${Math.max(8, (element.position?.width || 300) * 0.03)}px`,
                fontSize: `${Math.max(10, (element.position?.height || 200) * 0.06)}px`,
                minHeight: `${Math.max(40, (element.position?.height || 200) * 0.2)}px`,
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              } : {
                padding: element.props?.inputPadding || '8px 12px',
                fontSize: element.props?.inputFontSize || '12px',
                minHeight: element.props?.textareaMinHeight || '64px',
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              }}
            />
            <button 
              className="w-full rounded flex-shrink-0" 
              style={element.props?.enableScaling ? {
                padding: `${Math.max(6, (element.position?.height || 200) * 0.03)}px ${Math.max(12, (element.position?.width || 300) * 0.04)}px`,
                fontSize: `${Math.max(10, (element.position?.height || 200) * 0.06)}px`,
                borderRadius: element.props?.buttonBorderRadius || '4px',
                backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                color: element.props?.buttonTextColor || '#ffffff',
                border: 'none',
                cursor: 'pointer'
              } : {
                padding: element.props?.buttonPadding || '8px 12px',
                fontSize: element.props?.buttonFontSize || '12px',
                borderRadius: element.props?.buttonBorderRadius || '4px',
                backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                color: element.props?.buttonTextColor || '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {element.props?.buttonText || "Submit"}
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Advanced UI Components */}
    {element.type === "calendar" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="text-center">
          <h3 className="font-semibold text-sm mb-3">Calendar</h3>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="p-1 text-center font-medium text-muted-foreground">{day}</div>
            ))}
            {Array.from({length: 28}, (_, i) => (
              <div key={i} className="p-1 text-center hover:bg-muted rounded">{i + 1}</div>
            ))}
          </div>
        </div>
      </div>
    )}
    {element.type === "search-bar" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="relative">
          <input 
            type="text" 
            placeholder={element.content}
            className="w-full px-3 py-2 pl-8 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    )}
    {element.type === "filter" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <h3 className="font-semibold text-sm mb-3">{element.content}</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" className="rounded" />
            <span>Option 1</span>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" className="rounded" />
            <span>Option 2</span>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" className="rounded" />
            <span>Option 3</span>
          </label>
        </div>
      </div>
    )}
    {element.type === "breadcrumb" && (
      <div className="w-full h-full flex items-center" style={elementStyles}>
        <nav className="flex items-center space-x-1 text-sm">
          <span className="text-primary hover:underline cursor-pointer">Home</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-primary hover:underline cursor-pointer">About</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Contact</span>
        </nav>
      </div>
    )}
    {element.type === "pagination" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <nav className="flex items-center space-x-1">
          <button className="px-2 py-1 text-xs border border-border rounded hover:bg-muted">←</button>
          <button className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">1</button>
          <button className="px-2 py-1 text-xs border border-border rounded hover:bg-muted">2</button>
          <button className="px-2 py-1 text-xs border border-border rounded hover:bg-muted">3</button>
          <span className="px-2 py-1 text-xs text-muted-foreground">...</span>
          <button className="px-2 py-1 text-xs border border-border rounded hover:bg-muted">10</button>
          <button className="px-2 py-1 text-xs border border-border rounded hover:bg-muted">→</button>
        </nav>
      </div>
    )}
    {element.type === "spinner" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm">{element.content}</span>
      </div>
    )}
    {element.type === "skeleton" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    )}
    {element.type === "alert" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "toast" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "drawer" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">{element.content}</h3>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">• Menu Item 1</div>
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">• Menu Item 2</div>
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">• Menu Item 3</div>
          </div>
        </div>
      </div>
    )}
    {/* Content & Text Components */}
    {element.type === "code-block" && (
      <div className="w-full h-full" style={elementStyles}>
        <pre className="w-full h-full p-4 bg-muted rounded-lg border border-border overflow-auto">
          <code className="text-sm font-mono text-foreground">{element.content}</code>
        </pre>
      </div>
    )}
    {element.type === "markdown" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="prose prose-sm max-w-none">
          <h1 className="text-lg font-bold mb-2">Markdown Content</h1>
          <p className="text-sm mb-2">This is <strong>bold</strong> text and <em>italic</em> text.</p>
          <p className="text-sm text-muted-foreground">Markdown rendering...</p>
        </div>
      </div>
    )}
    {element.type === "rich-text" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="space-y-2">
          <div className="flex gap-1 p-2 bg-muted rounded border border-border">
            <button className="px-2 py-1 text-xs bg-background rounded hover:bg-muted">B</button>
            <button className="px-2 py-1 text-xs bg-background rounded hover:bg-muted">I</button>
            <button className="px-2 py-1 text-xs bg-background rounded hover:bg-muted">U</button>
          </div>
          <div className="p-2 border border-border rounded bg-background min-h-[100px] text-sm">
            {element.content}
          </div>
        </div>
      </div>
    )}
    {element.type === "typography" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Typography</h1>
          <p className="text-sm text-muted-foreground">Font styles and sizes</p>
        </div>
      </div>
    )}
    {element.type === "link" && (
      <div className="w-full h-full flex items-center" style={elementStyles}>
        <a href="#" className="text-primary hover:text-primary/80 underline text-sm">
          {element.content}
        </a>
      </div>
    )}
    {element.type === "tag" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
          {element.content}
        </span>
      </div>
    )}
    {element.type === "label" && (
      <div className="w-full h-full flex items-center" style={elementStyles}>
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-foreground">
          {element.content}
        </span>
      </div>
    )}
    {/* File & Media Components */}
    {element.type === "file-upload" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
          <svg className="w-8 h-8 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm text-muted-foreground">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "file-download" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">{element.content}</span>
          </div>
        </div>
      </div>
    )}
    {element.type === "pdf-viewer" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center">
          <svg className="w-12 h-12 text-muted-foreground mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{element.content}</span>
          <span className="text-xs text-muted-foreground mt-1">PDF Viewer</span>
        </div>
      </div>
    )}
    {element.type === "document" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center">
          <svg className="w-10 h-10 text-muted-foreground mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "folder" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center">
          <svg className="w-10 h-10 text-muted-foreground mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="text-sm font-medium">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "image-gallery" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full grid grid-cols-3 gap-2">
          {Array.from({length: 6}, (_, i) => (
            <div key={i} className="bg-muted rounded border border-border flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    )}
    {element.type === "video-gallery" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full grid grid-cols-2 gap-2">
          {Array.from({length: 4}, (_, i) => (
            <div key={i} className="bg-muted rounded border border-border flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    )}
    {element.type === "media-player" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          <span className="text-sm font-medium">{element.content}</span>
          <div className="flex gap-2 mt-2">
            <button className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80">⏮</button>
            <button className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">⏸</button>
            <button className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80">⏭</button>
          </div>
        </div>
      </div>
    )}
    {/* Navigation & Menu Components */}
    {element.type === "menu" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="relative">
          <button className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground hover:bg-muted flex items-center justify-between">
            <span>{element.content}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    )}
    {element.type === "tab-nav" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="flex border-b border-border">
          <button className="px-3 py-2 text-sm font-medium text-primary border-b-2 border-primary">Tab 1</button>
          <button className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Tab 2</button>
          <button className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Tab 3</button>
        </div>
      </div>
    )}
    {element.type === "side-menu" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground mb-3">{element.content}</div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-1 px-2 rounded hover:bg-muted">• Dashboard</div>
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-1 px-2 rounded hover:bg-muted">• Settings</div>
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-1 px-2 rounded hover:bg-muted">• Profile</div>
          </div>
        </div>
      </div>
    )}
    {element.type === "mobile-menu" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground mb-3">{element.content}</div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-2 px-3 rounded hover:bg-muted">📱 Home</div>
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-2 px-3 rounded hover:bg-muted">📱 About</div>
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-2 px-3 rounded hover:bg-muted">📱 Contact</div>
          </div>
        </div>
      </div>
    )}
    {element.type === "back-button" && (
      <div className="w-full h-full" style={elementStyles}>
        <button className="w-full h-full flex items-center justify-center hover:bg-muted/50 rounded transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">{element.content}</span>
        </button>
      </div>
    )}
    {element.type === "home-button" && (
      <div className="w-full h-full" style={elementStyles}>
        <button className="w-full h-full flex items-center justify-center hover:opacity-80 rounded transition-opacity">
          <span className="text-sm font-medium">{element.content}</span>
        </button>
      </div>
    )}
    {/* Feedback & Status Components */}
    {element.type === "loading" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-sm">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "progress-ring" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="relative">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="var(--color-muted)" strokeWidth="4" fill="none" />
            <circle cx="32" cy="32" r="28" stroke="var(--color-primary)" strokeWidth="4" fill="none" strokeDasharray="175" strokeDashoffset="44" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium">{element.content}</span>
          </div>
        </div>
      </div>
    )}
    {element.type === "status-badge" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
          {element.content}
        </span>
      </div>
    )}
    {element.type === "notification" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="relative">
          <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </div>
      </div>
    )}
    {element.type === "alert-banner" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "success-message" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "error-message" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{element.content}</span>
        </div>
      </div>
    )}
    {element.type === "warning-message" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{element.content}</span>
        </div>
      </div>
    )}
    {/* Utility & Tools Components */}
    {element.type === "divider" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="w-full h-px bg-border"></div>
      </div>
    )}
    {element.type === "spacer" && (
      <div className="w-full h-full bg-transparent" style={elementStyles}>
        <div className="w-full h-full bg-muted/20 border border-dashed border-border rounded flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Spacer</span>
        </div>
      </div>
    )}
    {element.type === "container" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">{element.content}</h3>
            <p className="text-xs text-muted-foreground">Container wrapper</p>
          </div>
        </div>
      </div>
    )}
    {element.type === "wrapper" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">{element.content}</h3>
            <p className="text-xs text-muted-foreground">Element wrapper</p>
          </div>
        </div>
      </div>
    )}
    {element.type === "flexbox" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs">1</span>
          </div>
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs">2</span>
          </div>
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs">3</span>
          </div>
        </div>
      </div>
    )}
    {element.type === "grid-container" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full grid grid-cols-2 gap-2">
          <div className="bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs">Item 1</span>
          </div>
          <div className="bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs">Item 2</span>
          </div>
          <div className="bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs">Item 3</span>
          </div>
          <div className="bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs">Item 4</span>
          </div>
        </div>
      </div>
    )}
    {element.type === "center" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">{element.content}</h3>
            <p className="text-xs text-muted-foreground">Centered content</p>
          </div>
        </div>
      </div>
    )}
    {element.type === "stack" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col gap-2">
          <div className="bg-primary/20 rounded p-2 text-center">
            <span className="text-xs">Stack Item 1</span>
          </div>
          <div className="bg-primary/20 rounded p-2 text-center">
            <span className="text-xs">Stack Item 2</span>
          </div>
          <div className="bg-primary/20 rounded p-2 text-center">
            <span className="text-xs">Stack Item 3</span>
          </div>
        </div>
      </div>
    )}
    {/* Business & Marketing Components */}
    {element.type === "pricing-table" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold mb-4">{element.content}</h3>
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-sm font-medium">Basic</div>
              <div className="text-lg font-bold text-primary">$9</div>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-center border-2 border-primary">
              <div className="text-sm font-medium">Pro</div>
              <div className="text-lg font-bold text-primary">$29</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-sm font-medium">Enterprise</div>
              <div className="text-lg font-bold text-primary">$99</div>
            </div>
          </div>
        </div>
      </div>
    )}
    {element.type === "feature-list" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 className="text-sm font-medium mb-3">{element.content}</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Feature 1</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Feature 2</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Feature 3</span>
            </div>
          </div>
        </div>
      </div>
    )}
    {element.type === "faq" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 className="text-sm font-medium mb-3">{element.content}</h3>
          <div className="space-y-2">
            <div className="border border-border rounded p-2">
              <div className="text-xs font-medium mb-1">Q: What is this service?</div>
              <div className="text-xs text-muted-foreground">A: This is a comprehensive solution...</div>
            </div>
            <div className="border border-border rounded p-2">
              <div className="text-xs font-medium mb-1">Q: How does it work?</div>
              <div className="text-xs text-muted-foreground">A: It works by...</div>
            </div>
          </div>
        </div>
      </div>
    )}
    {element.type === "blog-post" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <div className="w-full h-20 bg-muted rounded mb-3"></div>
          <h3 className="text-sm font-medium">{element.content}</h3>
          <p className="text-xs text-muted-foreground line-clamp-3">This is a sample blog post content that demonstrates how the blog post component would look...</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>By Author</span>
            <span>•</span>
            <span>Dec 2024</span>
          </div>
        </div>
      </div>
    )}
    {element.type === "case-study" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <div className="w-full h-16 bg-muted rounded mb-3"></div>
          <h3 className="text-sm font-medium">{element.content}</h3>
          <p className="text-xs text-muted-foreground">Success story showcasing results and outcomes...</p>
          <div className="flex gap-2">
            <div className="bg-primary/20 rounded px-2 py-1 text-xs">+50% Growth</div>
            <div className="bg-primary/20 rounded px-2 py-1 text-xs">ROI: 300%</div>
          </div>
        </div>
      </div>
    )}
    {element.type === "cta" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-bold mb-2">{element.content}</h3>
          <p className="text-sm mb-4 opacity-90">Get started today and transform your business</p>
          <button className="px-4 py-2 bg-background text-primary rounded-lg text-sm font-medium hover:bg-background/80 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    )}
    {element.type === "hero" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold mb-3">Welcome to Our Platform</h1>
          <p className="text-sm mb-6 opacity-80 max-w-md">Build amazing websites with our drag-and-drop builder. No coding required.</p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Get Started
            </button>
            <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    )}
    {element.type === "about" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 className="text-lg font-bold">{element.content}</h3>
          <p className="text-sm opacity-80">We are a team of passionate developers and designers creating amazing digital experiences.</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">100+</div>
              <div className="text-xs text-muted-foreground">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">50+</div>
              <div className="text-xs text-muted-foreground">Clients</div>
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Forms & Validation Components */}
    {element.type === "contact-form" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 className="text-sm font-medium">{element.content}</h3>
          <div className="space-y-2">
            <input type="text" placeholder="Name" className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
            <input type="email" placeholder="Email" className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
            <textarea placeholder="Message" className="w-full px-2 py-1 text-xs border border-border rounded bg-background h-16 resize-none"></textarea>
            <button className="w-full px-2 py-1 text-xs bg-primary text-primary-foreground rounded">Send Message</button>
          </div>
        </div>
      </div>
    )}
    {element.type === "newsletter-signup" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-3">
          <h3 
            className="font-medium" 
            style={{
              fontSize: element.props?.titleFontSize || '14px',
              textAlign: element.props?.titleAlign || 'center',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <p 
            className="text-muted-foreground" 
            style={{
              fontSize: element.props?.descriptionFontSize || '12px',
              color: element.props?.descriptionColor || '#9ca3af'
            }}
          >
            {element.props?.description || "Stay updated with our latest news"}
          </p>
          <div className="flex gap-2 w-full">
            <input 
              type="email" 
              placeholder="Enter email" 
              className="flex-1 border" 
              style={{
                padding: element.props?.inputPadding || '8px 12px',
                fontSize: element.props?.inputFontSize || '12px',
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                color: element.props?.inputTextColor || '#ffffff'
              }}
            />
            <button 
              className="rounded" 
              style={{
                padding: element.props?.buttonPadding || '8px 12px',
                fontSize: element.props?.buttonFontSize || '12px',
                borderRadius: element.props?.buttonBorderRadius || '4px',
                backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                color: element.props?.buttonTextColor || '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {element.props?.buttonText || "Subscribe"}
            </button>
          </div>
        </div>
      </div>
    )}
    {element.type === "login-form" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 
            className="font-medium" 
            style={{
              fontSize: element.props?.titleFontSize || '14px',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <button 
              className="w-full rounded" 
              style={getFormButtonStyles(element)}
            >
              {element.props?.submitText || "Login"}
            </button>
            <div className="text-xs text-center text-muted-foreground">{element.props?.forgotPasswordText || "Forgot password?"}</div>
          </div>
        </div>
      </div>
    )}
    {element.type === "registration-form" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-2">
          <h3 
            className="font-medium" 
            style={{
              fontSize: element.props?.titleFontSize || '14px',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-1">
            <input type="text" placeholder="Full Name" className="w-full border" style={getFormInputStyles(element)} />
            <input type="email" placeholder="Email" className="w-full border" style={getFormInputStyles(element)} />
            <input type="password" placeholder="Password" className="w-full border" style={getFormInputStyles(element)} />
            <input type="password" placeholder="Confirm Password" className="w-full border" style={getFormInputStyles(element)} />
            <button className="w-full rounded" style={getFormButtonStyles(element)}>
              {element.props?.submitText || "Register"}
            </button>
          </div>
        </div>
      </div>
    )}
    {element.type === "survey-form" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 
            className="font-medium" 
            style={{
              fontSize: element.props?.titleFontSize || '14px',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            <div 
              className="font-medium" 
              style={{
                fontSize: element.props?.questionFontSize || '12px',
                color: element.props?.questionColor || '#ffffff'
              }}
            >
              {element.props?.question || "How satisfied are you?"}
            </div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <button 
                  key={i} 
                  className="border rounded hover:bg-muted" 
                  style={{
                    width: element.props?.ratingButtonSize || '24px',
                    height: element.props?.ratingButtonSize || '24px',
                    fontSize: element.props?.ratingButtonFontSize || '12px',
                    borderColor: element.props?.ratingButtonBorderColor || '#374151',
                    backgroundColor: element.props?.ratingButtonBackgroundColor || '#1f2937',
                    color: element.props?.ratingButtonTextColor || '#ffffff'
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
            <textarea 
              placeholder="Additional comments" 
              className="w-full border resize-none" 
              style={{
                padding: element.props?.textareaPadding || '8px 12px',
                fontSize: element.props?.textareaFontSize || '12px',
                borderRadius: element.props?.textareaBorderRadius || '4px',
                borderColor: element.props?.textareaBorderColor || '#374151',
                backgroundColor: element.props?.textareaBackgroundColor || '#1f2937',
                color: element.props?.textareaTextColor || '#ffffff',
                height: element.props?.textareaHeight || '48px'
              }}
            />
            <button 
              className="w-full rounded" 
              style={getFormButtonStyles(element)}
            >
              {element.props?.submitText || "Submit"}
            </button>
          </div>
        </div>
      </div>
    )}
    {element.type === "order-form" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 
            className="font-medium" 
            style={{
              fontSize: element.props?.titleFontSize || '14px',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Product Name" 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <input 
              type="number" 
              placeholder="Quantity" 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <input 
              type="text" 
              placeholder="Shipping Address" 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <button 
              className="w-full rounded" 
              style={getFormButtonStyles(element)}
            >
              {element.props?.submitText || "Place Order"}
            </button>
          </div>
        </div>
      </div>
    )}
    {element.type === "booking-form" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 
            className="font-medium" 
            style={{
              fontSize: element.props?.titleFontSize || '14px',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Service" 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <input 
              type="date" 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <input 
              type="time" 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <button 
              className="w-full rounded" 
              style={getFormButtonStyles(element)}
            >
              {element.props?.submitText || "Book Now"}
            </button>
          </div>
        </div>
      </div>
    )}
    {element.type === "feedback-form" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 
            className="font-medium" 
            style={{
              fontSize: element.props?.titleFontSize || '14px',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            <select 
              className="w-full border" 
              style={{
                padding: element.props?.selectPadding || '8px 12px',
                fontSize: element.props?.selectFontSize || '12px',
                borderRadius: element.props?.selectBorderRadius || '4px',
                borderColor: element.props?.selectBorderColor || '#374151',
                backgroundColor: element.props?.selectBackgroundColor || '#1f2937',
                color: element.props?.selectTextColor || '#ffffff'
              }}
            >
              <option>Select Category</option>
              <option>Bug Report</option>
              <option>Feature Request</option>
              <option>General Feedback</option>
            </select>
            <textarea 
              placeholder="Your feedback" 
              className="w-full border resize-none" 
              style={{
                padding: element.props?.textareaPadding || '8px 12px',
                fontSize: element.props?.textareaFontSize || '12px',
                borderRadius: element.props?.textareaBorderRadius || '4px',
                borderColor: element.props?.textareaBorderColor || '#374151',
                backgroundColor: element.props?.textareaBackgroundColor || '#1f2937',
                color: element.props?.textareaTextColor || '#ffffff',
                height: element.props?.textareaHeight || '64px'
              }}
            />
            <button 
              className="w-full rounded" 
              style={getFormButtonStyles(element)}
            >
              {element.props?.submitText || "Submit Feedback"}
            </button>
          </div>
        </div>
      </div>
    )}
        </div>

        {/* Element label and controls */}
        {isSelected && RESIZABLE_TYPES.has(element.type) && (
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

            {/* Resize handles: corners */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, "nw")}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, "ne")}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, "sw")}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, "se")}
            />

            {/* Resize handles: edges */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-primary rounded cursor-n-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, "n")}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-primary rounded cursor-s-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, "s")}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-3 bg-primary rounded cursor-w-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, "w")}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-3 bg-primary rounded cursor-e-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, "e")}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setCanvasNode}
      className={`relative w-full h-full min-h-[800px] bg-gradient-to-br from-canvas via-canvas to-canvas/95 overflow-auto transition-all duration-300 ${isOver ? "bg-drop-zone/20" : ""}`}
      onClick={handleCanvasClick}
      style={{ 
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top left',
        width: `${100 / (zoom / 100)}%`,
        height: `${100 / (zoom / 100)}%`,
        minHeight: `${contentHeight}px`,
      }}
    >
      {/* Partitions: interactive hover & boundaries (visible only when toggled) */}
      {showSections && (
        <PartitionsOverlay
          headerHeight={headerHeight}
          footerHeight={footerHeight}
          sections={sections}
          setSections={setSections}
          focusedRegion={focusedRegion}
          focusedSectionIndex={focusedSectionIndex}
          setFocusedRegion={setFocusedRegion}
          setFocusedSectionIndex={setFocusedSectionIndex}
          onStartResize={startBoundaryResize}
          onStartSectionResize={startSectionDividerResize}
          defaultSectionHeight={DEFAULT_SECTION}
        />
      )}
      {/* Enhanced Grid overlay */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-10 transition-opacity duration-300"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--color-primary) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)
            `,
            backgroundSize: `${snapSettings.gridSize}px ${snapSettings.gridSize}px`,
          }}
        />
      )}

      {/* Enhanced Breakpoint indicator - Fixed size regardless of zoom */}
      <div 
        className="absolute z-30 animate-in slide-in-from-top duration-500"
        style={{
          top: `${16 / (zoom / 100)}px`,
          left: '50%',
          transform: `translateX(-50%) scale(${100 / zoom})`,
          transformOrigin: 'center',
        }}
      >
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-muted to-muted/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-muted-foreground border border-border shadow-lg">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span>Editing for:</span>
          <span className="font-medium text-foreground capitalize bg-primary/10 px-2 py-1 rounded-md">{currentBreakpoint}</span>
        </div>
      </div>

      {/* Elements with animations */}
      {elements.map((element, index) => (
        <div
          key={element.id}
          className="animate-in fade-in duration-500"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {renderElement(element)}
        </div>
      ))}

      {/* Enhanced Drop zone indicator */}
      {isOver && (
        <div className="absolute inset-4 border-2 border-dashed border-primary rounded-xl flex items-center justify-center text-primary bg-gradient-to-br from-drop-zone/20 to-drop-zone/10 backdrop-blur-sm pointer-events-none z-20 animate-in zoom-in duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto animate-bounce">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-lg font-medium">Drop component anywhere on the canvas</p>
            <p className="text-sm text-muted-foreground mt-2">Release to add to your design</p>
          </div>
        </div>
      )}

      {/* Canvas info overlay */}
      <div className="absolute bottom-4 right-4 z-30">
        <div className="bg-muted/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-muted-foreground border border-border">
          {elements.length} elements • {currentBreakpoint} view
        </div>
      </div>
    </div>
  )
}

// Lightweight internal component for partitions overlay
function PartitionsOverlay({
  headerHeight,
  footerHeight,
  sections,
  setSections,
  focusedRegion,
  focusedSectionIndex,
  setFocusedRegion,
  setFocusedSectionIndex,
  onStartResize,
  onStartSectionResize,
  defaultSectionHeight,
}: {
  headerHeight: number
  footerHeight: number
  sections: { id: string; height: number }[]
  setSections: React.Dispatch<React.SetStateAction<{ id: string; height: number }[]>>
  focusedRegion: null | "header" | "section" | "footer"
  focusedSectionIndex: number | null
  setFocusedRegion: (r: null | "header" | "section" | "footer") => void
  setFocusedSectionIndex: (i: number | null) => void
  onStartResize: (which: "header" | "footer", clientY: number) => void
  onStartSectionResize: (index: number, clientY: number) => void
  defaultSectionHeight: number
}) {
  // Fine-grained hover states so sections act independently
  const [hoverHeader, setHoverHeader] = useState(false)
  const [hoverFooter, setHoverFooter] = useState(false)
  const [hoverHeaderBottom, setHoverHeaderBottom] = useState(false)
  const [hoverFooterTop, setHoverFooterTop] = useState(false)
  const [hoverSectionIndex, setHoverSectionIndex] = useState<number | null>(null)
  const [hoverSectionTopIndex, setHoverSectionTopIndex] = useState<number | null>(null)
  const [hoverSectionBottomIndex, setHoverSectionBottomIndex] = useState<number | null>(null)

  type BtnKind =
    | { type: "header-bottom" }
    | { type: "footer-top" }
    | { type: "sec-top"; index: number }
    | { type: "sec-bottom"; index: number }

  const boundaryBtn = (
    style: React.CSSProperties,
    kind: BtnKind,
  ) => {
    const isBottomAnchored = kind.type === "sec-bottom" || kind.type === "footer-top"
    const translateY = isBottomAnchored ? "translate-y-1/2" : "-translate-y-1/2"
    return (
      <button
        key={`${kind.type}-${'index' in kind ? kind.index : 'x'}`}
        type="button"
        className={`absolute -translate-x-1/2 ${translateY} text-xs px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground border border-primary/80 shadow-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-colors`}
        style={style}
        onMouseEnter={() => {
          if (kind.type === "header-bottom") setHoverHeaderBottom(true)
          if (kind.type === "footer-top") setHoverFooterTop(true)
          if (kind.type === "sec-top") setHoverSectionTopIndex(kind.index)
          if (kind.type === "sec-bottom") setHoverSectionBottomIndex(kind.index)
        }}
        onClick={(e) => {
          e.stopPropagation()
          // Insert a new section at the appropriate boundary
          const mkSection = () => ({ id: `sec-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, height: defaultSectionHeight })
          setSections((prev) => {
            const next = [...prev]
            if (kind.type === "header-bottom") {
              next.splice(0, 0, mkSection())
            } else if (kind.type === "footer-top") {
              next.push(mkSection())
            } else if (kind.type === "sec-top") {
              const insertAt = Math.max(0, Math.min(kind.index, next.length))
              next.splice(insertAt, 0, mkSection())
            } else if (kind.type === "sec-bottom") {
              const insertAt = Math.max(0, Math.min(kind.index + 1, next.length))
              next.splice(insertAt, 0, mkSection())
            }
            // Return to non-focus default state after adding
            setFocusedRegion(null); setFocusedSectionIndex(null)
            // Clear hovers
            setHoverHeaderBottom(false); setHoverFooterTop(false); setHoverSectionTopIndex(null); setHoverSectionBottomIndex(null); setHoverSectionIndex(null)
            return next
          })
        }}
      >
        + Add section
      </button>
    )
  }

  // Decide which boundary button should be persistently visible based on focusedRegion
  const focusBoundaryMap: Record<"header" | "section" | "footer", "h-bottom" | "s-bottom" | "f-top"> = {
    header: "h-bottom",
    section: "s-bottom",
    footer: "f-top",
  }
  const focusedBoundary = focusedRegion ? focusBoundaryMap[focusedRegion] : null

  // Compute top offsets for each section block (visual overlay only)
  const sectionTops: number[] = []
  {
    let acc = headerHeight
    for (const s of sections) {
      sectionTops.push(acc)
      acc += s.height
    }
  }

  return (
    <div className="absolute inset-0 z-20 select-none">
      {/* Regions */}
      <div
        className="absolute left-0 right-0"
        style={{ top: 0, height: `${headerHeight}px` }}
        onMouseEnter={() => setHoverHeader(true)}
        onMouseLeave={() => setHoverHeader(false)}
        onClick={(e) => {
          e.stopPropagation()
          setFocusedRegion("header")
          setFocusedSectionIndex(null)
        }}
      >
        {(hoverHeader || hoverHeaderBottom || focusedRegion === "header") && (
          <div className={`absolute inset-0 ${focusedRegion === "header" ? "ring-1 ring-emerald-400/50" : ""} bg-emerald-400/10 border border-emerald-400/30 pointer-events-none`}>
            <div className="absolute top-1 left-2 text-[11px] text-emerald-400">Header</div>
          </div>
        )}
      </div>
      {/* Render each section band */}
      {sections.map((sec, idx) => (
        <div
          key={sec.id}
          className="absolute left-0 right-0"
          style={{ top: `${sectionTops[idx]}px`, height: `${sec.height}px` }}
          onMouseEnter={() => setHoverSectionIndex(idx)}
          onMouseLeave={() => setHoverSectionIndex((v) => (v === idx ? null : v))}
          onClick={(e) => { e.stopPropagation(); setFocusedRegion("section"); setFocusedSectionIndex(idx) }}
        >
          {(hoverSectionIndex === idx
            || focusedSectionIndex === idx
            || hoverSectionTopIndex === idx
            || hoverSectionBottomIndex === idx
            || (hoverHeaderBottom && idx === 0)
            || (hoverFooterTop && idx === sections.length - 1)
          ) && (
            <div className={`absolute inset-0 ${focusedSectionIndex === idx ? "ring-1 ring-blue-400/50" : ""} bg-blue-400/10 border border-blue-400/30 pointer-events-none`}>
              <div className="absolute top-1 left-2 text-[11px] text-blue-400">Section {idx + 1}</div>
            </div>
          )}
          {/* Per-section top add button (behaves like s-top for the first section; otherwise insert before idx) */}
          <div
            className="absolute left-0 right-0 pointer-events-auto"
            style={{ top: 0, height: 24 }}
            onMouseEnter={() => setHoverSectionTopIndex(idx)}
            onMouseLeave={() => setHoverSectionTopIndex((v) => (v === idx ? null : v))}
          >
            {(hoverSectionTopIndex === idx || (focusedRegion === 'section' && focusedSectionIndex === idx)) && boundaryBtn({ left: '50%', top: 0 }, { type: 'sec-top', index: idx })}
          </div>
          {/* Per-section bottom add button and divider resize handle */}
          <div
            className="absolute left-0 right-0 pointer-events-auto"
            style={{ bottom: 0, height: 24 }}
            onMouseEnter={() => setHoverSectionBottomIndex(idx)}
            onMouseLeave={() => setHoverSectionBottomIndex((v) => (v === idx ? null : v))}
            onMouseDown={(e) => {
              // Allow resizing between this section and the next if exists
              if (idx < sections.length - 1) onStartSectionResize(idx, e.clientY)
            }}
          >
            {(hoverSectionBottomIndex === idx || (focusedRegion === 'section' && focusedSectionIndex === idx)) && boundaryBtn({ left: '50%', bottom: 0 }, { type: 'sec-bottom', index: idx })}
          </div>
        </div>
      ))}
      <div
        className="absolute left-0 right-0"
        style={{ bottom: 0, height: `${footerHeight}px` }}
        onMouseEnter={() => setHoverFooter(true)}
        onMouseLeave={() => setHoverFooter(false)}
        onClick={(e) => {
          e.stopPropagation()
          setFocusedRegion("footer")
          setFocusedSectionIndex(null)
        }}
      >
        {(hoverFooter || hoverFooterTop || focusedRegion === "footer") && (
          <div className={`absolute inset-0 ${focusedRegion === "footer" ? "ring-1 ring-emerald-400/50" : ""} bg-emerald-400/10 border border-emerald-400/30 pointer-events-none`}>
            <div className="absolute top-1 left-2 text-[11px] text-emerald-400">Footer</div>
          </div>
        )}
      </div>

      {/* Resizable boundary hotspots with +Add button visibility */}
      {/* Header bottom boundary */
      }
      <div
        className="absolute left-0 right-0 pointer-events-auto cursor-ns-resize"
        style={{ top: `${headerHeight}px`, height: 32 }}
        onMouseEnter={() => setHoverHeaderBottom(true)}
        onMouseLeave={() => setHoverHeaderBottom(false)}
        onMouseDown={(e) => onStartResize("header", e.clientY)}
      >
        {(hoverHeaderBottom || focusedBoundary === "h-bottom") && boundaryBtn({ left: '50%', top: 0 }, { type: 'header-bottom' })}
      </div>

      {/* Section top (same line as header bottom) */}
      <div
        className="absolute left-0 right-0 pointer-events-auto cursor-ns-resize"
        style={{ top: `${headerHeight}px`, height: 32 }}
        onMouseEnter={() => setHoverSectionTopIndex(0)}
        onMouseLeave={() => setHoverSectionTopIndex((v) => (v === 0 ? null : v))}
        onMouseDown={(e) => onStartResize("header", e.clientY)}
      >
        {(hoverSectionTopIndex === 0) && boundaryBtn({ left: '50%', top: 0 }, { type: 'sec-top', index: 0 })}
      </div>

      {/* Footer top boundary */}
      <div
        className="absolute left-0 right-0 pointer-events-auto cursor-ns-resize"
        style={{ bottom: `${footerHeight}px`, height: 32 }}
        onMouseEnter={() => setHoverFooterTop(true)}
        onMouseLeave={() => setHoverFooterTop(false)}
        onMouseDown={(e) => onStartResize("footer", e.clientY)}
      >
        {(hoverFooterTop || focusedBoundary === "f-top") && boundaryBtn({ left: '50%', bottom: 0 }, { type: 'footer-top' })}
      </div>
    </div>
  )
}
