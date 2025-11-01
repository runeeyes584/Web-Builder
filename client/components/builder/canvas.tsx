"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Breakpoint, BuilderElement, RegionsLayout } from "@/lib/builder-types"
import { Copy, Trash2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useDrop } from "react-dnd"

// Simple Markdown parser
const parseMarkdown = (text: string) => {
  if (!text) return ""
  
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3 mt-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-4">$1</h1>')
    
    // Bold and Italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Code
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
    
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4">$2</li>')
    
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">$1</blockquote>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br>')
    
    // Wrap in paragraphs
    .replace(/^(?!<[h|b|l|c])/gm, '<p class="mb-2">')
    .replace(/(?<!>)$/gm, '</p>')
    
    // Clean up empty paragraphs
    .replace(/<p class="mb-2"><\/p>/g, '')
    .replace(/<p class="mb-2"><br><\/p>/g, '')
}

// Components that should fill the entire box without padding
// const NO_PADDING_COMPONENTS: ReadonlySet<BuilderElement["type"]> = new Set([
//   "video",
//   "image",
// ])

// Counter Component with Animation
function CounterComponent({ element, currentBreakpoint }: { element: BuilderElement, currentBreakpoint: Breakpoint }) {
  const [currentValue, setCurrentValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const targetValue = element.props?.targetValue || 1000
  const duration = element.props?.duration || 2000
  const suffix = element.props?.suffix || ""
  const prefix = element.props?.prefix || ""
  const showLabel = element.props?.showLabel !== false
  const animated = element.props?.animated !== false
  
  // Calculate element styles
  const elementStyles = {
    ...element.styles,
    ...(currentBreakpoint === 'tablet' ? element.responsiveStyles?.tablet : {}),
    ...(currentBreakpoint === 'mobile' ? element.responsiveStyles?.mobile : {}),
  }
  
  // Animation effect
  useEffect(() => {
    if (animated && targetValue > 0) {
      setIsAnimating(true)
      const startTime = Date.now()
      const startValue = 0
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const current = Math.floor(startValue + (targetValue - startValue) * easeOutQuart)
        
        setCurrentValue(current)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCurrentValue(targetValue)
          setIsAnimating(false)
        }
      }
      
      requestAnimationFrame(animate)
    } else {
      setCurrentValue(targetValue)
    }
  }, [targetValue, duration, animated])
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }
  
  return (
    <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center" style={elementStyles}>
      <div className="text-center">
        <div 
          className={`text-4xl font-bold mb-2 transition-all duration-300 ${isAnimating ? 'scale-110' : 'scale-100'}`}
          style={{
            fontFamily: element.props?.valueFontFamily || undefined,
            fontSize: element.props?.valueFontSize ? `${element.props.valueFontSize}px` : undefined,
            fontWeight: element.props?.valueFontWeight || undefined,
            color: element.props?.valueTextColor || undefined,
          }}
        >
          {prefix}{formatNumber(currentValue)}{suffix}
        </div>
        {showLabel && element.content && (
          <div 
            className="text-sm text-muted-foreground"
            style={{
              fontFamily: element.props?.labelFontFamily || undefined,
              fontSize: element.props?.labelFontSize ? `${element.props.labelFontSize}px` : undefined,
              fontWeight: element.props?.labelFontWeight || undefined,
              color: element.props?.labelTextColor || undefined,
            }}
          >
            {element.content}
          </div>
        )}
      </div>
    </div>
  )
}

// Carousel Component - Clean Version
function CarouselComponent({ element }: { element: BuilderElement }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Sync with element props
  useEffect(() => {
    setIsPlaying(element.props?.autoplay || false)
  }, [element.props?.autoplay])
  
  const slideCount = element.props?.slideCount || 5
  const uploadedImages = element.props?.uploadedImages || []
  
  // Create slides array
  const slides = Array.from({ length: slideCount }, (_, i) => ({
    id: `slide-${i}`,
    image: uploadedImages[i] || `https://picsum.photos/400/300?random=${i + 1}`
  }))

  // Autoplay functionality
  useEffect(() => {
    if (isPlaying) {
      const intervalTime = (element.props?.autoplayInterval || 3) * 1000
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slideCount)
      }, intervalTime)
      return () => clearInterval(interval)
    }
  }, [isPlaying, slideCount, element.props?.autoplayInterval])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slideCount)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div className="text-card-foreground bg-card border border-border rounded-lg overflow-hidden w-full h-full relative">
      {/* Carousel Container */}
      <div className="relative w-full h-full">
        {/* Slides */}
        <div className="relative w-full h-full overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                index === currentSlide ? 'translate-x-0' : 
                index < currentSlide ? '-translate-x-full' : 'translate-x-full'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={slide.image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-primary' : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Slide Counter */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {currentSlide + 1} / {slideCount}
        </div>
      </div>
    </div>
  )
}

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
  toggleCategoryRef?: React.MutableRefObject<((categoryName: string) => void) | null>
  onRegionsChange?: (regions: RegionsLayout) => void
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
  toggleCategoryRef,
  onRegionsChange,
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

  // Notify parent about current regions layout for LayersPanel grouping
  useEffect(() => {
    if (!onRegionsChange) return
    const sectionTops: number[] = sections.map((_, idx) =>
      headerHeight + sections.slice(0, idx).reduce((sum, s) => sum + s.height, 0)
    )
    onRegionsChange({
      header: { top: 0, height: headerHeight },
      sections: sections.map((s, idx) => ({ id: s.id, index: idx, top: sectionTops[idx], height: s.height })),
      footer: { top: headerHeight + totalSectionsHeight, height: footerHeight },
      contentHeight,
    })
  }, [onRegionsChange, headerHeight, sections, totalSectionsHeight, footerHeight, contentHeight])

  // Focused region for persistent controls
  const [focusedRegion, setFocusedRegion] = useState<null | "header" | "section" | "footer" >(null)
  const [focusedSectionIndex, setFocusedSectionIndex] = useState<number | null>(null)

  // Helper function to determine which region an element belongs to based on its Y position
  const getElementRegion = useCallback((elementY: number): { type: 'header' | 'section' | 'footer', sectionIndex?: number, regionTop: number, regionHeight: number } => {
    if (elementY < headerHeight) {
      return { type: 'header', regionTop: 0, regionHeight: headerHeight }
    }
    
    let sectionTop = headerHeight
    for (let i = 0; i < sections.length; i++) {
      const sectionBottom = sectionTop + sections[i].height
      if (elementY >= sectionTop && elementY < sectionBottom) {
        return { type: 'section', sectionIndex: i, regionTop: sectionTop, regionHeight: sections[i].height }
      }
      sectionTop = sectionBottom
    }
    
    // Must be in footer
    const footerTop = headerHeight + totalSectionsHeight
    return { type: 'footer', regionTop: footerTop, regionHeight: footerHeight }
  }, [headerHeight, sections, totalSectionsHeight, footerHeight])

  // Store previous region heights to detect changes and adjust element positions
  const previousRegionHeightsRef = useRef<{ header: number, sections: number[], footer: number }>({
    header: headerHeight,
    sections: sections.map(s => s.height),
    footer: footerHeight
  })

  // Helper function to calculate minimum height for a region based on largest element
  const getMinRegionHeight = useCallback((regionType: 'header' | 'section' | 'footer', sectionIndex?: number): number => {
    let regionTop = 0
    let regionBottom = 0
    
    // Calculate region bounds
    if (regionType === 'header') {
      regionTop = 0
      regionBottom = headerHeight
    } else if (regionType === 'footer') {
      regionTop = headerHeight + totalSectionsHeight
      regionBottom = regionTop + footerHeight
    } else if (regionType === 'section' && sectionIndex !== undefined) {
      regionTop = headerHeight
      for (let i = 0; i < sectionIndex; i++) {
        regionTop += sections[i]?.height || 0
      }
      regionBottom = regionTop + (sections[sectionIndex]?.height || 0)
    }
    
    // Find all elements in this region and get the lowest point
    let maxBottom = 0
    elements.forEach(element => {
      if (!element.position) return
      
      const elemY = element.position.y
      const elemHeight = element.position.height || 0
      const elemBottom = elemY + elemHeight
      
      // Check if element is in this region
      if (elemY >= regionTop && elemY < regionBottom) {
        maxBottom = Math.max(maxBottom, elemBottom - regionTop)
      }
    })
    
    // Return the larger of: base minimum or largest element bottom
    const baseMin = regionType === 'header' ? MIN_HEADER : regionType === 'footer' ? MIN_FOOTER : MIN_SECTION
    return Math.max(baseMin, maxBottom + 20) // Add 20px padding
  }, [elements, headerHeight, footerHeight, sections, totalSectionsHeight, MIN_HEADER, MIN_FOOTER, MIN_SECTION])

  // Helper function to check if a section contains any elements
  const sectionHasElements = useCallback((sectionIndex: number): boolean => {
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
      // Element is in section if its Y position is within section bounds
      return elemY >= sectionTop && elemY < sectionBottom
    })
  }, [elements, sections, headerHeight])

  const [draggedElementId, setDraggedElementId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [isRotating, setIsRotating] = useState<string | null>(null)
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null)

  // Transient positions/sizes/rotation while dragging/resizing/rotating to avoid heavy global updates
  const transientRef = useRef(new Map<string, { x?: number; y?: number; width?: number; height?: number; rotation?: number }>())
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

  // Effect to adjust element positions when regions are resized (Logic 2 - Updated)
  useEffect(() => {
    const prev = previousRegionHeightsRef.current
    const hasHeaderChanged = prev.header !== headerHeight
    const hasFooterChanged = prev.footer !== footerHeight
    const hasSectionsChanged = prev.sections.length !== sections.length || 
      prev.sections.some((h, i) => sections[i] && h !== sections[i].height)
    
    if (!hasHeaderChanged && !hasFooterChanged && !hasSectionsChanged) {
      return // No changes, skip adjustment
    }

    // Adjust positions of all elements based on their region
    // NEW: Elements keep their size, only positions adjust
    elements.forEach(element => {
      if (!element.position) return
      
      const currentY = element.position.y
      const currentX = element.position.x
      
      // Determine which region this element belongs to using PREVIOUS heights
      let prevRegionTop = 0
      let prevRegionHeight = prev.header
      let newRegionTop = 0
      let newRegionHeight = headerHeight
      let regionType: 'header' | 'section' | 'footer' = 'header'
      let sectionIdx = -1
      
      if (currentY < prev.header) {
        // Element is in header
        regionType = 'header'
        prevRegionTop = 0
        prevRegionHeight = prev.header
        newRegionTop = 0
        newRegionHeight = headerHeight
      } else {
        // Check sections
        let prevSectionTop = prev.header
        let newSectionTop = headerHeight
        let foundInSection = false
        
        for (let i = 0; i < Math.max(prev.sections.length, sections.length); i++) {
          const prevSectionHeight = prev.sections[i] || 0
          const newSectionHeight = sections[i]?.height || 0
          const prevSectionBottom = prevSectionTop + prevSectionHeight
          
          if (currentY >= prevSectionTop && currentY < prevSectionBottom) {
            // Element is in this section
            regionType = 'section'
            sectionIdx = i
            prevRegionTop = prevSectionTop
            prevRegionHeight = prevSectionHeight
            newRegionTop = newSectionTop
            newRegionHeight = newSectionHeight
            foundInSection = true
            break
          }
          
          prevSectionTop += prevSectionHeight
          newSectionTop += newSectionHeight
        }
        
        if (!foundInSection) {
          // Element must be in footer
          regionType = 'footer'
          prevRegionTop = prev.header + prev.sections.reduce((sum, h) => sum + h, 0)
          prevRegionHeight = prev.footer
          newRegionTop = headerHeight + totalSectionsHeight
          newRegionHeight = footerHeight
        }
      }
      
      // Calculate relative position within the region (as a percentage)
      const relativeY = currentY - prevRegionTop
      const relativeYPercent = prevRegionHeight > 0 ? relativeY / prevRegionHeight : 0.5
      
      // Calculate new position maintaining the same relative position
      const newY = newRegionTop + (relativeYPercent * newRegionHeight)
      
      // NEW: Keep element size the same - DO NOT scale height
      // Elements maintain their original size when regions resize
      
      // Update element position (only Y position changes, size stays the same)
      if (Math.abs(newY - currentY) > 0.1) {
        onUpdateElementPosition(element.id, {
          x: currentX,
          y: newY,
          width: element.position.width,  // Keep width unchanged
          height: element.position.height // Keep height unchanged
        })
      }
    })
    
    // Update previous heights
    previousRegionHeightsRef.current = {
      header: headerHeight,
      sections: sections.map(s => s.height),
      footer: footerHeight
    }
  }, [headerHeight, footerHeight, sections, elements, onUpdateElementPosition, totalSectionsHeight])

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
        position: { x: 100, y: 100, width: 300, height: 60 },
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
        content: "99.99",
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
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "pulse", duration: 1000, delay: 0 },
        props: {
          value: 4,
          maxStars: 5,
          readonly: false,
          showComment: true,
          commentPlaceholder: "Write your review...",
          showSubmitButton: true,
          submitButtonText: "Submit Review"
        }
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
        props: {
          socialLinks: [
            { platform: "Facebook", url: "https://facebook.com" },
            { platform: "Twitter", url: "https://twitter.com" },
            { platform: "Instagram", url: "https://instagram.com" }
          ]
        }
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
        props: {
          title: "Calendar",
          titleFontFamily: "inherit",
          titleFontSize: 14,
          titleFontWeight: "600",
          titleTextColor: "inherit"
        },
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "search-bar": {
        content: "Search...",
        props: {
          fontFamily: "inherit",
          fontSize: 16,
          fontWeight: "normal",
          textColor: "var(--color-foreground)"
        },
        styles: { padding: "0", border: "none", borderRadius: "0", backgroundColor: "transparent", width: "100%" },
        responsiveStyles: { desktop: { padding: "0" }, tablet: { padding: "0" }, mobile: { padding: "0" } },
        position: { x: 100, y: 100, width: 300, height: 48 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      filter: {
        content: "Filter Options",
        props: {
          title: "Filter Options",
          options: [
            { id: "option1", label: "Option 1", checked: false },
            { id: "option2", label: "Option 2", checked: false },
            { id: "option3", label: "Option 3", checked: false }
          ],
          titleFontFamily: "inherit",
          titleFontSize: 14,
          titleFontWeight: "600",
          titleTextColor: "var(--color-foreground)",
          optionFontFamily: "inherit",
          optionFontSize: 12,
          optionFontWeight: "normal",
          optionTextColor: "var(--color-foreground)"
        },
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 120 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      breadcrumb: {
        content: "Home > About > Contact",
        props: {
          items: [
            { id: "home", label: "Home", href: "/", isLast: false },
            { id: "about", label: "About", href: "/about", isLast: false },
            { id: "contact", label: "Contact", href: "/contact", isLast: true }
          ],
          separator: "/",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-primary)",
          separatorColor: "var(--color-muted-foreground)",
          lastItemColor: "var(--color-muted-foreground)"
        },
        styles: { padding: "0.5rem", backgroundColor: "var(--color-muted)", borderRadius: "0.375rem", color: "var(--color-foreground)", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 35 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      pagination: {
        content: "1 2 3 ... 10",
        props: {
          items: [
            { id: "prev", label: "←", type: "prev", isActive: false },
            { id: "1", label: "1", type: "page", isActive: true },
            { id: "2", label: "2", type: "page", isActive: false },
            { id: "3", label: "3", type: "page", isActive: false },
            { id: "ellipsis", label: "...", type: "ellipsis", isActive: false },
            { id: "10", label: "10", type: "page", isActive: false },
            { id: "next", label: "→", type: "next", isActive: false }
          ],
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: "normal",
          textColor: "var(--color-foreground)",
          activeTextColor: "var(--color-primary-foreground)",
          activeBgColor: "var(--color-primary)",
          borderColor: "var(--color-border)",
          hoverBgColor: "var(--color-muted)"
        },
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
        props: {
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "medium",
          textColor: "var(--color-destructive-foreground)",
          backgroundColor: "var(--color-destructive)"
        },
        styles: { padding: "0.75rem", backgroundColor: "var(--color-destructive)", color: "var(--color-destructive-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 50 },
        animations: { type: "shake", duration: 500, delay: 0 },
      },
      toast: {
        content: "Toast notification",
        props: {
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-foreground)",
          backgroundColor: "var(--color-card)",
          iconColor: "currentColor"
        },
        styles: { padding: "0.75rem", backgroundColor: "var(--color-card)", color: "var(--color-foreground)", borderRadius: "0.375rem", fontSize: "0.875rem", textAlign: "center", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 50 },
        animations: { type: "slideIn", duration: 300, delay: 0, direction: "up" },
      },
      // Content & Text Components
      "code-block": {
        content: "console.log('Hello World');",
        props: {
          language: "javascript",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-foreground)"
        },
        styles: { padding: "1rem", backgroundColor: "var(--color-muted)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "monospace", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 100 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      markdown: {
        content: "# Markdown Content\n\nThis is **bold** text and *italic* text.\n\n## Features\n- Easy to write\n- **Bold** and *italic*\n- `code snippets`\n\n> This is a blockquote",
        props: {
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-foreground)",
          headingColor: "var(--color-foreground)",
          linkColor: "var(--color-primary)",
          codeColor: "var(--color-muted-foreground)",
          codeBgColor: "var(--color-muted)"
        },
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontSize: "0.875rem", lineHeight: "1.6" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "rich-text": {
        content: "Rich Text Editor",
        props: {
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-foreground)",
          backgroundColor: "var(--color-card)",
          bold: false,
          italic: false,
          underline: false
        },
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontSize: "0.875rem" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      typography: {
        content: "Typography\nFont styles and sizes",
        props: {
          heading: "Typography",
          subtitle: "Font styles and sizes",
          headingFontFamily: "inherit",
          headingFontSize: 24,
          headingFontWeight: "bold",
          headingColor: "var(--color-foreground)",
          subtitleFontFamily: "inherit",
          subtitleFontSize: 14,
          subtitleFontWeight: "normal",
          subtitleColor: "var(--color-muted-foreground)",
          backgroundColor: "var(--color-card)"
        },
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "0.5rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontSize: "1.125rem", fontWeight: "600" },
        responsiveStyles: { desktop: { fontSize: "1.125rem" }, tablet: { fontSize: "1rem" }, mobile: { fontSize: "0.95rem" } },
        position: { x: 100, y: 100, width: 250, height: 100 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      link: {
        content: "External Link",
        props: {
          url: "#",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-primary)",
          backgroundColor: "transparent",
          underline: true
        },
        styles: { padding: "0.5rem", backgroundColor: "transparent", color: "var(--color-primary)", fontSize: "0.875rem", cursor: "pointer" },
        responsiveStyles: { desktop: { fontSize: "0.875rem" }, tablet: { fontSize: "0.8rem" }, mobile: { fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 120, height: 30 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      tag: {
        content: "Tag",
        props: {
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: "500",
          textColor: "var(--color-primary-foreground)",
          backgroundColor: "var(--color-primary)",
          borderRadius: "9999px",
          padding: "0.25rem 0.75rem"
        },
        styles: {},
        responsiveStyles: { desktop: { fontSize: "0.75rem" }, tablet: { fontSize: "0.7rem" }, mobile: { fontSize: "0.65rem" } },
        position: { x: 100, y: 100, width: 60, height: 25 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      label: {
        content: "Label Text",
        props: {
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: "500",
          textColor: "var(--color-foreground)",
          backgroundColor: "var(--color-muted)",
          borderRadius: "0.25rem",
          padding: "0.25rem 0.5rem"
        },
        styles: {},
        responsiveStyles: { desktop: { fontSize: "0.75rem" }, tablet: { fontSize: "0.7rem" }, mobile: { fontSize: "0.65rem" } },
        position: { x: 100, y: 100, width: 80, height: 25 },
        animations: { type: "fadeIn", duration: 400, delay: 0 },
      },
      // File & Media Components
      "file-upload": {
        content: "Choose File",
        props: {
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-foreground)",
          backgroundColor: "var(--color-background)",
          borderColor: "var(--color-border)",
          borderRadius: "0.5rem",
          padding: "0.75rem",
          borderStyle: "dashed",
          borderWidth: "2px"
        },
        styles: {},
        responsiveStyles: { desktop: { padding: "0.75rem", fontSize: "0.875rem" }, tablet: { padding: "0.65rem", fontSize: "0.8rem" }, mobile: { padding: "0.6rem", fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 200, height: 80 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      "file-download": {
        content: "Download File",
        props: {
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-primary-foreground)",
          backgroundColor: "var(--color-primary)",
          borderRadius: "8px",
          padding: "0.75rem",
          iconColor: "var(--color-primary-foreground)",
          iconSize: 16
        },
        styles: {},
        responsiveStyles: { desktop: { padding: "0.75rem", fontSize: "0.875rem" }, tablet: { padding: "0.65rem", fontSize: "0.8rem" }, mobile: { padding: "0.6rem", fontSize: "0.75rem" } },
        position: { x: 100, y: 100, width: 150, height: 50 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      "pdf-viewer": {
        content: "PDF Document",
        props: {
          pdfUrl: "",
          fileName: "PDF Document",
          uploadedFile: null,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-foreground)",
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
          borderRadius: "0.5rem",
          padding: "1rem",
          showFileName: true,
          showUploadButton: true,
          allowFileUpload: true
        },
        styles: {},
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 300, height: 200 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      document: {
        content: "Document Viewer",
        props: {
          documentUrl: "",
          fileName: "Document Viewer",
          uploadedFile: null,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-foreground)",
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
          borderRadius: "0.5rem",
          padding: "1rem",
          showFileName: true,
          showUploadButton: true,
          allowFileUpload: true,
          documentType: "pdf" // pdf, doc, docx, txt, etc.
        },
        styles: {},
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 250, height: 150 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      folder: {
        content: "Folder Name",
        props: {
          folderName: "Folder Name",
          items: [
            { id: 1, name: "Document.pdf", type: "file", icon: "pdf" },
            { id: 2, name: "Image.jpg", type: "file", icon: "image" },
            { id: 3, name: "Subfolder", type: "folder", icon: "folder" }
          ],
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: "normal",
          textColor: "var(--color-foreground)",
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
          borderRadius: "0.5rem",
          padding: "1rem",
          showItemCount: true,
          allowAddItems: true,
          allowDeleteItems: true,
          maxItems: 10
        },
        styles: {},
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 250, height: 200 },
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
        content: "",
        props: {
          progress: 75,
          showPercentage: true,
          animate: true,
          ringSize: "64px",
          strokeWidth: "4",
          progressColor: "var(--color-primary)",
          backgroundColor: "var(--color-muted)",
          textSize: "14px",
          textColor: "var(--color-foreground)",
          strokeLineCap: "round"
        },
        styles: { padding: "1rem", backgroundColor: "var(--color-card)", borderRadius: "50%", border: "1px solid var(--color-border)", textAlign: "center", color: "var(--color-foreground)", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" },
        responsiveStyles: { desktop: { padding: "1rem" }, tablet: { padding: "0.875rem" }, mobile: { padding: "0.75rem" } },
        position: { x: 100, y: 100, width: 80, height: 80 },
        animations: { type: "pulse", duration: 2000, delay: 0 },
      },
      notification: {
        content: "🔔",
        props: {
          badgeCount: "3",
          badgeColor: "#dc2626",
          badgeTextColor: "#ffffff",
          iconColor: "var(--color-muted-foreground)",
          iconSize: "24px",
          badgeSize: "16px",
          badgeTextWeight: "500"
        },
        styles: { padding: "0.5rem", backgroundColor: "transparent", borderRadius: "0.375rem", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "0.5rem" }, tablet: { padding: "0.375rem" }, mobile: { padding: "0.25rem" } },
        position: { x: 100, y: 100, width: 48, height: 48 },
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
        content: "Success!",
        props: {
          fontSize: "14px",
          fontFamily: "inherit",
          fontWeight: "500",
          textColor: "#ffffff",
          backgroundColor: "#22c55e",
          iconColor: "#ffffff",
          iconSize: "16px"
        },
        styles: { padding: "0.75rem", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", borderRadius: "0.375rem", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "0.75rem" }, tablet: { padding: "0.625rem" }, mobile: { padding: "0.5rem" } },
        position: { x: 100, y: 100, width: 150, height: 50 },
        animations: { type: "bounce", duration: 600, delay: 300 },
      },
      "error-message": {
        content: "Error!",
        props: {
          fontSize: "14px",
          fontFamily: "inherit",
          fontWeight: "500",
          textColor: "#ffffff",
          backgroundColor: "#dc2626",
          iconColor: "#ffffff",
          iconSize: "16px"
        },
        styles: { padding: "0.75rem", backgroundColor: "var(--color-destructive)", color: "var(--color-destructive-foreground)", borderRadius: "0.375rem", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "0.75rem" }, tablet: { padding: "0.625rem" }, mobile: { padding: "0.5rem" } },
        position: { x: 100, y: 100, width: 120, height: 50 },
        animations: { type: "shake", duration: 500, delay: 0 },
      },
      "warning-message": {
        content: "Warning!",
        props: {
          fontSize: "14px",
          fontFamily: "inherit",
          fontWeight: "500",
          textColor: "#ffffff",
          backgroundColor: "#f59e0b",
          iconColor: "#ffffff",
          iconSize: "16px"
        },
        styles: { padding: "0.75rem", backgroundColor: "var(--color-secondary)", color: "var(--color-secondary-foreground)", borderRadius: "0.375rem", textAlign: "center" },
        responsiveStyles: { desktop: { padding: "0.75rem" }, tablet: { padding: "0.625rem" }, mobile: { padding: "0.5rem" } },
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
        position: { x: 100, y: 100, width: 300, height: 250 },
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
        position: { x: 100, y: 100, width: 400, height: 180 },
        animations: { type: "fadeIn", duration: 500, delay: 100 },
      },
      "login-form": {
        content: "Login Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 350, height: 280 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "registration-form": {
        content: "Registration Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 350, height: 320 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "survey-form": {
        content: "Survey Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 350, height: 310 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "order-form": {
        content: "Order Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 350, height: 270 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "booking-form": {
        content: "Booking Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 350, height: 280 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
      "feedback-form": {
        content: "Feedback Form",
        styles: { padding: "1.5rem", backgroundColor: "var(--color-card)", borderRadius: "0.75rem", border: "1px solid var(--color-border)", color: "var(--color-foreground)" },
        responsiveStyles: { desktop: { padding: "1.5rem" }, tablet: { padding: "1.25rem" }, mobile: { padding: "1rem" } },
        position: { x: 100, y: 100, width: 350, height: 270 },
        animations: { type: "fadeIn", duration: 600, delay: 200 },
      },
    }

    // Get the default position for this element type
    const defaultPosition = elementTemplates[type]?.position || { x: 100, y: 100, width: 200, height: 50 }
    
    // Store original dimensions in props for scaling calculations
    const originalDimensions = {
      originalWidth: defaultPosition.width,
      originalHeight: defaultPosition.height,
    }

    return {
      id,
      type: type as BuilderElement["type"],
      content: elementTemplates[type]?.content || "New Element",
      styles: elementTemplates[type]?.styles || {},
      responsiveStyles: elementTemplates[type]?.responsiveStyles || {},
      position: defaultPosition,
      props: {
        ...elementTemplates[type]?.props,
        ...originalDimensions,
      },
      animations: elementTemplates[type]?.animations,
    }
  }

  const getElementStyles = (element: BuilderElement): Record<string, any> => {
    const baseStyles = element.styles || {}
    const responsiveStyles = element.responsiveStyles?.[currentBreakpoint] || {}
    
    // Only apply auto-scaling if enabled
    if (element.props?.autoScale === false) {
      return { ...baseStyles, ...responsiveStyles }
    }
    
    // Get the element's original dimensions (stored when first created)
    // If not stored, use the position as the baseline
    const originalWidth = element.props?.originalWidth ?? element.position?.width ?? 200
    const originalHeight = element.props?.originalHeight ?? element.position?.height ?? 50
    
    // Get current dimensions (including transient changes during drag/resize)
    const currentWidth = transientRef.current.get(element.id)?.width ?? element.position?.width ?? originalWidth
    const currentHeight = transientRef.current.get(element.id)?.height ?? element.position?.height ?? originalHeight
    
    // Calculate scale factors
    const scaleX = currentWidth / originalWidth
    const scaleY = currentHeight / originalHeight
    const uniformScale = Math.min(scaleX, scaleY) // Use smaller scale to maintain proportions
    
    // Apply scaling to font sizes and other scalable properties
    const scaledStyles: Record<string, any> = {}
    
    Object.entries({ ...baseStyles, ...responsiveStyles }).forEach(([key, value]) => {
      // Handle string values with units (px, rem, em, etc.)
      if (typeof value === 'string') {
        // Handle pixel values
        if (value.includes('px')) {
          const numericValue = parseFloat(value)
          if (!isNaN(numericValue)) {
            // Scale font sizes, padding, margins, border radius, gaps, line height
            if (key.toLowerCase().includes('fontsize') || 
                key.toLowerCase().includes('font-size')) {
              scaledStyles[key] = `${numericValue * uniformScale}px`
            }
            else if (key.toLowerCase().includes('padding')) {
              scaledStyles[key] = `${numericValue * uniformScale}px`
            }
            else if (key.toLowerCase().includes('margin')) {
              scaledStyles[key] = `${numericValue * uniformScale}px`
            }
            else if (key.toLowerCase().includes('borderradius') || 
                     key.toLowerCase().includes('border-radius')) {
              scaledStyles[key] = `${numericValue * uniformScale}px`
            }
            else if (key.toLowerCase().includes('gap')) {
              scaledStyles[key] = `${numericValue * uniformScale}px`
            }
            else if (key.toLowerCase().includes('lineheight') || 
                     key.toLowerCase().includes('line-height')) {
              scaledStyles[key] = `${numericValue * uniformScale}px`
            }
            else if (key.toLowerCase().includes('borderwidth') || 
                     key.toLowerCase().includes('border-width')) {
              scaledStyles[key] = `${Math.max(1, numericValue * uniformScale)}px` // Min 1px for borders
            }
            // Scale internal width/height properties (but not the container itself)
            else if ((key.toLowerCase().includes('width') || key.toLowerCase().includes('height')) &&
                     (key !== 'width' && key !== 'height')) {
              if (key.toLowerCase().includes('width')) {
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
        }
        // Handle rem values
        else if (value.includes('rem')) {
          const numericValue = parseFloat(value)
          if (!isNaN(numericValue)) {
            if (key.toLowerCase().includes('fontsize') || 
                key.toLowerCase().includes('font-size') ||
                key.toLowerCase().includes('padding') ||
                key.toLowerCase().includes('margin') ||
                key.toLowerCase().includes('gap')) {
              scaledStyles[key] = `${numericValue * uniformScale}rem`
            } else {
              scaledStyles[key] = value
            }
          } else {
            scaledStyles[key] = value
          }
        }
        // Handle em values
        else if (value.includes('em')) {
          const numericValue = parseFloat(value)
          if (!isNaN(numericValue)) {
            if (key.toLowerCase().includes('fontsize') || 
                key.toLowerCase().includes('font-size') ||
                key.toLowerCase().includes('padding') ||
                key.toLowerCase().includes('margin') ||
                key.toLowerCase().includes('gap')) {
              scaledStyles[key] = `${numericValue * uniformScale}em`
            } else {
              scaledStyles[key] = value
            }
          } else {
            scaledStyles[key] = value
          }
        }
        else {
          scaledStyles[key] = value
        }
      } 
      // Handle numeric values (without units)
      else if (typeof value === 'number') {
        if (key.toLowerCase().includes('fontsize') || 
            key.toLowerCase().includes('font-size')) {
          scaledStyles[key] = value * uniformScale
        } else {
          scaledStyles[key] = value
        }
      } 
      else {
        scaledStyles[key] = value
      }
    })
    
    return scaledStyles
  }

  const getFormInputStyles = (element: BuilderElement) => {
    const baseStyles = {
      fontFamily: element.props?.inputFontFamily || 'inherit',
      padding: element.props?.inputPadding || '8px 12px',
      fontSize: element.props?.inputFontSize || '12px',
      fontWeight: element.props?.inputFontWeight || '400',
      borderRadius: element.props?.inputBorderRadius || '4px',
      borderColor: element.props?.inputBorderColor || '#374151',
      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
      color: element.props?.inputTextColor || '#ffffff'
    }
    
    // Only apply scaling if autoScale is enabled
    if (element.props?.autoScale === false) {
      return baseStyles
    }
    
    // Get original and current dimensions
    const originalWidth = element.props?.originalWidth ?? element.position?.width ?? 200
    const originalHeight = element.props?.originalHeight ?? element.position?.height ?? 50
    const currentWidth = transientRef.current.get(element.id)?.width ?? element.position?.width ?? originalWidth
    const currentHeight = transientRef.current.get(element.id)?.height ?? element.position?.height ?? originalHeight
    
    const scaleX = currentWidth / originalWidth
    const scaleY = currentHeight / originalHeight
    const uniformScale = Math.min(scaleX, scaleY)
    
    // Apply scaling to input styles
    return {
      ...baseStyles,
      fontSize: `${parseFloat(baseStyles.fontSize) * uniformScale}px`,
      padding: baseStyles.padding.split(' ').map((p: string) => `${parseFloat(p) * uniformScale}px`).join(' '),
      borderRadius: `${parseFloat(baseStyles.borderRadius) * uniformScale}px`,
    }
  }

  const getFormButtonStyles = (element: BuilderElement) => {
    const baseStyles = {
      fontFamily: element.props?.buttonFontFamily || 'inherit',
      padding: element.props?.buttonPadding || '8px 12px',
      fontSize: element.props?.buttonFontSize || '12px',
      fontWeight: element.props?.buttonFontWeight || '500',
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
    
    // Get original and current dimensions
    const originalWidth = element.props?.originalWidth ?? element.position?.width ?? 200
    const originalHeight = element.props?.originalHeight ?? element.position?.height ?? 50
    const currentWidth = transientRef.current.get(element.id)?.width ?? element.position?.width ?? originalWidth
    const currentHeight = transientRef.current.get(element.id)?.height ?? element.position?.height ?? originalHeight
    
    const scaleX = currentWidth / originalWidth
    const scaleY = currentHeight / originalHeight
    const uniformScale = Math.min(scaleX, scaleY)
    
    // Apply scaling to button styles
    return {
      ...baseStyles,
      fontSize: `${parseFloat(baseStyles.fontSize) * uniformScale}px`,
      padding: baseStyles.padding.split(' ').map((p: string) => `${parseFloat(p) * uniformScale}px`).join(' '),
      borderRadius: `${parseFloat(baseStyles.borderRadius) * uniformScale}px`,
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

  // Get minimum dimensions for an element based on its type and content (Logic 1)
  const getElementMinDimensions = useCallback((element: BuilderElement): { minWidth: number, minHeight: number } => {
    // Base minimum sizes
    const baseMinWidth = 40
    const baseMinHeight = 30
    
    // Type-specific minimums
    const typeMinimums: Record<string, { minWidth?: number, minHeight?: number }> = {
      'heading': { minWidth: 100, minHeight: 40 },
      'paragraph': { minWidth: 120, minHeight: 50 },
      'button': { minWidth: 80, minHeight: 36 },
      'image': { minWidth: 60, minHeight: 60 },
      'card': { minWidth: 150, minHeight: 100 },
      'form': { minWidth: 200, minHeight: 150 },
      'input': { minWidth: 120, minHeight: 36 },
      'textarea': { minWidth: 150, minHeight: 80 },
      'select': { minWidth: 120, minHeight: 36 },
      'video': { minWidth: 200, minHeight: 150 },
      'gallery': { minWidth: 200, minHeight: 150 },
      'table': { minWidth: 200, minHeight: 100 },
      'chart': { minWidth: 200, minHeight: 150 },
      'carousel': { minWidth: 200, minHeight: 150 },
      'modal': { minWidth: 250, minHeight: 150 },
      'tabs': { minWidth: 200, minHeight: 100 },
      'counter': { minWidth: 100, minHeight: 80 },
      'icon': { minWidth: 24, minHeight: 24 },
      'badge': { minWidth: 40, minHeight: 24 },
      'avatar': { minWidth: 40, minHeight: 40 },
    }
    
    const typeMin = typeMinimums[element.type] || {}
    
    // Content-based adjustments
    let contentMinWidth = baseMinWidth
    let contentMinHeight = baseMinHeight
    
    if (element.content && element.content.length > 0) {
      // Estimate minimum width based on content length (rough approximation)
      const estimatedCharWidth = 8
      contentMinWidth = Math.min(300, Math.max(baseMinWidth, element.content.length * estimatedCharWidth))
    }
    
    // For elements with internal components (forms, cards, etc.), use larger minimums
    if (element.children && element.children.length > 0) {
      contentMinWidth = Math.max(contentMinWidth, 150)
      contentMinHeight = Math.max(contentMinHeight, 100)
    }
    
    return {
      minWidth: Math.max(typeMin.minWidth || baseMinWidth, contentMinWidth),
      minHeight: Math.max(typeMin.minHeight || baseMinHeight, contentMinHeight)
    }
  }, [])

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
    
    // Get minimum dimensions for this element (Logic 1)
    const { minWidth, minHeight } = getElementMinDimensions(element)

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
        nextWidth = Math.max(minWidth, localX - startPos.x)
      }
      if (isS) {
        nextHeight = Math.max(minHeight, localY - startPos.y)
      }
      if (isW) {
        const rawW = Math.max(minWidth, startPos.x + (startPos.width || 0) - localX)
        const snappedW = snapSettings.enabled && startPos.width !== undefined
          ? snapToGrid(rawW, snapSettings.gridSize)
          : rawW
        nextWidth = Math.max(minWidth, snappedW)
        nextX = startPos.x + (startPos.width! - nextWidth)
      }
      if (isN) {
        const rawH = Math.max(minHeight, startPos.y + (startPos.height || 0) - localY)
        const snappedH = snapSettings.enabled && startPos.height !== undefined
          ? snapToGrid(rawH, snapSettings.gridSize)
          : rawH
        nextHeight = Math.max(minHeight, snappedH)
        nextY = startPos.y + (startPos.height! - nextHeight)
      }
      const snappedW = snapSettings.enabled && startPos.width !== undefined
        ? snapToGrid(nextWidth, snapSettings.gridSize)
        : nextWidth
      const snappedH = snapSettings.enabled && startPos.height !== undefined
        ? snapToGrid(nextHeight, snapSettings.gridSize)
        : nextHeight
      
      // Enforce minimum dimensions one more time after snapping
      const finalWidth = Math.max(minWidth, snappedW)
      const finalHeight = Math.max(minHeight, snappedH)
      
      // Update transient size/position and render on next animation frame (no global commit yet)
      const prev = transientRef.current.get(elementId) || {}
      const payload: any = { width: finalWidth, height: finalHeight }
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

  const handleRotateMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const element = elements.find((el) => el.id === elementId)
    if (!element?.position) return
    setIsRotating(elementId)
    
    if (!canvasEl) return
    const rect = canvasEl.getBoundingClientRect()
    const scale = zoom / 100
    
    // Get element center point
    const centerX = element.position.x + (element.position.width || 0) / 2
    const centerY = element.position.y + (element.position.height || 0) / 2
    
    // Get initial rotation (from element props or 0)
    const startRotation = element.props?.rotation || 0
    
    // Calculate initial angle from center to mouse
    const startMouseX = (e.clientX - rect.left) / scale
    const startMouseY = (e.clientY - rect.top) / scale
    const startAngle = Math.atan2(startMouseY - centerY, startMouseX - centerX) * (180 / Math.PI)
    
    const onMouseMove = (ev: MouseEvent) => {
      const mouseX = (ev.clientX - rect.left) / scale
      const mouseY = (ev.clientY - rect.top) / scale
      
      // Calculate current angle from center to mouse
      const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI)
      
      // Calculate rotation delta
      const angleDelta = currentAngle - startAngle
      
      // Apply rotation (allow full 360 degrees)
      let nextRotation = startRotation + angleDelta
      
      // Normalize to 0-360 range
      nextRotation = ((nextRotation % 360) + 360) % 360
      
      // Update transient rotation and render on next animation frame
      const prev = transientRef.current.get(elementId) || {}
      transientRef.current.set(elementId, { ...prev, rotation: nextRotation })
      scheduleRerender()
    }
    
    const onMouseUp = () => {
      setIsRotating(null)
      // Commit final rotation
      const last = transientRef.current.get(elementId)
      if (last?.rotation != null) {
        onUpdateElement(elementId, {
          props: {
            ...element.props,
            rotation: last.rotation
          }
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
    
    // Store initial section heights for resizing logic
    const initialSections = sections.map(s => s.height)
    
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
        // Logic 1: Dragging header-bottom boundary (top of section 1)
        // Positive dy = dragging down → header expands, section 1 shrinks
        // Negative dy = dragging up → header shrinks, section 1 expands
        
        let nextHeader = state.startHeader + dy
        
        // Calculate the corresponding section 1 height change
        // If only one section exists, adjust it; otherwise adjust the first section
        if (sections.length > 0) {
          const firstSectionInitialHeight = initialSections[0]
          let nextFirstSectionHeight = firstSectionInitialHeight - dy
          
          // NEW: Calculate minimum heights based on largest elements
          const minHeaderHeight = getMinRegionHeight('header')
          const minFirstSectionHeight = getMinRegionHeight('section', 0)
          
          // Enforce minimum sizes to prevent overlap and content loss
          nextHeader = Math.max(minHeaderHeight, nextHeader)
          nextFirstSectionHeight = Math.max(minFirstSectionHeight, nextFirstSectionHeight)
          
          // Ensure we don't exceed available space
          const maxHeader = state.canvasHeight - state.startFooter - minFirstSectionHeight
          nextHeader = Math.min(maxHeader, nextHeader)
          
          // Recalculate section height based on constrained header
          nextFirstSectionHeight = firstSectionInitialHeight - (nextHeader - state.startHeader)
          nextFirstSectionHeight = Math.max(minFirstSectionHeight, nextFirstSectionHeight)
          
          // Update both header and first section
          setHeaderHeight(nextHeader)
          setSections(prev => {
            const next = [...prev]
            next[0] = { ...next[0], height: nextFirstSectionHeight }
            return next
          })
        } else {
          // Fallback: no sections, just resize header
          const minHeaderHeight = getMinRegionHeight('header')
          const maxHeader = state.canvasHeight - state.startFooter - MIN_SECTION
          nextHeader = Math.max(minHeaderHeight, Math.min(maxHeader, nextHeader))
          setHeaderHeight(nextHeader)
        }
      } else {
        // Logic 2: Dragging footer-top boundary (bottom of last section)
        // Behavior depends on number of sections:
        // - Single section (default): Footer resizes inversely with section (Task 1 behavior)
        // - Multiple sections: Footer stays constant, only section resizes (Task 2+ behavior)
        
        if (sections.length > 0) {
          const lastSectionIndex = sections.length - 1
          const lastSectionInitialHeight = initialSections[lastSectionIndex]
          
          // Calculate new last section height
          // Positive dy = dragging down → section expands
          // Negative dy = dragging up → section shrinks
          let nextLastSectionHeight = lastSectionInitialHeight + dy
          
          // Calculate minimum height based on largest element in last section
          const minLastSectionHeight = getMinRegionHeight('section', lastSectionIndex)
          
          // Enforce minimum section size to prevent content overlap
          nextLastSectionHeight = Math.max(minLastSectionHeight, nextLastSectionHeight)
          
          // DIFFERENTIATE: Single section vs multiple sections
          if (sections.length === 1) {
            // DEFAULT CASE (header/section 1/footer): Footer resizes inversely
            // This maintains total canvas height and prevents black space
            let nextFooter = state.startFooter - dy
            
            // Calculate minimum footer height
            const minFooterHeight = getMinRegionHeight('footer')
            
            // Enforce minimum footer size
            nextFooter = Math.max(minFooterHeight, nextFooter)
            
            // Ensure we don't exceed available space
            const maxFooter = state.canvasHeight - state.startHeader - minLastSectionHeight
            nextFooter = Math.min(maxFooter, nextFooter)
            
            // Recalculate section height based on constrained footer
            nextLastSectionHeight = lastSectionInitialHeight - (nextFooter - state.startFooter)
            nextLastSectionHeight = Math.max(minLastSectionHeight, nextLastSectionHeight)
            
            // Update both footer and section (inverse relationship)
            setFooterHeight(nextFooter)
            setSections(prev => {
              const next = [...prev]
              next[lastSectionIndex] = { ...next[lastSectionIndex], height: nextLastSectionHeight }
              return next
            })
          } else {
            // MULTI-SECTION CASE: Footer stays constant, only section resizes
            // This allows canvas to expand/shrink dynamically
            setSections(prev => {
              const next = [...prev]
              next[lastSectionIndex] = { ...next[lastSectionIndex], height: nextLastSectionHeight }
              return next
            })
            // Footer height is NOT changed, only its position changes
          }
        }
        // If no sections exist, do nothing
      }
    }
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      boundaryDragRef.current = null
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [canvasEl, zoom, headerHeight, footerHeight, contentHeight, totalSectionsHeight, sections, getMinRegionHeight])

  // Resize footer by dragging its bottom boundary (expands/shrinks canvas)
  const footerBottomDragRef = useRef<{
    startY: number
    startFooter: number
    scale: number
  } | null>(null)
  
  const startFooterBottomResize = useCallback((clientY: number) => {
    if (!canvasEl) return
    const scale = zoom / 100
    
    footerBottomDragRef.current = {
      startY: clientY,
      startFooter: footerHeight,
      scale,
    }

    const onMouseMove = (ev: MouseEvent) => {
      const state = footerBottomDragRef.current
      if (!state) return
      const dy = (ev.clientY - state.startY) / state.scale
      
      // Dragging footer bottom boundary
      // Positive dy = dragging down → footer expands (canvas expands)
      // Negative dy = dragging up → footer shrinks (canvas shrinks)
      
      let nextFooter = state.startFooter + dy
      
      // Calculate minimum footer height based on content
      const minFooterHeight = getMinRegionHeight('footer')
      
      // Enforce minimum size
      nextFooter = Math.max(minFooterHeight, nextFooter)
      
      // Update footer height (this will automatically expand/shrink the canvas via contentHeight)
      setFooterHeight(nextFooter)
    }
    
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      footerBottomDragRef.current = null
    }
    
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [canvasEl, zoom, footerHeight, getMinRegionHeight])

  // Resize between sections by dragging a divider line (index is boundary between index and index+1)
  const sectionDividerDragRef = useRef<{
    index: number
    startY: number
    scale: number
    startTop: number
    startBottom: number
  } | null>(null)
  const startSectionDividerResize = useCallback((index: number, clientY: number) => {
    // Validate that we have sections to resize between
    if (index < 0 || index >= sections.length - 1) return
    
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
        
        // Calculate new heights
        // Positive dy = dragging down → top section grows, bottom section shrinks
        // Negative dy = dragging up → top section shrinks, bottom section grows
        let topH = st.startTop + dy
        let bottomH = st.startBottom - dy
        
        // Calculate minimum heights based on largest elements
        const minTopHeight = getMinRegionHeight('section', st.index)
        const minBottomHeight = getMinRegionHeight('section', st.index + 1)
        
        // Check if bottom section would go below minimum
        if (bottomH < minBottomHeight && dy > 0) {
          // User is trying to expand top section, but bottom is at minimum
          // SOLUTION: Expand canvas by growing top section while keeping bottom at minimum
          topH = st.startTop + dy
          bottomH = minBottomHeight
          // This naturally expands the canvas since total section height increases
        } 
        // Check if top section would go below minimum
        else if (topH < minTopHeight && dy < 0) {
          // User is trying to expand bottom section, but top is at minimum
          // SOLUTION: Expand canvas by growing bottom section while keeping top at minimum
          topH = minTopHeight
          bottomH = st.startBottom - dy
          // This naturally expands the canvas since total section height increases
        }
        // Normal case: both sections have room to resize
        else {
          // Enforce minimum section sizes
          topH = Math.max(minTopHeight, topH)
          bottomH = Math.max(minBottomHeight, bottomH)
          
          // Conserve total height (what one gains, other loses) - traditional behavior
          const totalAvailable = st.startTop + st.startBottom
          const constrainedTop = Math.min(topH, totalAvailable - minBottomHeight)
          const constrainedBottom = totalAvailable - constrainedTop
          
          topH = constrainedTop
          bottomH = constrainedBottom
        }
        
        // Apply the calculated values
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
  }, [sections, zoom, getMinRegionHeight])

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
    
    // Get rotation (from transient during rotation, or from element props, or 0)
    const rotation = transient?.rotation ?? element.props?.rotation ?? 0

    const isActiveMove = draggedElementId === element.id
    const isActiveResize = isResizing === element.id
    const isActiveRotate = isRotating === element.id

    return (
      <div
        key={element.id}
        className={`
          absolute cursor-pointer rounded-md group
          ${isActiveMove || isActiveResize || isActiveRotate ? "transition-none" : "transition-all duration-200"}
          ${isSelected ? "ring-2 ring-primary bg-primary/20" : "hover:bg-primary/10"}
          ${isActiveMove ? "z-50" : "z-10"}
        `}
        style={{
          left: position.x,
          top: position.y,
          width: finalWidth,
          height: finalHeight,
          transform: (() => {
            const transforms = []
            if (dx !== 0 || dy !== 0) transforms.push(`translate(${dx}px, ${dy}px)`)
            if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`)
            return transforms.length > 0 ? transforms.join(' ') : undefined
          })(),
          transformOrigin: 'center center',
          willChange: (dx !== 0 || dy !== 0) ? "transform" : isActiveResize ? "width, height" : isActiveRotate ? "transform" : undefined,
        }}
        onClick={(e) => handleElementClick(e, element.id)}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
      >
        {/* Element content */}
        <div 
          className={`w-full h-full ${element.type === 'select' && element.props?.previewMode ? 'overflow-visible' : 'overflow-hidden'}`}
          style={{
            padding: 0
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
        style={{
          ...elementStyles,
          fontFamily: element.props?.inputFontFamily === "default" || element.props?.inputFontFamily === "inherit" ? undefined : element.props?.inputFontFamily,
          fontSize: element.props?.inputFontSize ? `${element.props.inputFontSize}px` : undefined,
          fontWeight: element.props?.inputFontWeight || undefined,
          color: element.props?.inputTextColor || undefined,
        }}
      />
    )}
    {element.type === "textarea" && (
      <textarea
        placeholder={element.content}
        rows={element.props?.rows || 4}
        className="w-full h-full bg-background text-foreground border border-border rounded-md px-3 py-2 resize-none"
        style={{
          ...elementStyles,
          fontFamily: element.props?.textareaFontFamily === "default" || element.props?.textareaFontFamily === "inherit" ? undefined : element.props?.textareaFontFamily,
          fontSize: element.props?.textareaFontSize ? `${element.props.textareaFontSize}px` : undefined,
          fontWeight: element.props?.textareaFontWeight || undefined,
          color: element.props?.textareaTextColor || undefined,
        }}
      />
    )}
    {element.type === "select" && (
      <>
        {/* Normal Mode: Interactive Select */}
        {!element.props?.previewMode && (
          <div className="w-full h-full flex items-center relative z-50" style={elementStyles}>
            <Select 
              value={element.props?.selectedValue || element.props?.defaultValue || undefined}
              onValueChange={(value) => {
                // Update the selected value in element props
                onUpdateElement(element.id, { 
                  props: { 
                    ...element.props, 
                    selectedValue: value 
                  } 
                })
              }}
              required={element.props?.required || false}
              disabled={element.props?.disabled || false}
            >
              <SelectTrigger 
                className="w-full bg-background border-border hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                style={{
                  fontFamily: element.props?.placeholderFontFamily || undefined,
                  fontSize: element.props?.placeholderFontSize ? `${element.props.placeholderFontSize}px` : undefined,
                  fontWeight: element.props?.placeholderFontWeight || undefined,
                  color: element.props?.placeholderTextColor || undefined,
                }}
              >
                <SelectValue placeholder={element.props?.placeholder || "Select..."} />
              </SelectTrigger>
              <SelectContent 
                className="bg-background border-border z-[9999]"
                style={{
                  fontFamily: element.props?.optionsFontFamily || undefined,
                  fontSize: element.props?.optionsFontSize ? `${element.props.optionsFontSize}px` : undefined,
                  fontWeight: element.props?.optionsFontWeight || undefined,
                  color: element.props?.optionsTextColor || undefined,
                }}
              >
                {(element.props?.options || ["Option 1", "Option 2", "Option 3"]).map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Preview Mode: Always Visible Dropdown */}
        {element.props?.previewMode && (
          <div className="w-full h-full flex items-center relative" style={elementStyles}>
            <div className="w-full pointer-events-none">
              <div 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm flex items-center justify-between"
                style={{
                  fontFamily: element.props?.placeholderFontFamily || undefined,
                  fontSize: element.props?.placeholderFontSize ? `${element.props.placeholderFontSize}px` : undefined,
                  fontWeight: element.props?.placeholderFontWeight || undefined,
                  color: element.props?.placeholderTextColor || undefined,
                }}
              >
                <span>{element.props?.defaultValue || element.props?.placeholder || "Select..."}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              {/* Always visible dropdown */}
              <div 
                className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-auto"
                style={{
                  top: '100%',
                  left: 0,
                  right: 0,
                  fontFamily: element.props?.optionsFontFamily || undefined,
                  fontSize: element.props?.optionsFontSize ? `${element.props.optionsFontSize}px` : undefined,
                  fontWeight: element.props?.optionsFontWeight || undefined,
                  color: element.props?.optionsTextColor || undefined,
                }}
              >
                {(element.props?.options || ["Option 1", "Option 2", "Option 3"]).map((option: string, index: number) => (
                  <div 
                    key={index} 
                    className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                    style={{
                      fontFamily: element.props?.optionsFontFamily || undefined,
                      fontSize: element.props?.optionsFontSize ? `${element.props.optionsFontSize}px` : undefined,
                      fontWeight: element.props?.optionsFontWeight || undefined,
                      color: element.props?.optionsTextColor || undefined,
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    )}
    {element.type === "checkbox" && (
      <div className="text-card-foreground w-full h-full flex items-center gap-2" style={elementStyles}>
        <input type="checkbox" className="w-4 h-4" />
        <span 
          className="text-sm"
          style={{
            fontFamily: element.props?.checkboxFontFamily || undefined,
            fontSize: element.props?.checkboxFontSize ? `${element.props.checkboxFontSize}px` : undefined,
            fontWeight: element.props?.checkboxFontWeight || undefined,
            color: element.props?.checkboxTextColor || undefined,
          }}
        >
          {element.content}
        </span>
      </div>
    )}
    {element.type === "radio" && (
      <div className="text-card-foreground w-full h-full flex items-center gap-2" style={elementStyles}>
        <input 
          type="radio" 
          name={element.props?.groupName || "radio-group"} 
          className="w-4 h-4" 
          checked={element.props?.checked || false}
          readOnly
        />
        <span 
          className="text-sm"
          style={{
            fontFamily: element.props?.radioFontFamily || undefined,
            fontSize: element.props?.radioFontSize ? `${element.props.radioFontSize}px` : undefined,
            fontWeight: element.props?.radioFontWeight || undefined,
            color: element.props?.radioTextColor || undefined,
          }}
        >
          {element.content}
        </span>
      </div>
    )}
    {element.type === "switch" && (
      <div className="text-card-foreground w-full h-full flex items-center gap-2" style={elementStyles}>
        <div 
          className={`w-10 h-6 rounded-full relative transition-colors ${element.props?.checked ? 'bg-primary' : 'bg-muted'}`}
          style={{
            backgroundColor: element.props?.checked ? (element.props?.switchColor || '#3b82f6') : undefined,
          }}
        >
          <div 
            className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
            style={{
              transform: element.props?.checked ? 'translateX(20px)' : 'translateX(2px)',
            }}
          />
        </div>
        <span 
          className="text-sm"
          style={{
            fontFamily: element.props?.switchFontFamily || undefined,
            fontSize: element.props?.switchFontSize ? `${element.props.switchFontSize}px` : undefined,
            fontWeight: element.props?.switchFontWeight || undefined,
            color: element.props?.switchTextColor || undefined,
          }}
        >
          {element.content}
        </span>
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
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        {element.props?.previewMode ? (
          // Preview Mode - Show modal directly in canvas (exact same as popup)
          <div 
            className="w-full h-full bg-black/80 overflow-auto"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            {(() => {
              const modalType = element.props?.modalType || 'default';
              const modalSize = element.props?.modalSize || 'medium';
              const showInputs = element.props?.showInputs || false;
              
              // Modal type colors and icons (SAME as popup)
              const typeConfig: any = {
                default: { 
                  bg: 'bg-card', 
                  icon: '', 
                  iconColor: '',
                  cancelBg: 'bg-muted hover:bg-muted/80',
                  cancelText: 'text-foreground',
                  confirmBg: 'bg-primary hover:bg-primary/90',
                  confirmText: 'text-primary-foreground'
                },
                success: { 
                  bg: 'bg-green-950', 
                  icon: '✓', 
                  iconColor: 'text-green-400',
                  cancelBg: 'bg-green-900/50 hover:bg-green-900/70',
                  cancelText: 'text-green-200',
                  confirmBg: 'bg-green-600 hover:bg-green-700',
                  confirmText: 'text-white'
                },
                error: { 
                  bg: 'bg-red-950', 
                  icon: '✕', 
                  iconColor: 'text-red-400',
                  cancelBg: 'bg-red-900/50 hover:bg-red-900/70',
                  cancelText: 'text-red-200',
                  confirmBg: 'bg-red-600 hover:bg-red-700',
                  confirmText: 'text-white'
                },
                warning: { 
                  bg: 'bg-yellow-950', 
                  icon: '⚠', 
                  iconColor: 'text-yellow-400',
                  cancelBg: 'bg-yellow-900/50 hover:bg-yellow-900/70',
                  cancelText: 'text-yellow-200',
                  confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
                  confirmText: 'text-white'
                },
                info: { 
                  bg: 'bg-blue-950', 
                  icon: 'ℹ', 
                  iconColor: 'text-blue-400',
                  cancelBg: 'bg-blue-900/50 hover:bg-blue-900/70',
                  cancelText: 'text-blue-200',
                  confirmBg: 'bg-blue-600 hover:bg-blue-700',
                  confirmText: 'text-white'
                }
              };
              
              // Modal size (SAME as popup)
              const sizeStyles: any = {
                small: { width: '384px', maxWidth: '90%' },
                medium: { width: '448px', maxWidth: '90%' },
                large: { width: '672px', maxWidth: '90%' },
                fullscreen: { width: '95%', height: '95%', maxHeight: '95vh', overflow: 'auto' }
              };
              
              return (
                <div 
                  className={`${typeConfig[modalType].bg} border border-border rounded-lg shadow-2xl p-6`}
                  style={sizeStyles[modalSize]}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {typeConfig[modalType].icon && (
                        <div className={`text-2xl ${typeConfig[modalType].iconColor}`}>
                          {typeConfig[modalType].icon}
                        </div>
                      )}
                      <h3 
                        className="text-lg font-semibold"
                        style={{
                          ...(element.props?.titleFontFamily && element.props.titleFontFamily !== 'inherit' && { fontFamily: element.props.titleFontFamily }),
                          ...(element.props?.titleFontSize && { fontSize: element.props.titleFontSize + 'px' }),
                          ...(element.props?.titleFontWeight && { fontWeight: element.props.titleFontWeight }),
                          ...(element.props?.titleColor && { color: element.props.titleColor })
                        }}
                      >
                        {element.content || 'Modal Title'}
                      </h3>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
                  </div>
                  
                  {/* Body */}
                  <div 
                    className="text-sm text-muted-foreground mb-4"
                    style={{
                      ...(element.props?.contentFontFamily && element.props.contentFontFamily !== 'inherit' && { fontFamily: element.props.contentFontFamily }),
                      ...(element.props?.contentFontSize && { fontSize: element.props.contentFontSize + 'px' }),
                      ...(element.props?.contentFontWeight && { fontWeight: element.props.contentFontWeight }),
                      ...(element.props?.contentColor && { color: element.props.contentColor })
                    }}
                  >
                    {element.props?.modalContent || 'Modal Content'}
                  </div>
                  
                  {/* Input fields */}
                  {showInputs && (
                    <div className="space-y-3 my-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          {element.props?.input1Label || 'Email'}
                        </label>
                        <input
                          type="text"
                          placeholder={element.props?.input1Placeholder || 'Enter your email'}
                          className="w-full px-3 py-2 bg-sidebar-accent border border-sidebar-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          {element.props?.input2Label || 'Password'}
                        </label>
                        <input
                          type="password"
                          placeholder={element.props?.input2Placeholder || 'Enter your password'}
                          className="w-full px-3 py-2 bg-sidebar-accent border border-sidebar-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Footer - SAME styling as popup */}
                  <div className="mt-6 flex justify-end gap-2">
                    <button className={`px-4 py-2 text-sm rounded-md transition-colors ${typeConfig[modalType].cancelBg} ${typeConfig[modalType].cancelText}`}>
                      Cancel
                    </button>
                    <button className={`px-4 py-2 text-sm rounded-md transition-colors ${typeConfig[modalType].confirmBg} ${typeConfig[modalType].confirmText}`}>
                      Confirm
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          // Normal Mode - Show button
        <button
          onClick={() => {
            const modalType = element.props?.modalType || 'default';
            const modalSize = element.props?.modalSize || 'medium';
            const showInputs = element.props?.showInputs || false;
            const confirmAction = element.props?.confirmAction || 'close';
            
            // Modal type colors and icons
            const typeConfig: any = {
              default: { 
                bg: 'bg-card', 
                icon: '', 
                iconColor: '',
                cancelBg: 'bg-muted hover:bg-muted/80',
                cancelText: 'text-foreground',
                confirmBg: 'bg-primary hover:bg-primary/90',
                confirmText: 'text-primary-foreground'
              },
              success: { 
                bg: 'bg-green-950', 
                icon: '✓', 
                iconColor: 'text-green-400',
                cancelBg: 'bg-green-900/50 hover:bg-green-900/70',
                cancelText: 'text-green-200',
                confirmBg: 'bg-green-600 hover:bg-green-700',
                confirmText: 'text-white'
              },
              error: { 
                bg: 'bg-red-950', 
                icon: '✕', 
                iconColor: 'text-red-400',
                cancelBg: 'bg-red-900/50 hover:bg-red-900/70',
                cancelText: 'text-red-200',
                confirmBg: 'bg-red-600 hover:bg-red-700',
                confirmText: 'text-white'
              },
              warning: { 
                bg: 'bg-yellow-950', 
                icon: '⚠', 
                iconColor: 'text-yellow-400',
                cancelBg: 'bg-yellow-900/50 hover:bg-yellow-900/70',
                cancelText: 'text-yellow-200',
                confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
                confirmText: 'text-white'
              },
              info: { 
                bg: 'bg-blue-950', 
                icon: 'ℹ', 
                iconColor: 'text-blue-400',
                cancelBg: 'bg-blue-900/50 hover:bg-blue-900/70',
                cancelText: 'text-blue-200',
                confirmBg: 'bg-blue-600 hover:bg-blue-700',
                confirmText: 'text-white'
              }
            };
            
            // Modal size classes
            const sizeConfig: any = {
              small: 'max-w-sm',
              medium: 'max-w-md',
              large: 'max-w-2xl',
              fullscreen: 'max-w-[95vw] max-h-[95vh] overflow-auto'
            };
            
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
            overlay.style.animation = 'fadeIn 0.2s ease-out';
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = typeConfig[modalType].bg + ' border border-border rounded-lg shadow-2xl p-6 ' + sizeConfig[modalSize] + ' w-full relative';
            modalContent.style.animation = 'slideIn 0.3s ease-out';
            
            // Modal header with icon
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between mb-4';
            
            const titleContainer = document.createElement('div');
            titleContainer.className = 'flex items-center gap-3';
            
            if (typeConfig[modalType].icon) {
              const icon = document.createElement('div');
              icon.className = 'text-2xl ' + typeConfig[modalType].iconColor;
              icon.textContent = typeConfig[modalType].icon;
              titleContainer.appendChild(icon);
            }
            
            const title = document.createElement('h3');
            title.className = 'text-lg font-semibold';
            title.textContent = element.content || 'Modal Title';
            // Apply typography styles
            if (element.props?.titleFontFamily && element.props.titleFontFamily !== 'inherit') {
              title.style.fontFamily = element.props.titleFontFamily;
            }
            if (element.props?.titleFontSize) {
              title.style.fontSize = element.props.titleFontSize + 'px';
            }
            if (element.props?.titleFontWeight) {
              title.style.fontWeight = element.props.titleFontWeight;
            }
            if (element.props?.titleColor) {
              title.style.color = element.props.titleColor;
            }
            titleContainer.appendChild(title);
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.className = 'text-muted-foreground hover:text-foreground text-xl leading-none';
            closeBtn.onclick = () => document.body.removeChild(overlay);
            
            header.appendChild(titleContainer);
            header.appendChild(closeBtn);
            
            // Modal body
            const body = document.createElement('div');
            body.className = 'text-sm text-muted-foreground mb-4';
            body.textContent = element.props?.modalContent || 'Modal Content';
            // Apply typography styles
            if (element.props?.contentFontFamily && element.props.contentFontFamily !== 'inherit') {
              body.style.fontFamily = element.props.contentFontFamily;
            }
            if (element.props?.contentFontSize) {
              body.style.fontSize = element.props.contentFontSize + 'px';
            }
            if (element.props?.contentFontWeight) {
              body.style.fontWeight = element.props.contentFontWeight;
            }
            if (element.props?.contentColor) {
              body.style.color = element.props.contentColor;
            }
            
            // Input fields (if enabled)
            if (showInputs) {
              const inputsContainer = document.createElement('div');
              inputsContainer.className = 'space-y-3 my-4';
              
              // Input 1
              const input1Container = document.createElement('div');
              const label1 = document.createElement('label');
              label1.className = 'text-xs text-muted-foreground block mb-1';
              label1.textContent = element.props?.input1Label || 'Email';
              const input1 = document.createElement('input');
              input1.type = 'text';
              input1.placeholder = element.props?.input1Placeholder || 'Enter your email';
              input1.className = 'w-full px-3 py-2 bg-sidebar-accent border border-sidebar-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary';
              input1Container.appendChild(label1);
              input1Container.appendChild(input1);
              
              // Input 2
              const input2Container = document.createElement('div');
              const label2 = document.createElement('label');
              label2.className = 'text-xs text-muted-foreground block mb-1';
              label2.textContent = element.props?.input2Label || 'Password';
              const input2 = document.createElement('input');
              input2.type = 'password';
              input2.placeholder = element.props?.input2Placeholder || 'Enter your password';
              input2.className = 'w-full px-3 py-2 bg-sidebar-accent border border-sidebar-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary';
              input2Container.appendChild(label2);
              input2Container.appendChild(input2);
              
              inputsContainer.appendChild(input1Container);
              inputsContainer.appendChild(input2Container);
              body.appendChild(inputsContainer);
            }
            
            // Modal footer
            const footer = document.createElement('div');
            footer.className = 'mt-6 flex justify-end gap-2';
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'px-4 py-2 text-sm rounded-md transition-colors ' + typeConfig[modalType].cancelBg + ' ' + typeConfig[modalType].cancelText;
            cancelBtn.onclick = () => document.body.removeChild(overlay);
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Confirm';
            confirmBtn.className = 'px-4 py-2 text-sm rounded-md transition-colors ' + typeConfig[modalType].confirmBg + ' ' + typeConfig[modalType].confirmText;
            confirmBtn.onclick = () => {
              if (confirmAction === 'link' && element.props?.confirmUrl) {
                window.location.href = element.props.confirmUrl;
              } else if (confirmAction === 'alert') {
                alert(element.props?.alertMessage || 'Action completed!');
                document.body.removeChild(overlay);
              } else {
                document.body.removeChild(overlay);
              }
            };
            footer.appendChild(cancelBtn);
            footer.appendChild(confirmBtn);
            
            modalContent.appendChild(header);
            modalContent.appendChild(body);
            modalContent.appendChild(footer);
            overlay.appendChild(modalContent);
            
            // Close on overlay click
            overlay.onclick = (e) => {
              if (e.target === overlay) document.body.removeChild(overlay);
            };
            
            document.body.appendChild(overlay);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          style={{
            ...(element.props?.buttonFontFamily && element.props.buttonFontFamily !== 'inherit' && { fontFamily: element.props.buttonFontFamily }),
            ...(element.props?.buttonFontSize && { fontSize: element.props.buttonFontSize + 'px' }),
            ...(element.props?.buttonFontWeight && { fontWeight: element.props.buttonFontWeight }),
            ...(element.props?.buttonTextColor && { color: element.props.buttonTextColor }),
            ...(element.props?.buttonBgColor && { backgroundColor: element.props.buttonBgColor })
          }}
        >
          {element.props?.buttonText || 'Open Modal'}
        </button>
        )}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}} />
      </div>
    )}
    {element.type === "tooltip" && (
      <>
        {/* Normal Tooltip */}
        {!element.props?.previewMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="w-full h-full flex items-center justify-center text-sm text-muted-foreground hover:text-foreground cursor-help transition-colors duration-200"
                style={{
                  ...elementStyles,
                  ...(element.props?.triggerFontFamily && element.props.triggerFontFamily !== 'inherit' && { fontFamily: element.props.triggerFontFamily }),
                  ...(element.props?.triggerFontSize && { fontSize: element.props.triggerFontSize + 'px' }),
                  ...(element.props?.triggerFontWeight && { fontWeight: element.props.triggerFontWeight }),
                  ...(element.props?.triggerTextColor && { color: element.props.triggerTextColor })
                }}
              >
                <span>
                  {element.props?.triggerText || 'Hover me'}
                </span>
      </div>
            </TooltipTrigger>
            <TooltipContent 
              side={element.props?.position || 'top'}
              className="max-w-xs"
              style={{
                ...(element.props?.tooltipFontFamily && element.props.tooltipFontFamily !== 'inherit' && { fontFamily: element.props.tooltipFontFamily }),
                ...(element.props?.tooltipFontSize && { fontSize: element.props.tooltipFontSize + 'px' }),
                ...(element.props?.tooltipFontWeight && { fontWeight: element.props.tooltipFontWeight }),
                ...(element.props?.tooltipTextColor && { color: element.props.tooltipTextColor })
              }}
            >
              {element.content || 'Tooltip text'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Preview Mode - Always Visible Tooltip */}
        {element.props?.previewMode && (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground hover:text-foreground cursor-help transition-colors duration-200" style={elementStyles}>
            <span style={{
              ...(element.props?.triggerFontFamily && element.props.triggerFontFamily !== 'inherit' && { fontFamily: element.props.triggerFontFamily }),
              ...(element.props?.triggerFontSize && { fontSize: element.props.triggerFontSize + 'px' }),
              ...(element.props?.triggerFontWeight && { fontWeight: element.props.triggerFontWeight }),
              ...(element.props?.triggerTextColor && { color: element.props.triggerTextColor })
            }}>
              {element.props?.triggerText || 'Hover me'}
            </span>
            
            {/* Always visible tooltip */}
            <div 
              className="absolute z-50 w-fit origin-center rounded-lg px-3 py-2 text-xs text-balance shadow-lg bg-gradient-to-br from-popover via-popover to-popover/95 border border-border/50 backdrop-blur-sm text-popover-foreground animate-in fade-in-0 zoom-in-95 duration-200"
              style={{
                ...(element.props?.position === 'top' && { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px' }),
                ...(element.props?.position === 'bottom' && { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '4px' }),
                ...(element.props?.position === 'left' && { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '4px' }),
                ...(element.props?.position === 'right' && { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '4px' }),
                ...(element.props?.tooltipFontFamily && element.props.tooltipFontFamily !== 'inherit' && { fontFamily: element.props.tooltipFontFamily }),
                ...(element.props?.tooltipFontSize && { fontSize: element.props.tooltipFontSize + 'px' }),
                ...(element.props?.tooltipFontWeight && { fontWeight: element.props.tooltipFontWeight }),
                ...(element.props?.tooltipTextColor && { color: element.props.tooltipTextColor })
              }}
            >
              {element.content || 'Tooltip text'}
            </div>
          </div>
        )}
      </>
    )}
    {element.type === "dropdown" && (
      <div className="w-full h-full flex items-center" style={elementStyles}>
        <Select defaultValue={element.props?.defaultValue || ""}>
          <SelectTrigger 
            className="w-full h-auto min-h-[40px] text-card-foreground hover:bg-card/80 transition-colors"
            style={{
              ...(element.props?.labelFontFamily && element.props.labelFontFamily !== 'inherit' && element.props.labelFontFamily !== 'default' && { fontFamily: element.props.labelFontFamily }),
              ...(element.props?.labelFontSize && { fontSize: element.props.labelFontSize + 'px' }),
              ...(element.props?.labelFontWeight && { fontWeight: element.props.labelFontWeight }),
              ...(element.props?.labelTextColor && { color: element.props.labelTextColor })
            }}
          >
            <SelectValue placeholder={element.content || "Select option"} />
          </SelectTrigger>
          <SelectContent>
            {(element.props?.options || []).map((option: string, index: number) => (
              <SelectItem 
                key={index} 
                value={option}
                style={{
                  ...(element.props?.optionFontFamily && element.props.optionFontFamily !== 'inherit' && element.props.optionFontFamily !== 'default' && { fontFamily: element.props.optionFontFamily }),
                  ...(element.props?.optionFontSize && { fontSize: element.props.optionFontSize + 'px' }),
                  ...(element.props?.optionFontWeight && { fontWeight: element.props.optionFontWeight }),
                  ...(element.props?.optionTextColor && { color: element.props.optionTextColor })
                }}
              >
                {option}
              </SelectItem>
            ))}
            {(element.props?.options || []).length === 0 && (
              <SelectItem value="no-options" disabled>
                No options available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    )}
    {element.type === "tabs" && (
      <div className="w-full h-full" style={elementStyles}>
        <TabsComponent element={element} />
      </div>
    )}
    {element.type === "carousel" && (
      <CarouselComponent element={element} />
    )}
    {element.type === "table" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg overflow-hidden" style={elementStyles}>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {Array.from({ length: element.props?.columns || 3 }, (_, i) => (
                <th 
                  key={i} 
                  className="p-2 text-left"
                  style={{
                    fontFamily: element.props?.headerFontFamily === "default" || element.props?.headerFontFamily === "inherit" ? undefined : element.props?.headerFontFamily,
                    fontSize: element.props?.headerFontSize ? `${element.props.headerFontSize}px` : undefined,
                    fontWeight: element.props?.headerFontWeight === "default" || element.props?.headerFontWeight === "inherit" ? undefined : element.props?.headerFontWeight,
                    color: element.props?.headerTextColor || undefined
                  }}
                >
                  {element.props?.tableData?.headers?.[i] || `Header ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: element.props?.rows || 4 }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border">
                {Array.from({ length: element.props?.columns || 3 }, (_, colIndex) => (
                  <td 
                    key={`${rowIndex}-${colIndex}`} 
                    className="p-2"
                    style={{
                      fontFamily: element.props?.contentFontFamily === "default" || element.props?.contentFontFamily === "inherit" ? undefined : element.props?.contentFontFamily,
                      fontSize: element.props?.contentFontSize ? `${element.props.contentFontSize}px` : undefined,
                      fontWeight: element.props?.contentFontWeight === "default" || element.props?.contentFontWeight === "inherit" ? undefined : element.props?.contentFontWeight,
                      color: element.props?.contentTextColor || undefined
                    }}
                  >
                    {element.props?.tableData?.rows?.[rowIndex]?.[colIndex] || `Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                  </td>
                ))}
            </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    {element.type === "chart" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex flex-col p-4" style={elementStyles}>
        <div className="text-center mb-4">
          <h3 className="text-sm font-medium">{element.content || "Chart"}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          {element.props?.chartType === "bar" && (
            <div className="w-full h-full flex items-end justify-center gap-2 p-4">
              {(element.props?.chartData || Array.from({ length: element.props?.dataPoints || 5 }, (_, i) => ({ label: `Item ${i + 1}`, value: Math.random() * 100 }))).map((data: any, index: number) => {
                const maxValue = Math.max(...(element.props?.chartData || []).map((d: any) => d.value || 0))
                const height = maxValue > 0 ? `${(data.value / maxValue) * 80}%` : "20%"
                return (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div 
                      className="bg-primary rounded-t w-8 transition-all duration-300 hover:bg-primary/80"
                      style={{ height }}
                    />
                    <span className="text-xs text-muted-foreground">{data.label}</span>
                  </div>
                )
              })}
            </div>
          )}
          {element.props?.chartType === "line" && (
            <div className="w-full h-full relative p-4">
              <svg className="w-full h-full" viewBox="0 0 300 200">
                {element.props?.showGrid && (
                  <defs>
                    <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
                    </pattern>
                  </defs>
                )}
                {element.props?.showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}
                {(element.props?.chartData || Array.from({ length: element.props?.dataPoints || 5 }, (_, i) => ({ label: `Point ${i + 1}`, value: Math.random() * 100 }))).length > 1 && (
                  <>
                    <polyline
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      points={(element.props?.chartData || []).map((data: any, index: number) => {
                        const x = (index / Math.max(1, (element.props?.chartData || []).length - 1)) * 280 + 10
                        const y = 190 - ((data.value || 0) / Math.max(1, Math.max(...(element.props?.chartData || []).map((d: any) => d.value || 0)))) * 160
                        return `${x},${y}`
                      }).join(' ')}
                    />
                    {(element.props?.chartData || []).map((data: any, index: number) => {
                      const x = (index / Math.max(1, (element.props?.chartData || []).length - 1)) * 280 + 10
                      const y = 190 - ((data.value || 0) / Math.max(1, Math.max(...(element.props?.chartData || []).map((d: any) => d.value || 0)))) * 160
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="hsl(var(--primary))"
                          className="hover:r-4 transition-all duration-200"
                        />
                      )
                    })}
                  </>
                )}
              </svg>
            </div>
          )}
          {element.props?.chartType === "pie" && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <svg className="w-32 h-32" viewBox="0 0 100 100">
                {(element.props?.chartData || Array.from({ length: element.props?.dataPoints || 5 }, (_, i) => ({ label: `Slice ${i + 1}`, value: Math.random() * 100 }))).map((data: any, index: number) => {
                  const total = (element.props?.chartData || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0)
                  const percentage = total > 0 ? (data.value || 0) / total : 0
                  const angle = percentage * 360
                  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]
                  const color = colors[index % colors.length]
                  
                  let startAngle = 0
                  for (let i = 0; i < index; i++) {
                    const prevData = (element.props?.chartData || [])[i]
                    const prevPercentage = total > 0 ? (prevData?.value || 0) / total : 0
                    startAngle += prevPercentage * 360
                  }
                  
                  const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180)
                  const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180)
                  const x2 = 50 + 40 * Math.cos((startAngle + angle - 90) * Math.PI / 180)
                  const y2 = 50 + 40 * Math.sin((startAngle + angle - 90) * Math.PI / 180)
                  const largeArcFlag = angle > 180 ? 1 : 0
                  
                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={color}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  )
                })}
              </svg>
            </div>
          )}
          {element.props?.chartType === "doughnut" && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <svg className="w-32 h-32" viewBox="0 0 100 100">
                {(element.props?.chartData || Array.from({ length: element.props?.dataPoints || 5 }, (_, i) => ({ label: `Segment ${i + 1}`, value: Math.random() * 100 }))).map((data: any, index: number) => {
                  const total = (element.props?.chartData || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0)
                  const percentage = total > 0 ? (data.value || 0) / total : 0
                  const angle = percentage * 360
                  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]
                  const color = colors[index % colors.length]
                  
                  let startAngle = 0
                  for (let i = 0; i < index; i++) {
                    const prevData = (element.props?.chartData || [])[i]
                    const prevPercentage = total > 0 ? (prevData?.value || 0) / total : 0
                    startAngle += prevPercentage * 360
                  }
                  
                  const radius = 30
                  const innerRadius = 15
                  const x1 = 50 + radius * Math.cos((startAngle - 90) * Math.PI / 180)
                  const y1 = 50 + radius * Math.sin((startAngle - 90) * Math.PI / 180)
                  const x2 = 50 + radius * Math.cos((startAngle + angle - 90) * Math.PI / 180)
                  const y2 = 50 + radius * Math.sin((startAngle + angle - 90) * Math.PI / 180)
                  const x3 = 50 + innerRadius * Math.cos((startAngle + angle - 90) * Math.PI / 180)
                  const y3 = 50 + innerRadius * Math.sin((startAngle + angle - 90) * Math.PI / 180)
                  const x4 = 50 + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180)
                  const y4 = 50 + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180)
                  const largeArcFlag = angle > 180 ? 1 : 0
                  
                  return (
                    <path
                      key={index}
                      d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`}
                      fill={color}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  )
                })}
              </svg>
            </div>
          )}
          {!element.props?.chartType && (
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
              <p className="text-sm text-muted-foreground">Select a chart type</p>
        </div>
          )}
        </div>
        {element.props?.showLegend && (element.props?.chartType === "pie" || element.props?.chartType === "doughnut") && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(element.props?.chartData || []).map((data: any, index: number) => {
              const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]
              const color = colors[index % colors.length]
              return (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span>{data.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )}
    {element.type === "progress" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4 flex flex-col justify-center" style={elementStyles}>
        <div className="mb-2">
          <span 
            className="text-sm font-medium"
            style={{
              fontFamily: element.props?.titleFontFamily || undefined,
              fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : undefined,
              fontWeight: element.props?.titleFontWeight || undefined,
              color: element.props?.titleTextColor || undefined,
            }}
          >
            {element.content || "Progress"}
          </span>
          {element.props?.showPercentage && (
            <span 
              className="text-sm text-muted-foreground ml-2"
              style={{
                fontFamily: element.props?.titleFontFamily || undefined,
                fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : undefined,
                fontWeight: element.props?.titleFontWeight || undefined,
                color: element.props?.titleTextColor || undefined,
              }}
            >
              {element.props?.value || 50}%
            </span>
          )}
        </div>
        <div 
          className="w-full rounded-full overflow-hidden"
          style={{ 
            backgroundColor: element.props?.backgroundColor || "#e5e7eb",
            height: `${element.props?.height || 8}px`
          }}
        >
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              element.props?.animated ? "animate-pulse" : ""
            }`}
            style={{ 
              width: `${element.props?.value || 50}%`,
              backgroundColor: element.props?.progressColor || "#3b82f6",
              transition: element.props?.animated ? "width 0.5s ease-in-out" : "none"
            }}
          />
        </div>
      </div>
    )}
    {element.type === "timeline" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="space-y-4">
          <h3 
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: element.props?.titleFontFamily || undefined,
              fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : undefined,
              fontWeight: element.props?.titleFontWeight || undefined,
              color: element.props?.titleTextColor || undefined,
            }}
          >
            {element.content || "Timeline"}
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {/* Timeline events */}
            {Array.from({ length: element.props?.eventCount || 4 }, (_, index) => (
              <div key={index} className="relative flex items-start gap-4 pb-6">
                {/* Event dot */}
                <div 
                  className="w-3 h-3 bg-primary rounded-full mt-1 flex-shrink-0 z-10"
                  style={{
                    backgroundColor: element.props?.timelineEvents?.[index]?.dotColor || undefined,
                  }}
                ></div>
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <h4 
                    className="text-sm font-medium"
                    style={{
                      fontFamily: element.props?.eventTitleFontFamily || undefined,
                      fontSize: element.props?.eventTitleFontSize ? `${element.props.eventTitleFontSize}px` : undefined,
                      fontWeight: element.props?.eventTitleFontWeight || undefined,
                      color: element.props?.eventTitleTextColor || undefined,
                    }}
                  >
                    {element.props?.timelineEvents?.[index]?.title || `Event ${index + 1}`}
                  </h4>
                  <p 
                    className="text-xs text-muted-foreground mt-1"
                    style={{
                      fontFamily: element.props?.descriptionFontFamily || undefined,
                      fontSize: element.props?.descriptionFontSize ? `${element.props.descriptionFontSize}px` : undefined,
                      fontWeight: element.props?.descriptionFontWeight || undefined,
                      color: element.props?.descriptionTextColor || undefined,
                    }}
                  >
                    {element.props?.timelineEvents?.[index]?.description || `Description for event ${index + 1}`}
                  </p>
                  {element.props?.timelineEvents?.[index]?.date && (
                    <p 
                      className="text-xs text-muted-foreground mt-1"
                      style={{
                        fontFamily: element.props?.dateFontFamily || undefined,
                        fontSize: element.props?.dateFontSize ? `${element.props.dateFontSize}px` : undefined,
                        fontWeight: element.props?.dateFontWeight || undefined,
                        color: element.props?.dateTextColor || undefined,
                      }}
                    >
                      {element.props.timelineEvents[index].date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {element.type === "stats" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: element.props?.statCount || 3 }, (_, index) => {
            const stat = element.props?.stats?.[index] || {}
            return (
              <div key={index} className="bg-sidebar-accent border border-sidebar-border rounded-lg p-4 text-center">
                <div 
                  className="text-2xl font-bold text-primary mb-2"
                  style={{
                    fontFamily: element.props?.valueFontFamily || undefined,
                    fontSize: element.props?.valueFontSize ? `${element.props.valueFontSize}px` : undefined,
                    fontWeight: element.props?.valueFontWeight || undefined,
                    color: element.props?.valueTextColor || undefined,
                  }}
                >
                  {stat.value || `${(index + 1) * 1000}`}
                </div>
                <div 
                  className="text-sm text-muted-foreground"
                  style={{
                    fontFamily: element.props?.labelFontFamily || undefined,
                    fontSize: element.props?.labelFontSize ? `${element.props.labelFontSize}px` : undefined,
                    fontWeight: element.props?.labelFontWeight || undefined,
                    color: element.props?.labelTextColor || undefined,
                  }}
                >
                  {stat.label || `Stat ${index + 1}`}
                </div>
                {stat.description && (
                  <div 
                    className="text-xs text-muted-foreground mt-1"
                    style={{
                      fontFamily: element.props?.descriptionFontFamily || undefined,
                      fontSize: element.props?.descriptionFontSize ? `${element.props.descriptionFontSize}px` : undefined,
                      fontWeight: element.props?.descriptionFontWeight || undefined,
                      color: element.props?.descriptionTextColor || undefined,
                    }}
                  >
                    {stat.description}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )}
    {element.type === "counter" && (
      <CounterComponent element={element} currentBreakpoint={currentBreakpoint} />
    )}
    {element.type === "product-card" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg overflow-hidden" style={elementStyles}>
        <div 
          className="bg-muted flex items-center justify-center overflow-hidden"
          style={{
            height: element.props?.enableScaling !== false 
              ? `${Math.max(60, (element.position?.height || 200) * ((element.props?.imageHeight || 40) / 100))}px`
              : `${(element.position?.height || 200) * ((element.props?.imageHeight || 40) / 100)}px`
          }}
        >
          {element.props?.imageUrl ? (
            <img 
              src={element.props.imageUrl} 
              alt={element.content}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg 
              className="text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                width: element.props?.enableScaling !== false 
                  ? `${Math.max(20, (element.position?.width || 200) * 0.1)}px`
                  : '32px',
                height: element.props?.enableScaling !== false 
                  ? `${Math.max(20, (element.position?.width || 200) * 0.1)}px`
                  : '32px'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div 
          style={{
            padding: element.props?.enableScaling !== false 
              ? `${Math.max(8, (element.position?.height || 200) * 0.04)}px`
              : '12px'
          }}
        >
          <h3 
            className="mb-1"
            style={{
              fontFamily: element.props?.productNameFontFamily || 'inherit',
              fontSize: element.props?.productNameFontSize 
                ? `${element.props.productNameFontSize}px`
                : element.props?.enableScaling !== false 
                  ? `${Math.max(10, (element.position?.width || 200) * 0.05)}px`
                  : '14px',
              fontWeight: element.props?.productNameFontWeight || '600',
              color: element.props?.productNameColor || 'inherit'
            }}
          >
            {element.content}
          </h3>
          <p 
            className="mb-2"
            style={{
              fontFamily: element.props?.descriptionFontFamily || 'inherit',
              fontSize: element.props?.descriptionFontSize 
                ? `${element.props.descriptionFontSize}px`
                : element.props?.enableScaling !== false 
                  ? `${Math.max(8, (element.position?.width || 200) * 0.035)}px`
                  : '12px',
              fontWeight: element.props?.descriptionFontWeight || '400',
              color: element.props?.descriptionColor || '#a1a1aa'
            }}
          >
            {element.props?.description || "Product description"}
          </p>
          <div className="flex items-center justify-between">
            <span 
              style={{
                fontFamily: element.props?.priceFontFamily || 'inherit',
                fontSize: element.props?.priceFontSize 
                  ? `${element.props.priceFontSize}px`
                  : element.props?.enableScaling !== false 
                    ? `${Math.max(10, (element.position?.width || 200) * 0.045)}px`
                    : '14px',
                fontWeight: element.props?.priceFontWeight || '700',
                color: element.props?.priceColor || '#3b82f6'
              }}
            >
              {(() => {
                const currency = element.props?.productCurrency || "USD";
                const price = element.props?.price || "99.99";
                
                const currencySymbols: Record<string, string> = {
                  USD: "$",
                  EUR: "€",
                  GBP: "£",
                  JPY: "¥",
                  VND: "₫",
                  CNY: "¥",
                  KRW: "₩",
                  THB: "฿",
                  SGD: "S$",
                  AUD: "A$",
                  CAD: "C$",
                  INR: "₹"
                };
                
                // Currencies with symbol after amount
                const symbolAfter = ["VND", "KRW", "THB"];
                const symbol = currencySymbols[currency] || "$";
                
                if (symbolAfter.includes(currency)) {
                  return `${price}${symbol}`;
                } else {
                  return `${symbol}${price}`;
                }
              })()}
            </span>
            <button 
              className="rounded"
              style={{
                fontFamily: element.props?.buttonFontFamily || 'inherit',
                fontSize: element.props?.buttonFontSize 
                  ? `${element.props.buttonFontSize}px`
                  : element.props?.enableScaling !== false 
                    ? `${Math.max(8, (element.position?.width || 200) * 0.035)}px`
                    : '12px',
                fontWeight: element.props?.buttonFontWeight || '400',
                color: element.props?.buttonTextColor || '#ffffff',
                backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                padding: element.props?.enableScaling !== false 
                  ? `${Math.max(4, (element.position?.height || 200) * 0.015)}px ${Math.max(8, (element.position?.width || 200) * 0.025)}px`
                  : '4px 8px'
              }}
            >
              {element.props?.buttonText || "Add"}
            </button>
          </div>
        </div>
      </div>
    )}
    {element.type === "price" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <span 
          style={{
            fontFamily: element.props?.priceFontFamily || 'inherit',
            fontSize: element.props?.priceFontSize 
              ? `${element.props.priceFontSize}px`
              : '24px',
            fontWeight: element.props?.priceFontWeight || '700',
            color: element.props?.priceTextColor || 'inherit'
          }}
        >
          {(() => {
            const currency = element.props?.currency || "USD";
            const amount = element.props?.priceAmount || element.content || "99.99";
            const period = element.props?.period || "";
            
            const currencySymbols: Record<string, string> = {
              USD: "$",
              EUR: "€",
              GBP: "£",
              JPY: "¥",
              VND: "₫",
              CNY: "¥",
              KRW: "₩",
              THB: "฿",
              SGD: "S$",
              AUD: "A$",
              CAD: "C$",
              INR: "₹"
            };
            
            // Currencies with symbol after amount
            const symbolAfter = ["VND", "KRW", "THB"];
            const symbol = currencySymbols[currency] || "$";
            
            if (symbolAfter.includes(currency)) {
              return `${amount}${symbol}${period}`;
            } else {
              return `${symbol}${amount}${period}`;
            }
          })()}
        </span>
      </div>
    )}
    {element.type === "rating" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="space-y-3">
          {/* Stars */}
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: element.props?.maxStars || 5 }).map((_, index) => {
              const value = element.props?.value || 4;
              const isFilled = index < Math.floor(value);
              const isHalf = index === Math.floor(value) && value % 1 !== 0;
              
              return (
                <svg
                  key={index}
                  className={`w-6 h-6 ${
                    isFilled || isHalf ? "text-yellow-400" : "text-muted-foreground/30"
                  }`}
                  fill={isFilled || isHalf ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={isFilled || isHalf ? 0 : 2}
                  viewBox="0 0 24 24"
                >
                  {isHalf ? (
                    <>
                      <defs>
                        <linearGradient id={`half-${index}`}>
                          <stop offset="50%" stopColor="currentColor" />
                          <stop offset="50%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                      <path
                        fill={`url(#half-${index})`}
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      />
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      />
                    </>
                  ) : (
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  )}
                </svg>
              );
            })}
          </div>

          {/* Comment Box */}
          {element.props?.showComment !== false && (
            <textarea
              placeholder={element.props?.commentPlaceholder || "Write your review..."}
              className="w-full px-3 py-2 border border-border rounded bg-background resize-none"
              style={{
                fontFamily: element.props?.commentFontFamily || 'inherit',
                fontSize: element.props?.commentFontSize 
                  ? `${element.props.commentFontSize}px`
                  : '14px',
                fontWeight: element.props?.commentFontWeight || '400',
                color: element.props?.commentTextColor || 'inherit'
              }}
              rows={3}
              disabled
            />
          )}

          {/* Submit Button */}
          {element.props?.showSubmitButton !== false && (
            <button 
              className="w-full px-4 py-2 rounded hover:opacity-90 transition-opacity"
              style={{
                fontFamily: element.props?.buttonFontFamily || 'inherit',
                fontSize: element.props?.buttonFontSize 
                  ? `${element.props.buttonFontSize}px`
                  : '14px',
                fontWeight: element.props?.buttonFontWeight || '500',
                color: element.props?.buttonTextColor || '#ffffff',
                backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6'
              }}
            >
              {element.props?.submitButtonText || "Submit Review"}
            </button>
          )}
        </div>
      </div>
    )}
    {element.type === "cart" && (
      <button 
        className="w-full h-full rounded-lg hover:opacity-90 transition-opacity" 
        style={{
          ...elementStyles,
          fontFamily: element.props?.cartFontFamily || 'inherit',
          fontSize: element.props?.cartFontSize 
            ? `${element.props.cartFontSize}px`
            : '16px',
          fontWeight: element.props?.cartFontWeight || '500',
          color: element.props?.cartTextColor || '#ffffff',
          backgroundColor: element.props?.cartBackgroundColor || '#3b82f6'
        }}
      >
        {element.content}
      </button>
    )}
    {element.type === "checkout" && (
      <button 
        className="w-full h-full rounded-lg hover:opacity-90 transition-opacity" 
        style={{
          ...elementStyles,
          fontFamily: element.props?.checkoutFontFamily || 'inherit',
          fontSize: element.props?.checkoutFontSize 
            ? `${element.props.checkoutFontSize}px`
            : '16px',
          fontWeight: element.props?.checkoutFontWeight || '600',
          color: element.props?.checkoutTextColor || '#ffffff',
          backgroundColor: element.props?.checkoutBackgroundColor || '#3b82f6'
        }}
      >
        {element.content}
      </button>
    )}
    {element.type === "social-links" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex items-center justify-center p-4" style={elementStyles}>
        {element.props?.socialLinks && element.props.socialLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {element.props.socialLinks.map((link: any, index: number) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center hover:bg-primary/30 transition-colors"
                title={link.platform}
              >
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  {link.platform.toLowerCase().includes('facebook') ? (
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  ) : link.platform.toLowerCase().includes('twitter') || link.platform.toLowerCase().includes('x') ? (
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  ) : link.platform.toLowerCase().includes('instagram') ? (
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  ) : link.platform.toLowerCase().includes('linkedin') ? (
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  ) : (
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  )}
                </svg>
              </a>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    )}
    {element.type === "contact-info" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="space-y-2">
          {element.props?.phone && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span 
                className="text-sm" 
                style={{
                  fontFamily: element.props?.phoneFontFamily || 'inherit',
                  fontSize: element.props?.phoneFontSize ? `${element.props.phoneFontSize}px` : '14px',
                  fontWeight: element.props?.phoneFontWeight || '400',
                  color: element.props?.phoneTextColor || 'inherit'
                }}
              >
                {element.props.phone}
              </span>
            </div>
          )}
          {element.props?.email && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span 
                className="text-sm"
                style={{
                  fontFamily: element.props?.emailFontFamily || 'inherit',
                  fontSize: element.props?.emailFontSize ? `${element.props.emailFontSize}px` : '14px',
                  fontWeight: element.props?.emailFontWeight || '400',
                  color: element.props?.emailTextColor || 'inherit'
                }}
              >
                {element.props.email}
              </span>
            </div>
          )}
          {element.props?.address && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span 
                className="text-sm"
                style={{
                  fontFamily: element.props?.addressFontFamily || 'inherit',
                  fontSize: element.props?.addressFontSize ? `${element.props.addressFontSize}px` : '14px',
                  fontWeight: element.props?.addressFontWeight || '400',
                  color: element.props?.addressTextColor || 'inherit'
                }}
              >
                {element.props.address}
              </span>
            </div>
          )}
        </div>
      </div>
    )}
    {element.type === "map" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg overflow-hidden" style={elementStyles}>
        {element.content && (
          <div 
            className="p-3 bg-muted border-b border-border text-center"
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : '16px',
              fontWeight: element.props?.titleFontWeight || '600',
              color: element.props?.titleTextColor || 'inherit'
            }}
          >
            {element.content}
          </div>
        )}
        <div className="w-full h-full flex flex-col">
          {element.props?.address && (
            <div 
              className="p-2 bg-muted/50 text-sm border-b border-border"
              style={{
                fontFamily: element.props?.addressFontFamily || 'inherit',
                fontSize: element.props?.addressFontSize ? `${element.props.addressFontSize}px` : '12px',
                fontWeight: element.props?.addressFontWeight || '400',
                color: element.props?.addressTextColor || 'inherit'
              }}
            >
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="flex-1">{element.props.address}</span>
              </div>
            </div>
          )}
          <div className="flex-1 bg-muted flex items-center justify-center">
            {element.props?.mapUrl ? (
              <iframe
                src={element.props.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={element.content || "Map Location"}
              />
            ) : (
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground">Add Map URL to display map</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    {element.type === "newsletter" && (() => {
      // Calculate scale factor for auto-scaling
      const originalPosition = element.position || { x: 0, y: 0, width: 200, height: 50 }
      const currentPosition = {
        width: transientRef.current.get(element.id)?.width ?? originalPosition.width,
        height: transientRef.current.get(element.id)?.height ?? originalPosition.height,
      }
      const scaleX = (currentPosition.width || 200) / (originalPosition.width || 200)
      const scaleY = (currentPosition.height || 50) / (originalPosition.height || 50)
      const scaleFactor = element.props?.autoScale !== false ? Math.min(scaleX, scaleY) : 1

      return (
        <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
          <div className="text-center">
            <h3 
              className="font-semibold text-sm mb-2"
              style={{
                fontFamily: element.props?.titleFontFamily || 'inherit',
                fontSize: `${(element.props?.titleFontSize || 14) * scaleFactor}px`,
                fontWeight: element.props?.titleFontWeight || '600',
                color: element.props?.titleTextColor || 'inherit'
              }}
            >
              {element.content || 'Subscribe to Newsletter'}
            </h3>
            <p 
              className="text-xs text-muted-foreground mb-3"
              style={{
                fontFamily: element.props?.subtitleFontFamily || 'inherit',
                fontSize: `${(element.props?.subtitleFontSize || 12) * scaleFactor}px`,
                fontWeight: element.props?.subtitleFontWeight || '400',
                color: element.props?.subtitleTextColor || 'inherit'
              }}
            >
              {element.props?.subtitle || 'Get updates delivered to your inbox'}
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder={element.props?.inputPlaceholder || 'Enter email'} 
                className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
                style={{
                  fontSize: `${12 * scaleFactor}px`,
                  padding: `${4 * scaleFactor}px ${8 * scaleFactor}px`
                }}
              />
              <button 
                className="px-3 py-1 text-xs rounded"
                style={{
                  fontFamily: element.props?.buttonFontFamily || 'inherit',
                  fontSize: `${(element.props?.buttonFontSize || 12) * scaleFactor}px`,
                  fontWeight: element.props?.buttonFontWeight || '500',
                  color: element.props?.buttonTextColor || '#ffffff',
                  backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                  padding: `${4 * scaleFactor}px ${12 * scaleFactor}px`
                }}
              >
                {element.props?.buttonText || 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      )
    })()}
    {element.type === "team" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg overflow-hidden" style={elementStyles}>
        <div 
          className="bg-muted flex items-center justify-center overflow-hidden"
          style={{
            height: `${element.props?.imageHeight || 40}%`
          }}
        >
          {element.props?.memberImage ? (
            <img 
              src={element.props.memberImage} 
              alt={element.content || "Team Member"} 
              className="w-full h-full object-cover"
              style={{
                borderRadius: element.props?.imageBorderRadius ? `${element.props.imageBorderRadius}px` : '0px'
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-3 text-center">
          <h3 
            className="font-semibold text-sm mb-1"
            style={{
              fontFamily: element.props?.nameFontFamily || 'inherit',
              fontSize: element.props?.nameFontSize ? `${element.props.nameFontSize}px` : '14px',
              fontWeight: element.props?.nameFontWeight || '600',
              color: element.props?.nameTextColor || 'inherit'
            }}
          >
            {element.content || 'Team Member'}
          </h3>
          <p 
            className="text-xs text-muted-foreground"
            style={{
              fontFamily: element.props?.roleFontFamily || 'inherit',
              fontSize: element.props?.roleFontSize ? `${element.props.roleFontSize}px` : '12px',
              fontWeight: element.props?.roleFontWeight || '400',
              color: element.props?.roleTextColor || 'inherit'
            }}
          >
            {element.props?.role || 'Team Member'}
          </p>
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
          <p 
            className="text-sm italic mb-2"
            style={{
              fontFamily: element.props?.reviewFontFamily || 'inherit',
              fontSize: element.props?.reviewFontSize ? `${element.props.reviewFontSize}px` : '14px',
              fontWeight: element.props?.reviewFontWeight || '400',
              color: element.props?.reviewTextColor || 'inherit'
            }}
          >
            "{element.content || 'Customer Review'}"
          </p>
          <div 
            className="text-xs text-muted-foreground"
            style={{
              fontFamily: element.props?.nameFontFamily || 'inherit',
              fontSize: element.props?.nameFontSize ? `${element.props.nameFontSize}px` : '12px',
              fontWeight: element.props?.nameFontWeight || '600',
              color: element.props?.nameTextColor || 'inherit'
            }}
          >
            {element.props?.customerName || 'Customer Name'}
          </div>
          {element.props?.customerTitle && (
            <div 
              className="text-xs text-muted-foreground/80 mt-1"
              style={{
                fontFamily: element.props?.titleFontFamily || 'inherit',
                fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : '10px',
                fontWeight: element.props?.titleFontWeight || '400',
                color: element.props?.titleTextColor || 'inherit'
              }}
            >
              {element.props.customerTitle}
            </div>
          )}
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
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '24px',
              fontWeight: element.props?.titleFontWeight || '600',
              fontStyle: element.props?.titleFontStyle || 'normal',
              textDecoration: element.props?.titleTextDecoration || 'none',
              textAlign: (element.props?.titleTextAlign as React.CSSProperties['textAlign']) || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2 flex-1 flex flex-col">
            <input 
              type="text" 
              placeholder={element.props?.nameLabel !== undefined ? element.props.nameLabel : "Name"} 
              className="w-full border flex-shrink-0" 
              style={element.props?.enableScaling ? {
                fontFamily: element.props?.inputFontFamily || 'inherit',
                padding: `${Math.max(4, (element.position?.height || 200) * 0.02)}px ${Math.max(8, (element.position?.width || 300) * 0.03)}px`,
                fontSize: `${Math.max(10, (element.position?.height || 200) * 0.06)}px`,
                color: element.props?.inputTextColor || '#ffffff',
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              } : {
                fontFamily: element.props?.inputFontFamily || 'inherit',
                padding: element.props?.inputPadding || '8px 12px',
                fontSize: element.props?.inputFontSize || '12px',
                color: element.props?.inputTextColor || '#ffffff',
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              }}
            />
            <input 
              type="email" 
              placeholder={element.props?.emailLabel !== undefined ? element.props.emailLabel : "Email"} 
              className="w-full border flex-shrink-0" 
              style={element.props?.enableScaling ? {
                fontFamily: element.props?.inputFontFamily || 'inherit',
                padding: `${Math.max(4, (element.position?.height || 200) * 0.02)}px ${Math.max(8, (element.position?.width || 300) * 0.03)}px`,
                fontSize: `${Math.max(10, (element.position?.height || 200) * 0.06)}px`,
                color: element.props?.inputTextColor || '#ffffff',
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              } : {
                fontFamily: element.props?.inputFontFamily || 'inherit',
                padding: element.props?.inputPadding || '8px 12px',
                fontSize: element.props?.inputFontSize || '12px',
                color: element.props?.inputTextColor || '#ffffff',
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              }}
            />
            <textarea 
              placeholder={element.props?.messageLabel !== undefined ? element.props.messageLabel : "Message"} 
              className="w-full border resize-none flex-1" 
              style={element.props?.enableScaling ? {
                fontFamily: element.props?.inputFontFamily || 'inherit',
                padding: `${Math.max(4, (element.position?.height || 200) * 0.02)}px ${Math.max(8, (element.position?.width || 300) * 0.03)}px`,
                fontSize: `${Math.max(10, (element.position?.height || 200) * 0.06)}px`,
                color: element.props?.inputTextColor || '#ffffff',
                minHeight: `${Math.max(40, (element.position?.height || 200) * 0.2)}px`,
                borderRadius: element.props?.inputBorderRadius || '4px',
                borderColor: element.props?.inputBorderColor || '#374151',
                backgroundColor: element.props?.inputBackgroundColor || '#1f2937'
              } : {
                fontFamily: element.props?.inputFontFamily || 'inherit',
                padding: element.props?.inputPadding || '8px 12px',
                fontSize: element.props?.inputFontSize || '12px',
                color: element.props?.inputTextColor || '#ffffff',
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
              {element.props?.buttonText !== undefined ? element.props.buttonText : "Submit"}
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Advanced UI Components */}
    {element.type === "calendar" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <div className="text-center">
          <h3 
            className="font-semibold text-sm mb-3"
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : '14px',
              fontWeight: element.props?.titleFontWeight || '600',
              color: element.props?.titleTextColor || 'inherit'
            }}
          >
            {element.props?.title || "Calendar"}
          </h3>
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
            style={{
              fontFamily: element.props?.fontFamily || 'inherit',
              fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '16px',
              fontWeight: element.props?.fontWeight || 'normal',
              color: element.props?.textColor || 'var(--color-foreground)'
            }}
          />
          <svg className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    )}
    {element.type === "filter" && (
      <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={elementStyles}>
        <h3 
          className="font-semibold text-sm mb-3"
          style={{
            fontFamily: element.props?.titleFontFamily || 'inherit',
            fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : '14px',
            fontWeight: element.props?.titleFontWeight || '600',
            color: element.props?.titleTextColor || 'var(--color-foreground)'
          }}
        >
          {element.props?.title || element.content}
        </h3>
        <div className="space-y-2">
          {(element.props?.options || [
            { id: "option1", label: "Option 1", checked: false },
            { id: "option2", label: "Option 2", checked: false },
            { id: "option3", label: "Option 3", checked: false }
          ]).map((option: any, index: number) => (
            <label key={option.id || index} className="flex items-center gap-2 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-border bg-background text-primary focus:ring-primary" 
                checked={option.checked || false}
                onChange={(e) => {
                  const newOptions = [...(element.props?.options || [])];
                  newOptions[index] = { ...option, checked: e.target.checked };
                  onUpdateElement(element.id, {
                    props: {
                      ...element.props,
                      options: newOptions
                    }
                  });
                }}
              />
              <span 
                style={{
                  fontFamily: element.props?.optionFontFamily || 'inherit',
                  fontSize: element.props?.optionFontSize ? `${element.props.optionFontSize}px` : '12px',
                  fontWeight: element.props?.optionFontWeight || 'normal',
                  color: element.props?.optionTextColor || 'var(--color-foreground)'
                }}
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    )}
    {element.type === "breadcrumb" && (
      <div className="w-full h-full flex items-center" style={elementStyles}>
        <nav className="flex items-center space-x-1 text-sm">
          {(element.props?.items || [
            { id: "home", label: "Home", href: "/", isLast: false },
            { id: "about", label: "About", href: "/about", isLast: false },
            { id: "contact", label: "Contact", href: "/contact", isLast: true }
          ]).map((item: any, index: number, array: any[]) => (
            <div key={item.id || index} className="flex items-center">
              <span 
                className={item.isLast ? "" : "hover:underline cursor-pointer"}
                style={{
                  fontFamily: element.props?.fontFamily || 'inherit',
                  fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                  fontWeight: element.props?.fontWeight || 'normal',
                  color: item.isLast 
                    ? (element.props?.lastItemColor || 'var(--color-muted-foreground)')
                    : (element.props?.textColor || 'var(--color-primary)')
                }}
              >
                {item.label}
              </span>
              {index < array.length - 1 && (
                <span 
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.separatorColor || 'var(--color-muted-foreground)'
                  }}
                >
                  {element.props?.separator || "/"}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>
    )}
    {element.type === "pagination" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <nav className="flex items-center space-x-1">
          {(element.props?.items || [
            { id: "prev", label: "←", type: "prev", isActive: false },
            { id: "1", label: "1", type: "page", isActive: true },
            { id: "2", label: "2", type: "page", isActive: false },
            { id: "3", label: "3", type: "page", isActive: false },
            { id: "ellipsis", label: "...", type: "ellipsis", isActive: false },
            { id: "10", label: "10", type: "page", isActive: false },
            { id: "next", label: "→", type: "next", isActive: false }
          ]).map((item: any, index: number) => (
            <div key={item.id || index}>
              {item.type === "ellipsis" ? (
                <span 
                  className="px-2 py-1 text-xs text-muted-foreground"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '12px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-muted-foreground)'
                  }}
                >
                  {item.label}
                </span>
              ) : (
                <button 
                  className={`px-2 py-1 text-xs border rounded hover:bg-muted ${
                    item.isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "border-border"
                  }`}
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '12px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: item.isActive 
                      ? (element.props?.activeTextColor || 'var(--color-primary-foreground)')
                      : (element.props?.textColor || 'var(--color-foreground)'),
                    backgroundColor: item.isActive 
                      ? (element.props?.activeBgColor || 'var(--color-primary)')
                      : 'transparent',
                    borderColor: element.props?.borderColor || 'var(--color-border)'
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.backgroundColor = element.props?.hoverBgColor || 'var(--color-muted)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item.label}
                </button>
              )}
            </div>
          ))}
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
          <span 
            className="text-sm font-medium"
            style={{
              fontFamily: element.props?.fontFamily || 'inherit',
              fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
              fontWeight: element.props?.fontWeight || 'medium',
              color: element.props?.textColor || 'var(--color-destructive-foreground)'
            }}
          >
            {element.content}
          </span>
        </div>
      </div>
    )}
    {element.type === "toast" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="flex items-center gap-2">
          <svg 
            className="w-4 h-4" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            style={{
              color: element.props?.iconColor || 'currentColor'
            }}
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span 
            className="text-sm"
            style={{
              fontFamily: element.props?.fontFamily || 'inherit',
              fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
              fontWeight: element.props?.fontWeight || 'normal',
              color: element.props?.textColor || 'var(--color-foreground)'
            }}
          >
            {element.content}
          </span>
        </div>
      </div>
    )}
    {/* Content & Text Components */}
    {element.type === "code-block" && (
      <div className="w-full h-full relative" style={elementStyles}>
        <pre className="w-full h-full p-4 bg-muted rounded-lg border border-border overflow-auto">
          <code 
            className={`text-sm font-mono language-${element.props?.language || 'javascript'}`}
            data-language={element.props?.language || 'javascript'}
            style={{
              fontFamily: element.props?.fontFamily || 'inherit',
              fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
              fontWeight: element.props?.fontWeight || 'normal',
              color: element.props?.textColor || 'var(--color-foreground)'
            }}
          >
            {element.content}
          </code>
        </pre>
        {/* Language indicator */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
          {element.props?.language || 'javascript'}
        </div>
      </div>
    )}
    {element.type === "markdown" && (
      <div className="w-full h-full overflow-auto" style={elementStyles}>
        <div 
          className="prose prose-sm max-w-none"
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
            fontWeight: element.props?.fontWeight || 'normal',
            color: element.props?.textColor || 'var(--color-foreground)'
          }}
        >
          <div 
            dangerouslySetInnerHTML={{ 
              __html: parseMarkdown(element.content) 
            }}
            style={{
              '--heading-color': element.props?.headingColor || 'var(--color-foreground)',
              '--link-color': element.props?.linkColor || 'var(--color-primary)',
              '--code-color': element.props?.codeColor || 'var(--color-muted-foreground)',
              '--code-bg-color': element.props?.codeBgColor || 'var(--color-muted)'
            } as React.CSSProperties}
          />
        </div>
      </div>
    )}
    {element.type === "rich-text" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="space-y-2 h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex gap-1 p-2 bg-muted rounded border border-border flex-shrink-0">
            <button 
              className={`px-2 py-1 text-xs rounded hover:bg-muted transition-colors ${
                element.props?.bold ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
              onClick={() => onUpdateElement(element.id, {
                props: { ...element.props, bold: !element.props?.bold }
              })}
            >
              B
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded hover:bg-muted transition-colors ${
                element.props?.italic ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
              onClick={() => onUpdateElement(element.id, {
                props: { ...element.props, italic: !element.props?.italic }
              })}
            >
              I
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded hover:bg-muted transition-colors ${
                element.props?.underline ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
              onClick={() => onUpdateElement(element.id, {
                props: { ...element.props, underline: !element.props?.underline }
              })}
            >
              U
            </button>
          </div>
          
          {/* Editable Content Area */}
          <div 
            className="p-2 border border-border rounded bg-background flex-1 text-sm overflow-auto"
            contentEditable
            suppressContentEditableWarning={true}
            onInput={(e) => {
              const newContent = e.currentTarget.textContent || "";
              onUpdateElement(element.id, { content: newContent });
            }}
            style={{
              fontFamily: element.props?.fontFamily || 'inherit',
              fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
              fontWeight: element.props?.bold ? 'bold' : (element.props?.fontWeight || 'normal'),
              color: element.props?.textColor || 'var(--color-foreground)',
              backgroundColor: element.props?.backgroundColor || 'var(--color-background)',
              fontStyle: element.props?.italic ? 'italic' : 'normal',
              textDecoration: element.props?.underline ? 'underline' : 'none'
            }}
          >
            {element.content}
          </div>
        </div>
      </div>
    )}
    {element.type === "typography" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="text-center">
          <h1 
            className="mb-2"
            style={{
              fontFamily: element.props?.headingFontFamily || 'inherit',
              fontSize: element.props?.headingFontSize ? `${element.props.headingFontSize}px` : '24px',
              fontWeight: element.props?.headingFontWeight || 'bold',
              color: element.props?.headingColor || 'var(--color-foreground)'
            }}
          >
            {element.props?.heading || "Typography"}
          </h1>
          <p 
            className="text-sm"
            style={{
              fontFamily: element.props?.subtitleFontFamily || 'inherit',
              fontSize: element.props?.subtitleFontSize ? `${element.props.subtitleFontSize}px` : '14px',
              fontWeight: element.props?.subtitleFontWeight || 'normal',
              color: element.props?.subtitleColor || 'var(--color-muted-foreground)'
            }}
          >
            {element.props?.subtitle || "Font styles and sizes"}
          </p>
        </div>
      </div>
    )}
    {element.type === "link" && (
      <div className="w-full h-full flex items-center" style={elementStyles}>
        <a 
          href={element.props?.url || "#"}
          className={`hover:opacity-80 transition-opacity ${element.props?.underline === false ? 'no-underline' : ''}`}
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
            fontWeight: element.props?.fontWeight || 'normal',
            color: element.props?.textColor || 'var(--color-primary)',
            backgroundColor: element.props?.backgroundColor || 'transparent',
            textDecoration: element.props?.underline !== false ? 'underline' : 'none',
            cursor: 'pointer'
          }}
        >
          {element.content}
        </a>
      </div>
    )}
    {element.type === "tag" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <span 
          className="inline-flex items-center font-medium"
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '12px',
            fontWeight: element.props?.fontWeight || '500',
            color: element.props?.textColor || 'var(--color-primary-foreground)',
            backgroundColor: element.props?.backgroundColor || 'var(--color-primary)',
            borderRadius: element.props?.borderRadius || '9999px',
            padding: element.props?.padding || '0.25rem 0.75rem'
          }}
        >
          {element.content}
        </span>
      </div>
    )}
    {element.type === "label" && (
      <div className="w-full h-full flex items-center" style={elementStyles}>
        <span 
          className="inline-flex items-center font-medium"
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '12px',
            fontWeight: element.props?.fontWeight || '500',
            color: element.props?.textColor || 'var(--color-foreground)',
            backgroundColor: element.props?.backgroundColor || 'var(--color-muted)',
            borderRadius: element.props?.borderRadius || '0.25rem',
            padding: element.props?.padding || '0.25rem 0.5rem'
          }}
        >
          {element.content}
        </span>
      </div>
    )}
    {/* File & Media Components */}
    {element.type === "file-upload" && (
      <div className="w-full h-full" style={elementStyles}>
        <div 
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
            fontWeight: element.props?.fontWeight || 'normal',
            color: element.props?.textColor || 'var(--color-foreground)',
            backgroundColor: element.props?.backgroundColor || 'var(--color-background)',
            borderColor: element.props?.borderColor || 'var(--color-border)',
            borderRadius: element.props?.borderRadius || '0.5rem',
            padding: element.props?.padding || '0.75rem',
            borderStyle: element.props?.borderStyle || 'dashed',
            borderWidth: element.props?.borderWidth || '2px',
            border: `${element.props?.borderWidth || '2px'} ${element.props?.borderStyle || 'dashed'} ${element.props?.borderColor || 'var(--color-border)'}`
          }}
        >
          <svg 
            className="w-8 h-8 mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span 
            className="text-sm"
            style={{
              fontFamily: element.props?.fontFamily || 'inherit',
              fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
              fontWeight: element.props?.fontWeight || 'normal',
              color: element.props?.textColor || 'var(--color-muted-foreground)'
            }}
          >
            {element.content}
          </span>
        </div>
      </div>
    )}
    {element.type === "file-download" && (
      <div className="w-full h-full" style={elementStyles}>
        <div 
          className="w-full h-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
            fontWeight: element.props?.fontWeight || 'normal',
            color: element.props?.textColor || 'var(--color-primary-foreground)',
            backgroundColor: element.props?.backgroundColor || 'var(--color-primary)',
            borderRadius: element.props?.borderRadius || '8px',
            padding: element.props?.padding || '0.75rem'
          }}
        >
          <div className="flex items-center gap-2">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ 
                color: element.props?.iconColor || 'var(--color-primary-foreground)',
                width: element.props?.iconSize ? `${element.props.iconSize}px` : '16px',
                height: element.props?.iconSize ? `${element.props.iconSize}px` : '16px'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span 
              className="text-sm font-medium"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-primary-foreground)'
              }}
            >
              {element.content}
            </span>
          </div>
        </div>
      </div>
    )}
    {element.type === "pdf-viewer" && (
      <div className="w-full h-full" style={elementStyles}>
        <div 
          className="w-full h-full flex flex-col items-center justify-center"
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
            fontWeight: element.props?.fontWeight || 'normal',
            color: element.props?.textColor || 'var(--color-foreground)',
            backgroundColor: element.props?.backgroundColor || 'var(--color-card)',
            borderColor: element.props?.borderColor || 'var(--color-border)',
            borderRadius: element.props?.borderRadius || '0.5rem',
            padding: element.props?.padding || '1rem',
            border: `1px solid ${element.props?.borderColor || 'var(--color-border)'}`
          }}
        >
          {element.props?.pdfUrl || element.props?.uploadedFile ? (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="text-sm font-medium"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-foreground)'
                  }}
                >
                  {element.props?.fileName || "PDF Document"}
                </span>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (element.props?.uploadedFile) {
                      const url = URL.createObjectURL(element.props.uploadedFile);
                      window.open(url, '_blank');
                    } else if (element.props?.pdfUrl) {
                      window.open(element.props.pdfUrl, '_blank');
                    }
                  }}
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-muted-foreground)'
                  }}
                >
                  Open in New Tab
                </button>
              </div>
              <iframe
                src={element.props?.uploadedFile ? URL.createObjectURL(element.props.uploadedFile) : element.props?.pdfUrl}
                className="w-full flex-1 border-0 rounded"
                style={{ borderRadius: element.props?.borderRadius || '0.5rem' }}
                title={element.props?.fileName || "PDF Document"}
              />
            </div>
          ) : (
            <div className="text-center">
              <svg 
                className="w-12 h-12 text-muted-foreground mb-2 mx-auto" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
              >
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              {element.props?.showFileName !== false && (
                <span 
                  className="text-sm font-medium block"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-foreground)'
                  }}
                >
                  {element.props?.fileName || "PDF Document"}
                </span>
              )}
              <span 
                className="text-xs text-muted-foreground mt-1 block"
                style={{
                  fontFamily: element.props?.fontFamily || 'inherit',
                  fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                  fontWeight: element.props?.fontWeight || 'normal',
                  color: element.props?.textColor || 'var(--color-muted-foreground)'
                }}
              >
                PDF Viewer
              </span>
              {element.props?.showUploadButton !== false && (
                <div className="mt-3">
                  <span 
                    className="text-xs text-muted-foreground"
                    style={{
                      fontFamily: element.props?.fontFamily || 'inherit',
                      fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                      fontWeight: element.props?.fontWeight || 'normal',
                      color: element.props?.textColor || 'var(--color-muted-foreground)'
                    }}
                  >
                    Upload PDF URL or file in properties panel
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )}
    {element.type === "document" && (
      <div className="w-full h-full" style={elementStyles}>
        <div 
          className="w-full h-full flex flex-col items-center justify-center"
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
            fontWeight: element.props?.fontWeight || 'normal',
            color: element.props?.textColor || 'var(--color-foreground)',
            backgroundColor: element.props?.backgroundColor || 'var(--color-card)',
            borderColor: element.props?.borderColor || 'var(--color-border)',
            borderRadius: element.props?.borderRadius || '0.5rem',
            padding: element.props?.padding || '1rem',
            border: `1px solid ${element.props?.borderColor || 'var(--color-border)'}`
          }}
        >
          {element.props?.documentUrl || element.props?.uploadedFile ? (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="text-sm font-medium"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-foreground)'
                  }}
                >
                  {element.props?.fileName || "Document Viewer"}
                </span>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (element.props?.uploadedFile) {
                      const url = URL.createObjectURL(element.props.uploadedFile);
                      window.open(url, '_blank');
                    } else if (element.props?.documentUrl) {
                      window.open(element.props.documentUrl, '_blank');
                    }
                  }}
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-muted-foreground)'
                  }}
                >
                  Open in New Tab
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {element.props?.documentType === 'pdf' || 
                 (element.props?.uploadedFile && element.props.uploadedFile.type === 'application/pdf') ||
                 (element.props?.documentUrl && element.props.documentUrl.toLowerCase().includes('.pdf')) ? (
                  <iframe
                    src={element.props?.uploadedFile ? URL.createObjectURL(element.props.uploadedFile) : element.props?.documentUrl}
                    className="w-full h-full border-0 rounded"
                    style={{ borderRadius: element.props?.borderRadius || '0.5rem' }}
                    title={element.props?.fileName || "Document Viewer"}
                  />
                ) : (
                  <div className="text-center">
                    <svg 
                      className="w-16 h-16 text-muted-foreground mb-2 mx-auto" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
                    >
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span 
                      className="text-sm font-medium block"
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: element.props?.textColor || 'var(--color-foreground)'
                      }}
                    >
                      {element.props?.fileName || "Document Viewer"}
                    </span>
                    <span 
                      className="text-xs text-muted-foreground mt-1 block"
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: element.props?.textColor || 'var(--color-muted-foreground)'
                      }}
                    >
                      Document preview not available
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <svg 
                className="w-10 h-10 text-muted-foreground mb-2 mx-auto" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
              >
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              {element.props?.showFileName !== false && (
                <span 
                  className="text-sm font-medium block"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-foreground)'
                  }}
                >
                  {element.props?.fileName || "Document Viewer"}
                </span>
              )}
              <span 
                className="text-xs text-muted-foreground mt-1 block"
                style={{
                  fontFamily: element.props?.fontFamily || 'inherit',
                  fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                  fontWeight: element.props?.fontWeight || 'normal',
                  color: element.props?.textColor || 'var(--color-muted-foreground)'
                }}
              >
                Document Viewer
              </span>
              {element.props?.showUploadButton !== false && (
                <div className="mt-3">
                  <span 
                    className="text-xs text-muted-foreground"
                    style={{
                      fontFamily: element.props?.fontFamily || 'inherit',
                      fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                      fontWeight: element.props?.fontWeight || 'normal',
                      color: element.props?.textColor || 'var(--color-muted-foreground)'
                    }}
                  >
                    Upload document URL or file in properties panel
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )}
    {element.type === "folder" && (
      <div className="w-full h-full" style={elementStyles}>
        <div 
          className="w-full h-full flex flex-col"
          style={{
            fontFamily: element.props?.fontFamily || 'inherit',
            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
            fontWeight: element.props?.fontWeight || 'normal',
            color: element.props?.textColor || 'var(--color-foreground)',
            backgroundColor: element.props?.backgroundColor || 'var(--color-card)',
            borderColor: element.props?.borderColor || 'var(--color-border)',
            borderRadius: element.props?.borderRadius || '0.5rem',
            padding: element.props?.padding || '1rem',
            border: `1px solid ${element.props?.borderColor || 'var(--color-border)'}`
          }}
        >
          {/* Folder Header */}
          <div className="flex items-center gap-2 mb-3">
            <svg 
              className="w-6 h-6 text-muted-foreground" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span 
              className="text-sm font-medium flex-1"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-foreground)'
              }}
            >
              {element.props?.folderName || "Folder Name"}
            </span>
            {element.props?.showItemCount !== false && (
              <span 
                className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                style={{
                  fontFamily: element.props?.fontFamily || 'inherit',
                  fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                  fontWeight: element.props?.fontWeight || 'normal',
                  color: element.props?.textColor || 'var(--color-muted-foreground)'
                }}
              >
                {element.props?.items?.length || 0} items
              </span>
            )}
          </div>

          {/* Folder Items */}
          <div className="flex-1 overflow-y-auto">
            {element.props?.items && element.props.items.length > 0 ? (
              <div className="space-y-1">
                {element.props.items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-2 p-1 hover:bg-muted rounded text-xs"
                    style={{
                      fontFamily: element.props?.fontFamily || 'inherit',
                      fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                      fontWeight: element.props?.fontWeight || 'normal',
                      color: element.props?.textColor || 'var(--color-foreground)'
                    }}
                  >
                    {/* File/Folder Icon */}
                    {item.type === 'folder' ? (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    ) : item.icon === 'pdf' ? (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    ) : item.icon === 'image' ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    )}
                    
                    {/* File/Folder Name */}
                    <span className="flex-1 truncate">{item.name}</span>
                    
                    {/* Delete Button */}
                    {element.props?.allowDeleteItems !== false && (
                      <button
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Note: This would need to be handled by parent component
                          console.log('Delete item:', item.id);
                        }}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="text-center text-muted-foreground py-4"
                style={{
                  fontFamily: element.props?.fontFamily || 'inherit',
                  fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                  fontWeight: element.props?.fontWeight || 'normal',
                  color: element.props?.textColor || 'var(--color-muted-foreground)'
                }}
              >
                Empty folder
              </div>
            )}
          </div>

          {/* Add Item Button */}
          {element.props?.allowAddItems !== false && (
            <div className="mt-2 pt-2 border-t border-border">
              <button
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
                onClick={() => {
                  // Note: This would need to be handled by parent component
                  console.log('Add new item to folder');
                }}
                style={{
                  fontFamily: element.props?.fontFamily || 'inherit',
                  fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                  fontWeight: element.props?.fontWeight || 'normal',
                  color: element.props?.textColor || 'var(--color-muted-foreground)'
                }}
              >
                + Add Item
              </button>
            </div>
          )}
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
    {/* Feedback & Status Components */}
    {element.type === "loading" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        {element.props?.loadingType === "spinner" ? (
          <div className="flex flex-col items-center gap-3">
            <div 
              className="animate-spin rounded-full"
              style={{
                width: element.props?.spinnerSize || '24px',
                height: element.props?.spinnerSize || '24px',
                background: `conic-gradient(from 0deg, transparent, ${element.props?.spinnerColor || '#3b82f6'}, transparent)`,
                animation: 'spin 1s linear infinite'
              }}
            ></div>
            <span 
              className="text-sm font-medium"
              style={{
                fontSize: element.props?.textSize || '14px',
                color: element.props?.textColor || 'var(--color-foreground)'
              }}
            >
              {element.content || "Loading..."}
            </span>
          </div>
        ) : element.props?.loadingType === "dots" ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-full animate-pulse"
                  style={{
                    width: element.props?.dotSize || '8px',
                    height: element.props?.dotSize || '8px',
                    backgroundColor: element.props?.dotColor || 'var(--color-primary)',
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                ></div>
              ))}
            </div>
            <span 
              className="text-sm font-medium"
              style={{
                fontSize: element.props?.textSize || '14px',
                color: element.props?.textColor || 'var(--color-foreground)'
              }}
            >
              {element.content || "Loading..."}
            </span>
          </div>
        ) : element.props?.loadingType === "pulse" ? (
          <div className="flex flex-col items-center gap-3">
            <div 
              className="rounded-full animate-pulse"
              style={{
                width: element.props?.pulseSize || '40px',
                height: element.props?.pulseSize || '40px',
                backgroundColor: element.props?.pulseColor || 'var(--color-primary)',
                opacity: 0.7
              }}
            ></div>
            <span 
              className="text-sm font-medium"
              style={{
                fontSize: element.props?.textSize || '14px',
                color: element.props?.textColor || 'var(--color-foreground)'
              }}
            >
              {element.content || "Loading..."}
            </span>
          </div>
        ) : element.props?.loadingType === "bars" ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    width: element.props?.barWidth || '4px',
                    height: element.props?.barHeight || '20px',
                    backgroundColor: element.props?.barColor || 'var(--color-primary)',
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s'
                  }}
                ></div>
              ))}
            </div>
            <span 
              className="text-sm font-medium"
              style={{
                fontSize: element.props?.textSize || '14px',
                color: element.props?.textColor || 'var(--color-foreground)'
              }}
            >
              {element.content || "Loading..."}
            </span>
          </div>
        ) : (
          // Default spinner
          <div className="flex flex-col items-center gap-3">
            <div 
              className="animate-spin rounded-full"
              style={{
                width: element.props?.spinnerSize || '24px',
                height: element.props?.spinnerSize || '24px',
                background: `conic-gradient(from 0deg, transparent, ${element.props?.spinnerColor || '#3b82f6'}, transparent)`,
                animation: 'spin 1s linear infinite'
              }}
            ></div>
            <span 
              className="text-sm font-medium"
              style={{
                fontSize: element.props?.textSize || '14px',
                color: element.props?.textColor || 'var(--color-foreground)'
              }}
            >
              {element.content || "Loading..."}
            </span>
          </div>
        )}
      </div>
    )}
    {element.type === "progress-ring" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <style jsx>{`
          @keyframes progressRingPulse {
            0%, 100% { 
              stroke-width: ${element.props?.strokeWidth || '4'};
              opacity: 1;
            }
            50% { 
              stroke-width: ${(parseInt(element.props?.strokeWidth || '4') + 2)};
              opacity: 0.8;
            }
          }
        `}</style>
        <div className="relative">
          <svg 
            style={{ 
              width: element.props?.ringSize || '64px',
              height: element.props?.ringSize || '64px'
            }}
            className="transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              stroke={element.props?.backgroundColor || 'var(--color-muted)'} 
              strokeWidth={element.props?.strokeWidth || '4'} 
              fill="none" 
            />
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              stroke={element.props?.progressColor || 'var(--color-primary)'} 
              strokeWidth={element.props?.strokeWidth || '4'} 
              fill="none" 
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - (element.props?.progress || 75) / 100)}`}
              strokeLinecap={element.props?.strokeLineCap || 'round'}
              style={{
                transition: element.props?.animate ? 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                animation: element.props?.animate ? 'progressRingPulse 2s ease-in-out infinite' : 'none'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="font-medium"
              style={{
                fontSize: element.props?.textSize || '14px',
                color: element.props?.textColor || 'var(--color-foreground)'
              }}
            >
              {element.props?.showPercentage ? `${element.props?.progress || 75}%` : `${element.props?.progress || 75}`}
            </span>
          </div>
        </div>
      </div>
    )}
    {element.type === "notification" && (
      <div className="w-full h-full flex items-center justify-center" style={elementStyles}>
        <div className="relative">
          <span 
            style={{ 
              color: element.props?.iconColor || 'var(--color-muted-foreground)',
              fontSize: element.props?.iconSize || '24px'
            }}
          >
            {element.content || '🔔'}
          </span>
          <span 
            className="absolute rounded-full flex items-center justify-center"
            style={{
              backgroundColor: element.props?.badgeColor || '#dc2626',
              color: element.props?.badgeTextColor || '#ffffff',
              fontSize: `${parseInt(element.props?.badgeSize?.replace('px', '') || '16') * 0.6}px`,
              fontWeight: element.props?.badgeTextWeight || '500',
              width: element.props?.badgeSize || '16px',
              height: element.props?.badgeSize || '16px',
              top: '-4px',
              right: '-4px'
            }}
          >
            {element.props?.badgeCount || '3'}
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
      <div 
        className="w-full h-full flex items-center justify-center" 
        style={{
          ...elementStyles,
          backgroundColor: element.props?.backgroundColor || '#22c55e'
        }}
      >
        <div className="flex items-center gap-2">
          <svg 
            style={{ 
              color: element.props?.iconColor || '#ffffff',
              width: element.props?.iconSize || '16px',
              height: element.props?.iconSize || '16px'
            }}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span 
            className="font-medium"
            style={{
              fontSize: element.props?.fontSize || '14px',
              fontFamily: element.props?.fontFamily || 'inherit',
              fontWeight: element.props?.fontWeight || '500',
              color: element.props?.textColor || '#ffffff'
            }}
          >
            {element.content}
          </span>
        </div>
      </div>
    )}
    {element.type === "error-message" && (
      <div 
        className="w-full h-full flex items-center justify-center" 
        style={{
          ...elementStyles,
          backgroundColor: element.props?.backgroundColor || '#dc2626'
        }}
      >
        <div className="flex items-center gap-2">
          <svg 
            style={{ 
              color: element.props?.iconColor || '#ffffff',
              width: element.props?.iconSize || '16px',
              height: element.props?.iconSize || '16px'
            }}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span 
            className="font-medium"
            style={{
              fontSize: element.props?.fontSize || '14px',
              fontFamily: element.props?.fontFamily || 'inherit',
              fontWeight: element.props?.fontWeight || '500',
              color: element.props?.textColor || '#ffffff'
            }}
          >
            {element.content}
          </span>
        </div>
      </div>
    )}
    {element.type === "warning-message" && (
      <div 
        className="w-full h-full flex items-center justify-center" 
        style={{
          ...elementStyles,
          backgroundColor: element.props?.backgroundColor || '#f59e0b'
        }}
      >
        <div className="flex items-center gap-2">
          <svg 
            style={{ 
              color: element.props?.iconColor || '#ffffff',
              width: element.props?.iconSize || '16px',
              height: element.props?.iconSize || '16px'
            }}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span 
            className="font-medium"
            style={{
              fontSize: element.props?.fontSize || '14px',
              fontFamily: element.props?.fontFamily || 'inherit',
              fontWeight: element.props?.fontWeight || '500',
              color: element.props?.textColor || '#ffffff'
            }}
          >
            {element.content}
          </span>
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
      <div 
        className="w-full h-full bg-muted/20 border border-dashed border-border rounded flex items-center justify-center" 
        style={elementStyles}
      >
        <span className="text-xs text-muted-foreground">Spacer</span>
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
        <div 
          className="w-full h-full flex"
          style={{
            flexDirection: element.props?.flexDirection || "row",
            justifyContent: element.props?.justifyContent || "center",
            alignItems: element.props?.alignItems || "center",
            gap: `${element.props?.gap || 8}px`,
            flexWrap: element.props?.flexWrap || "nowrap"
          }}
        >
          {(element.props?.items || [
            { id: "1", text: "Item 1", type: "box" },
            { id: "2", text: "Item 2", type: "box" },
            { id: "3", text: "Item 3", type: "box" }
          ]).map((item: any) => (
            <div key={item.id} className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
              <span className="text-xs">{item.text}</span>
            </div>
          ))}
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
        <div 
          className="w-full h-full flex flex-col"
          style={{
            gap: `${element.props?.gap || 8}px`
          }}
        >
          {(element.props?.items || [
            { id: "1", text: "Stack Item 1" },
            { id: "2", text: "Stack Item 2" },
            { id: "3", text: "Stack Item 3" }
          ]).map((item: any) => (
            <div 
              key={item.id} 
              className="rounded p-2 text-center"
              style={{
                backgroundColor: element.props?.backgroundColor ? 
                  `${element.props.backgroundColor}${Math.round((element.props?.backgroundOpacity || 20) * 2.55).toString(16).padStart(2, '0')}` : 
                  'rgba(59, 130, 246, 0.2)',
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: `${element.props?.fontSize || 12}px`,
                fontWeight: element.props?.fontWeight || '400',
                color: element.props?.textColor || '#ffffff'
              }}
            >
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    {/* Business & Marketing Components */}
    {element.type === "pricing-table" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center">
          <h3 
            className="text-lg font-bold mb-4"
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '18px',
              fontWeight: element.props?.titleFontWeight || '700',
              color: element.props?.titleColor || 'inherit'
            }}
          >
            {element.content}
          </h3>
          <div className={`grid gap-4 w-full`} style={{ 
            gridTemplateColumns: `repeat(${(element.props?.plansArray || Array.from({ length: element.props?.plans || 3 }).map((_, i) => ({ 
              name: ['Basic','Pro','Enterprise'][i] || 'Plan ' + (i+1), 
              price: ['$9','$29','$99'][i] || '$0' 
            }))).length}, minmax(0, 1fr))` 
          }}>
            {(element.props?.plansArray || Array.from({ length: element.props?.plans || 3 }).map((_, i) => ({ 
              name: ['Basic','Pro','Enterprise'][i] || 'Plan ' + (i+1), 
              price: ['$9','$29','$99'][i] || '$0' 
            }))).map((plan: any, idx: number) => {
              const highlightedIndex = element.props?.highlightedPlan ?? 1
              return (
                <div 
                  key={idx}
                  className={`rounded-lg p-3 text-center ${
                    idx === highlightedIndex ? 'bg-primary/10 border-2 border-primary' : 'bg-muted'
                  }`}
                >
                  <div 
                    className="text-sm font-medium"
                    style={{
                      fontFamily: element.props?.planFontFamily || 'inherit',
                      fontSize: element.props?.planNameSize || '14px',
                      fontWeight: element.props?.planNameWeight || '500',
                      color: element.props?.planNameColor || 'inherit'
                    }}
                  >
                    {plan.name}
                  </div>
                  <div 
                    className="text-lg font-bold text-primary"
                    style={{
                      fontFamily: element.props?.planFontFamily || 'inherit',
                      fontSize: element.props?.planPriceSize || '18px',
                      fontWeight: element.props?.planPriceWeight || '700',
                      color: element.props?.planPriceColor || 'hsl(var(--primary))'
                    }}
                  >
                    {plan.price}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )}
    {element.type === "feature-list" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 
            className="text-sm font-medium mb-3"
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
              color: element.props?.titleColor || 'inherit'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            {(element.props?.featuresArray || [
              { text: 'Feature 1' },
              { text: 'Feature 2' },
              { text: 'Feature 3' }
            ]).map((feature: any, idx: number) => {
              const iconType = element.props?.iconType || 'check'
              const iconColor = element.props?.iconColor || 'hsl(var(--primary))'
              
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {iconType === 'check' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: iconColor }}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {iconType === 'star' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: iconColor }}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  {iconType === 'circle' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: iconColor }}>
                      <circle cx="10" cy="10" r="8" />
                    </svg>
                  )}
                  {iconType === 'arrow' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: iconColor }}>
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                  {iconType === 'plus' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: iconColor }}>
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {iconType === 'heart' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: iconColor }}>
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span
                    style={{
                      fontFamily: element.props?.featureFontFamily || 'inherit',
                      fontSize: element.props?.featureFontSize || '12px',
                      fontWeight: element.props?.featureFontWeight || '400',
                      color: element.props?.featureColor || 'inherit'
                    }}
                  >
                    {feature.text}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )}
    {element.type === "faq" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 
            className="text-sm font-medium mb-3"
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
              color: element.props?.titleColor || 'inherit'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            {(element.props?.faqArray || [
              { question: 'What is this service?', answer: 'This is a comprehensive solution...' },
              { question: 'How does it work?', answer: 'It works by...' }
            ]).map((faq: any, idx: number) => (
              <div key={idx} className="border border-border rounded p-2">
                <div 
                  className="text-xs font-medium mb-1"
                  style={{
                    fontFamily: element.props?.questionFontFamily || 'inherit',
                    fontSize: element.props?.questionFontSize || '12px',
                    fontWeight: element.props?.questionFontWeight || '500',
                    color: element.props?.questionColor || 'inherit'
                  }}
                >
                  Q: {faq.question}
                </div>
                <div 
                  className="text-xs text-muted-foreground"
                  style={{
                    fontFamily: element.props?.answerFontFamily || 'inherit',
                    fontSize: element.props?.answerFontSize || '12px',
                    fontWeight: element.props?.answerFontWeight || '400',
                    color: element.props?.answerColor || 'inherit'
                  }}
                >
                  A: {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {element.type === "blog-post" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          {/* Blog Image */}
          {element.props?.imageUrl ? (
            <div 
              className="w-full bg-muted rounded mb-3 bg-cover bg-center"
              style={{
                height: element.props?.imageHeight || "80px",
                backgroundImage: `url(${element.props?.imageUrl})`
              }}
            ></div>
          ) : (
            <div 
              className="w-full bg-muted rounded mb-3"
              style={{
                height: element.props?.imageHeight || "80px"
              }}
            ></div>
          )}
          
          {/* Blog Title */}
          <h3 
            className="text-sm font-medium"
            style={{
              fontFamily: element.props?.titleFontFamily || "inherit",
              fontSize: element.props?.titleFontSize || "14px",
              fontWeight: element.props?.titleFontWeight || "500",
              color: element.props?.titleColor || "#ffffff"
            }}
          >
            {element.props?.title || element.content || "Blog Article"}
          </h3>
          
          {/* Blog Content */}
          <p 
            className="text-xs text-muted-foreground line-clamp-3"
            style={{
              fontFamily: element.props?.contentFontFamily || "inherit",
              fontSize: element.props?.contentFontSize || "12px",
              fontWeight: element.props?.contentFontWeight || "400",
              color: element.props?.contentColor || "#a1a1aa"
            }}
          >
            {element.props?.blogContent || "This is a sample blog post content that demonstrates how the blog post component would look..."}
          </p>
          
          {/* Blog Meta (Author & Date) */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              style={{
                fontFamily: element.props?.metaFontFamily || "inherit",
                fontSize: element.props?.metaFontSize || "12px",
                fontWeight: element.props?.metaFontWeight || "400",
                color: element.props?.metaColor || "#a1a1aa"
              }}
            >
              By {element.props?.author || "Author"}
            </span>
            <span>•</span>
            <span
              style={{
                fontFamily: element.props?.metaFontFamily || "inherit",
                fontSize: element.props?.metaFontSize || "12px",
                fontWeight: element.props?.metaFontWeight || "400",
                color: element.props?.metaColor || "#a1a1aa"
              }}
            >
              {element.props?.date || "Dec 2024"}
            </span>
          </div>
        </div>
      </div>
    )}
    {element.type === "case-study" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          {/* Case Study Image */}
          {element.props?.imageUrl ? (
            <div 
              className="w-full bg-muted rounded mb-3 bg-cover bg-center"
              style={{
                height: element.props?.imageHeight || "64px",
                backgroundImage: `url(${element.props?.imageUrl})`
              }}
            ></div>
          ) : (
            <div 
              className="w-full bg-muted rounded mb-3"
              style={{
                height: element.props?.imageHeight || "64px"
              }}
            ></div>
          )}
          
          {/* Case Study Title */}
          <h3 
            className="text-sm font-medium"
            style={{
              fontFamily: element.props?.titleFontFamily || "inherit",
              fontSize: element.props?.titleFontSize || "18px",
              fontWeight: element.props?.titleFontWeight || "600",
              color: element.props?.titleColor || "#ffffff"
            }}
          >
            {element.props?.title || element.content || "Case Study"}
          </h3>
          
          {/* Case Study Description */}
          <p 
            className="text-xs text-muted-foreground"
            style={{
              fontFamily: element.props?.descriptionFontFamily || "inherit",
              fontSize: element.props?.descriptionFontSize || "14px",
              fontWeight: element.props?.descriptionFontWeight || "400",
              color: element.props?.descriptionColor || "#a1a1aa"
            }}
          >
            {element.props?.description || "Success story showcasing results and outcomes..."}
          </p>
          
          {/* Case Study Metrics */}
          <div className="flex gap-2">
            {(element.props?.metricsArray || [
              { label: '+50% Growth' },
              { label: 'ROI: 300%' }
            ]).map((metric: any, idx: number) => (
              <div 
                key={idx}
                className="bg-primary/20 rounded px-2 py-1 text-xs"
                style={{
                  fontFamily: element.props?.metricFontFamily || "inherit",
                  fontSize: element.props?.metricFontSize || "13px",
                  fontWeight: element.props?.metricFontWeight || "500",
                  color: element.props?.metricColor || "#ffffff"
                }}
              >
                {metric.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {element.type === "cta" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center">
          {/* CTA Title */}
          <h3 
            className="text-lg font-bold mb-2"
            style={{
              fontFamily: element.props?.titleFontFamily || "inherit",
              fontSize: element.props?.titleFontSize || "18px",
              fontWeight: element.props?.titleFontWeight || "700",
              color: element.props?.titleColor || "#ffffff"
            }}
          >
            {element.props?.title || element.content || "Call to Action"}
          </h3>
          
          {/* CTA Description */}
          <p 
            className="text-sm mb-4 opacity-90"
            style={{
              fontFamily: element.props?.descriptionFontFamily || "inherit",
              fontSize: element.props?.descriptionFontSize || "14px",
              fontWeight: element.props?.descriptionFontWeight || "400",
              color: element.props?.descriptionColor || "#ffffff",
              opacity: element.props?.descriptionOpacity || 0.9
            }}
          >
            {element.props?.description || "Get started today and transform your business"}
          </p>
          
          {/* CTA Button */}
          <button 
            className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-all"
            style={{
              fontFamily: element.props?.buttonFontFamily || "inherit",
              fontSize: element.props?.buttonFontSize || "14px",
              fontWeight: element.props?.buttonFontWeight || "500",
              backgroundColor: element.props?.buttonBgColor || "var(--color-background)",
              color: element.props?.buttonTextColor || "var(--color-primary)"
            }}
          >
            {element.props?.buttonText || "Get Started"}
          </button>
        </div>
      </div>
    )}
    {element.type === "hero" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center">
          <h1 
            className="mb-3"
            style={{
              fontFamily: element.props?.titleFontFamily || 'Inter',
              fontSize: `${element.props?.titleFontSize || 24}px`,
              fontWeight: element.props?.titleFontWeight || '700',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.props?.title || "Welcome to Our Platform"}
          </h1>
          <p 
            className="mb-6 max-w-md"
            style={{
              fontFamily: element.props?.descriptionFontFamily || 'Inter',
              fontSize: `${element.props?.descriptionFontSize || 14}px`,
              fontWeight: element.props?.descriptionFontWeight || '400',
              color: element.props?.descriptionColor || '#ffffff',
              opacity: 0.8
            }}
          >
            {element.props?.description || "Build amazing websites with our drag-and-drop builder. No coding required."}
          </p>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{
                fontFamily: element.props?.primaryButtonFontFamily || 'Inter',
                fontSize: `${element.props?.primaryButtonFontSize || 14}px`,
                fontWeight: element.props?.primaryButtonFontWeight || '500',
                backgroundColor: element.props?.primaryButtonBgColor || 'var(--color-primary)',
                color: element.props?.primaryButtonTextColor || '#ffffff'
              }}
            >
              {element.props?.primaryButtonText || "Get Started"}
            </button>
            <button 
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                fontFamily: element.props?.secondaryButtonFontFamily || 'Inter',
                fontSize: `${element.props?.secondaryButtonFontSize || 14}px`,
                fontWeight: element.props?.secondaryButtonFontWeight || '500',
                backgroundColor: element.props?.secondaryButtonBgColor || 'transparent',
                color: element.props?.secondaryButtonTextColor || '#ffffff',
                border: `1px solid ${element.props?.secondaryButtonBorderColor || 'var(--color-border)'}`
              }}
            >
              {element.props?.secondaryButtonText || "Learn More"}
            </button>
          </div>
        </div>
      </div>
    )}
    {element.type === "about" && (
      <div className="w-full h-full" style={elementStyles}>
        <div className="w-full h-full space-y-3">
          <h3 
            style={{
              fontFamily: element.props?.titleFontFamily || 'Inter',
              fontSize: `${element.props?.titleFontSize || 18}px`,
              fontWeight: element.props?.titleFontWeight || '700',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.props?.title || "About Us"}
          </h3>
          <p 
            style={{
              fontFamily: element.props?.descriptionFontFamily || 'Inter',
              fontSize: `${element.props?.descriptionFontSize || 14}px`,
              fontWeight: element.props?.descriptionFontWeight || '400',
              color: element.props?.descriptionColor || '#ffffff',
              opacity: 0.8
            }}
          >
            {element.props?.description || "We are a team of passionate developers and designers creating amazing digital experiences."}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(() => {
              const defaultStats = [
                { value: '100+', label: 'Projects' },
                { value: '50+', label: 'Clients' }
              ]
              const stats = element.props?.statsArray || defaultStats
              return stats.map((stat: any, index: number) => (
                <div key={index} className="text-center">
                  <div 
                    style={{
                      fontFamily: element.props?.statValueFontFamily || 'Inter',
                      fontSize: `${element.props?.statValueFontSize || 18}px`,
                      fontWeight: element.props?.statValueFontWeight || '700',
                      color: element.props?.statValueColor || 'var(--color-primary)'
                    }}
                  >
                    {stat.value}
                  </div>
                  <div 
                    style={{
                      fontFamily: element.props?.statLabelFontFamily || 'Inter',
                      fontSize: `${element.props?.statLabelFontSize || 12}px`,
                      fontWeight: element.props?.statLabelFontWeight || '400',
                      color: element.props?.statLabelColor || '#a1a1aa'
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))
            })()}
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
        <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
          <h3 
            className="w-full" 
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
              textAlign: element.props?.titleAlign || 'center',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <p 
            className="w-full" 
            style={{
              fontFamily: element.props?.descriptionFontFamily || 'inherit',
              fontSize: element.props?.descriptionFontSize || '12px',
              fontWeight: element.props?.descriptionFontWeight || '400',
              color: element.props?.descriptionColor || '#9ca3af',
              textAlign: element.props?.titleAlign || 'center'
            }}
          >
            {element.props?.description || "Stay updated with our latest news"}
          </p>
          <div className="flex gap-2 w-full">
            <input 
              type="email" 
              placeholder={element.props?.emailPlaceholder || "Enter email"}
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
            className="w-full" 
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            <input 
              type="email" 
              placeholder={element.props?.emailPlaceholder || "Email"}
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <input 
              type="password" 
              placeholder={element.props?.passwordPlaceholder || "Password"}
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
            className="w-full" 
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-1">
            <input type="text" placeholder={element.props?.fullNamePlaceholder || "Full Name"} className="w-full border" style={getFormInputStyles(element)} />
            <input type="email" placeholder={element.props?.emailPlaceholder || "Email"} className="w-full border" style={getFormInputStyles(element)} />
            <input type="password" placeholder={element.props?.passwordPlaceholder || "Password"} className="w-full border" style={getFormInputStyles(element)} />
            <input type="password" placeholder={element.props?.confirmPasswordPlaceholder || "Confirm Password"} className="w-full border" style={getFormInputStyles(element)} />
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
            className="w-full" 
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
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
                fontFamily: element.props?.questionFontFamily || 'inherit',
                fontSize: element.props?.questionFontSize || '12px',
                fontWeight: element.props?.questionFontWeight || '500',
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
                    fontFamily: element.props?.ratingButtonFontFamily || 'inherit',
                    width: element.props?.ratingButtonSize || '24px',
                    height: element.props?.ratingButtonSize || '24px',
                    fontSize: element.props?.ratingButtonFontSize || '12px',
                    fontWeight: element.props?.ratingButtonFontWeight || '400',
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
              placeholder={element.props?.commentsPlaceholder || "Additional comments"} 
              className="w-full border resize-none" 
              style={{
                fontFamily: element.props?.textareaFontFamily || 'inherit',
                padding: element.props?.textareaPadding || '8px 12px',
                fontSize: element.props?.textareaFontSize || '12px',
                fontWeight: element.props?.textareaFontWeight || '400',
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
            className="w-full" 
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder={element.props?.productPlaceholder || "Product Name"} 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <input 
              type="number" 
              placeholder={element.props?.quantityPlaceholder || "Quantity"} 
              className="w-full border" 
              style={getFormInputStyles(element)}
            />
            <input 
              type="text" 
              placeholder={element.props?.addressPlaceholder || "Shipping Address"} 
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
            className="w-full" 
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
              textAlign: element.props?.titleAlign || 'left',
              color: element.props?.titleColor || '#ffffff'
            }}
          >
            {element.content}
          </h3>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder={element.props?.servicePlaceholder || "Service"} 
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
            className="w-full" 
            style={{
              fontFamily: element.props?.titleFontFamily || 'inherit',
              fontSize: element.props?.titleFontSize || '14px',
              fontWeight: element.props?.titleFontWeight || '500',
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
                fontFamily: element.props?.selectFontFamily || 'inherit',
                padding: element.props?.selectPadding || '8px 12px',
                fontSize: element.props?.selectFontSize || '12px',
                fontWeight: element.props?.selectFontWeight || '400',
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
              placeholder={element.props?.feedbackPlaceholder || "Your feedback"} 
              className="w-full border resize-none" 
              style={{
                fontFamily: element.props?.textareaFontFamily || 'inherit',
                padding: element.props?.textareaPadding || '8px 12px',
                fontSize: element.props?.textareaFontSize || '12px',
                fontWeight: element.props?.textareaFontWeight || '400',
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
            
            {/* Rotation handle - positioned above element */}
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing z-20"
              onMouseDown={(e) => handleRotateMouseDown(e, element.id)}
              title="Rotate element"
            >
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              {/* Connection line from handle to element */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-primary"></div>
            </div>
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
          onStartFooterBottomResize={startFooterBottomResize}
          defaultSectionHeight={DEFAULT_SECTION}
          toggleCategoryRef={toggleCategoryRef}
          sectionHasElements={sectionHasElements}
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
  onStartFooterBottomResize,
  defaultSectionHeight,
  toggleCategoryRef,
  sectionHasElements,
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
  onStartFooterBottomResize: (clientY: number) => void
  defaultSectionHeight: number
  toggleCategoryRef?: React.MutableRefObject<((categoryName: string) => void) | null>
  sectionHasElements: (sectionIndex: number) => boolean
}) {
  // Fine-grained hover states so sections act independently
  const [hoverHeader, setHoverHeader] = useState(false)
  const [hoverFooter, setHoverFooter] = useState(false)
  const [hoverHeaderBottom, setHoverHeaderBottom] = useState(false)
  const [hoverFooterTop, setHoverFooterTop] = useState(false)
  const [hoverFooterBottom, setHoverFooterBottom] = useState(false)
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
              
              {/* Display buttons only if section is empty (no elements) */}
              {!sectionHasElements(idx) && (
                <>
                  {/* Choose your starting point - Smooth transitioning UI */}
                  {sec.height > 160 ? (
                /* Full size - show all elements with text */
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300 ease-in-out">
                  <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                    <h3 className="text-sm font-medium text-blue-400 mb-2 transition-opacity duration-200">Choose your starting point</h3>
                    <div className="flex gap-4">
                      {/* Designed Section Button */}
                      <button
                        type="button"
                        className="flex flex-col items-center gap-3 px-6 py-5 bg-card hover:bg-card/80 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg border-2 border-border hover:border-blue-400 w-32"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (toggleCategoryRef?.current) {
                            toggleCategoryRef.current("Layout")
                          }
                        }}
                        title="Choose from pre-designed sections"
                      >
                        <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/30 transition-transform duration-200">
                          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-card-foreground text-center transition-opacity duration-200">Designed Section</span>
                      </button>

                      {/* Grid Layout Button */}
                      <button
                        type="button"
                        className="flex flex-col items-center gap-3 px-6 py-5 bg-card hover:bg-card/80 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg border-2 border-border hover:border-blue-400 w-32"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (toggleCategoryRef?.current) {
                            toggleCategoryRef.current("Layout")
                          }
                        }}
                        title="Create a custom grid layout"
                      >
                        <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center border border-border transition-transform duration-200">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-card-foreground text-center transition-opacity duration-200">Grid Layout</span>
                      </button>

                      {/* Add an Element Button */}
                      <button
                        type="button"
                        className="flex flex-col items-center gap-3 px-6 py-5 bg-card hover:bg-card/80 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg border-2 border-border hover:border-blue-400 w-32"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (toggleCategoryRef?.current) {
                            toggleCategoryRef.current("Basic Elements")
                          }
                        }}
                        title="Add individual elements from the sidebar"
                      >
                        <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center border border-border transition-transform duration-200">
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-card-foreground text-center transition-opacity duration-200">Add an Element</span>
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 transition-opacity duration-200">
                      Choose a grid layout, add elements<br />
                      or add a <a href="#" className="text-blue-400 hover:underline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>Designed Section</a>
                    </p>
                  </div>
                </div>
              ) : sec.height > 128 ? (
                /* Compact size - show 3 icon buttons without labels (smooth transition) */
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300 ease-in-out">
                  <div className="flex gap-3 animate-in fade-in zoom-in-95 duration-300">
                    {/* Designed Section Button - Icon Only */}
                    <button
                      type="button"
                      className="flex items-center justify-center p-3 bg-card hover:bg-card/80 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:scale-110 border-2 border-border hover:border-blue-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (toggleCategoryRef?.current) {
                          toggleCategoryRef.current("Layout")
                        }
                      }}
                      title="Designed Section"
                    >
                      <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center border border-blue-500/30">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                        </svg>
                      </div>
                    </button>

                    {/* Grid Layout Button - Icon Only */}
                    <button
                      type="button"
                      className="flex items-center justify-center p-3 bg-card hover:bg-card/80 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:scale-110 border-2 border-border hover:border-blue-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (toggleCategoryRef?.current) {
                          toggleCategoryRef.current("Layout")
                        }
                      }}
                      title="Grid Layout"
                    >
                      <div className="w-8 h-8 bg-muted/50 rounded flex items-center justify-center border border-border">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      </div>
                    </button>

                    {/* Add Element Button - Icon Only */}
                    <button
                      type="button"
                      className="flex items-center justify-center p-3 bg-card hover:bg-card/80 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:scale-110 border-2 border-border hover:border-blue-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (toggleCategoryRef?.current) {
                          toggleCategoryRef.current("Basic Elements")
                        }
                      }}
                      title="Add an Element"
                    >
                      <div className="w-8 h-8 bg-muted/50 rounded flex items-center justify-center border border-border">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* Minimal size - show single centered button with smooth fade-in */
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300 ease-in-out">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 hover:bg-blue-600 text-white text-xs rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 border border-blue-400/50 animate-in fade-in zoom-in-95 duration-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (toggleCategoryRef?.current) {
                        toggleCategoryRef.current("Basic Elements")
                      }
                    }}
                    title="Add Element - Expand section for more options"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">Add Element</span>
                  </button>
                </div>
              )}
                </>
              )}
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
          {/* Per-section bottom add button */}
          <div
            className="absolute left-0 right-0 pointer-events-auto"
            style={{ bottom: 0, height: 24 }}
            onMouseEnter={() => setHoverSectionBottomIndex(idx)}
            onMouseLeave={() => setHoverSectionBottomIndex((v) => (v === idx ? null : v))}
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
      {/* Header bottom boundary */}
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

      {/* Divider resize handles between sections */}
      {sections.map((_, idx) => {
        // Only render divider if there's a next section
        if (idx >= sections.length - 1) return null
        
        // Calculate the position of this divider (bottom of current section / top of next section)
        const dividerTop = sectionTops[idx] + sections[idx].height
        
        return (
          <div
            key={`divider-${idx}`}
            className="absolute left-0 right-0 pointer-events-auto cursor-ns-resize"
            style={{ top: `${dividerTop}px`, height: 32 }}
            onMouseDown={(e) => {
              e.stopPropagation()
              onStartSectionResize(idx, e.clientY)
            }}
          >
            {/* Optional: Add a visual indicator on hover */}
            <div className="absolute inset-0 hover:bg-blue-400/5 transition-colors" />
          </div>
        )
      })}

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

      {/* Footer bottom boundary - NEW: Allows expanding/shrinking canvas */}
      <div
        className="absolute left-0 right-0 pointer-events-auto cursor-ns-resize"
        style={{ bottom: 0, height: 32 }}
        onMouseEnter={() => setHoverFooterBottom(true)}
        onMouseLeave={() => setHoverFooterBottom(false)}
        onMouseDown={(e) => {
          e.stopPropagation()
          onStartFooterBottomResize(e.clientY)
        }}
      >
        {/* Visual indicator on hover */}
        {hoverFooterBottom && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400/30 transition-colors">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-emerald-400 text-white text-[10px] px-2 py-0.5 rounded-t whitespace-nowrap">
              Resize Canvas
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Tabs Component with interactive functionality
function TabsComponent({ element }: { element: BuilderElement }) {
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  
  const tabs = element.props?.tabs || []
  const activeTab = tabs[activeTabIndex]

  return (
    <div className="text-card-foreground bg-card border border-border rounded-lg p-4 flex flex-col w-full h-full">
      {tabs.length > 0 ? (
        <>
          <div className="flex border-b border-border mb-3 flex-shrink-0">
            {tabs.map((tab: {id: string, title: string, content: string}, index: number) => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabIndex(index)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  index === activeTabIndex
                    ? 'font-medium border-b-2 border-primary text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{
                  ...(element.props?.tabTitleFontFamily && element.props.tabTitleFontFamily !== 'default' && element.props.tabTitleFontFamily !== 'inherit' && { fontFamily: element.props.tabTitleFontFamily }),
                  ...(element.props?.tabTitleFontSize && { fontSize: element.props.tabTitleFontSize + 'px' }),
                  ...(element.props?.tabTitleFontWeight && { fontWeight: element.props.tabTitleFontWeight }),
                  ...(element.props?.tabTitleTextColor && { color: element.props.tabTitleTextColor })
                }}
              >
                {tab.title || `Tab ${index + 1}`}
              </div>
            ))}
          </div>
          <div className="text-sm flex-1 overflow-auto">
            <div
              style={{
                ...(element.props?.tabContentFontFamily && element.props.tabContentFontFamily !== 'default' && element.props.tabContentFontFamily !== 'inherit' && { fontFamily: element.props.tabContentFontFamily }),
                ...(element.props?.tabContentFontSize && { fontSize: element.props.tabContentFontSize + 'px' }),
                ...(element.props?.tabContentFontWeight && { fontWeight: element.props.tabContentFontWeight }),
                ...(element.props?.tabContentTextColor && { color: element.props.tabContentTextColor })
              }}
            >
              {activeTab?.content || 'Tab content goes here'}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          <div className="text-center">
            <div className="w-12 h-12 bg-muted/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-sm">No tabs added yet</p>
            <p className="text-xs mt-1">Add tabs in the properties panel</p>
          </div>
        </div>
      )}
    </div>
  )
}
