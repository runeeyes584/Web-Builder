"use client"

import { Canvas } from "@/components/builder/canvas"
import { ComponentLibrary } from "@/components/builder/component-library"
import { LayersPanel } from "@/components/builder/layers-panel"
import { PropertiesPanel } from "@/components/builder/properties-panel"
import { TopToolbar } from "@/components/builder/top-toolbar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useBuilderState } from "@/hooks/use-builder-state"
import type { BuilderElement } from "@/lib/builder-types"
import { componentCategories } from "@/lib/component-categories"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { DndProvider, useDragLayer } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

export default function WebsiteBuilder() {
  const {
    elements,
    selectedElements,
    setSelectedElements,
    currentBreakpoint,
    setCurrentBreakpoint,
    snapSettings,
    showSections,
    setShowSections,
    addElement,
    updateElement,
    updateElementResponsiveStyle,
    updateElementPosition,
    deleteElement,
    duplicateElement,
    snapToGrid,
    undo,
    redo,
    canUndo,
    canRedo,
    loadProject,
  } = useBuilderState()

  const [isDarkMode, setIsDarkMode] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(true)
  const [showLayers, setShowLayers] = useState(false)

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  // Apply dark mode to HTML and save preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])


  // Custom drag layer for smoother preview
  const DragLayer: React.FC = () => {
    const { isDragging, itemType, item, currentOffset } = useDragLayer((monitor) => ({
      isDragging: monitor.isDragging(),
      itemType: monitor.getItemType(),
      item: monitor.getItem() as any,
      currentOffset: monitor.getClientOffset(),
    }))

    if (!isDragging || itemType !== 'COMPONENT' || !currentOffset) return null

    // Find the icon for the component
    const getComponentIcon = (type: string) => {
      const allComponents = componentCategories.flatMap((cat: any) => cat.components)
      const component = allComponents.find((comp: any) => comp.type === type)
      return component?.icon
    }

    const ComponentIcon = getComponentIcon(item?.componentType)

    // Center the drag preview on cursor
    const componentWidth = 220 // min-w-[220px]
    const componentHeight = 80 // approximate height
    const centerOffsetX = componentWidth / 2
    const centerOffsetY = componentHeight / 2

    const style: React.CSSProperties = {
      position: 'fixed',
      pointerEvents: 'none',
      left: 0,
      top: 0,
      transform: `translate(${currentOffset.x - centerOffsetX}px, ${currentOffset.y - centerOffsetY}px)`,
      zIndex: 9999,
      willChange: 'transform',
      backfaceVisibility: 'hidden',
      perspective: '1000px'
    }

    return (
      <div 
        style={style} 
        className="relative bg-background/95 backdrop-blur-md border-2 border-dashed border-primary/60 rounded-lg p-3 shadow-2xl min-w-[220px] opacity-95"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5 rounded-lg blur-lg -z-10 animate-pulse"></div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/60 rounded-full animate-ping"
              style={{
                left: `${20 + i * 30}%`,
                top: `${20 + i * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
        
        <div className="relative flex items-center gap-3 z-10">
          {/* Icon with enhanced glow */}
          <div className="relative w-10 h-10 bg-gradient-to-br from-primary/40 via-primary/30 to-primary/20 rounded-lg flex items-center justify-center shadow-lg">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm animate-pulse"></div>
            {ComponentIcon && <ComponentIcon className="relative w-5 h-5 text-primary-foreground drop-shadow-lg z-10" />}
          </div>
          
          {/* Content with improved typography */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground/90 mb-1 truncate tracking-wide">
              {item?.name || 'Component'}
            </p>
            <p className="text-xs text-muted-foreground/80 truncate font-medium">
              Drag to place on canvas
            </p>
          </div>
          
          {/* Enhanced drag indicator */}
          <div className="relative w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm animate-pulse"></div>
            <div className="relative flex space-x-0.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Static dashed border */}
        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-primary/50">
        </div>
        
        {/* Corner accents */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-primary/40 rounded-full animate-ping"></div>
        <div className="absolute top-1 right-1 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1 left-1 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
      </div>
    )
  }

  const breakpointWidths = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  }

  const handleElementSelect = (elementId: string, multiSelect = false) => {
    if (!elementId) {
      setSelectedElements([])
      return
    }

    if (multiSelect) {
      setSelectedElements((prev) =>
        prev.includes(elementId) ? prev.filter((id) => id !== elementId) : [...prev, elementId],
      )
    } else {
      setSelectedElements([elementId])
    }
  }

  const handleAddTemplate = (templateElements: BuilderElement[]) => {
    templateElements.forEach((element) => {
      addElement(element)
    })
  }

  const handleRotateSelected = () => {
    selectedElements.forEach((elementId) => {
      const element = elements.find(el => el.id === elementId)
      if (element) {
        const currentRotation = element.styles.transform?.includes('rotate') 
          ? parseInt(element.styles.transform.match(/rotate\((\d+)deg\)/)?.[1] || '0')
          : 0
        
        const newRotation = (currentRotation + 90) % 360
        updateElement(elementId, {
          styles: {
            ...element.styles,
            transform: `rotate(${newRotation}deg)`,
          }
        })
      }
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault()
              redo()
            } else {
              e.preventDefault()
              undo()
            }
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 'd':
            e.preventDefault()
            if (selectedElements.length > 0) {
              selectedElements.forEach((id) => duplicateElement(id))
            }
            break
          case 'r':
            e.preventDefault()
            if (selectedElements.length > 0) {
              handleRotateSelected()
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedElements, duplicateElement, handleRotateSelected])



  return (
    <>
      <SignedOut>
        {/* This should not show as middleware redirects to /welcome */}
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SignedOut>

      <SignedIn>
        <DndProvider backend={HTML5Backend}>
          <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Top Toolbar */}
      <TopToolbar
        currentBreakpoint={currentBreakpoint}
        onBreakpointChange={setCurrentBreakpoint}
        isDarkMode={isDarkMode}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedElements={selectedElements}
        onDuplicateSelected={() => {
          selectedElements.forEach((id) => duplicateElement(id))
        }}
        elements={elements}
        onLoadProject={loadProject}
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onGridToggle={setShowGrid}
        showLayers={showLayers}
        onLayersToggle={setShowLayers}
        onRotateSelected={handleRotateSelected}
        showSections={showSections}
        onSectionsToggle={setShowSections}
      />

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - resizable */}
          <ResizablePanel defaultSize={20} minSize={12} maxSize={35} className="min-w-[200px]">
            <div className="h-full bg-sidebar border-r border-sidebar-border">
              <ComponentLibrary onAddTemplate={handleAddTemplate} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-sidebar-border" />

          {/* Center Canvas */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full bg-canvas canvas-grid overflow-auto custom-scrollbar">
              <div className="min-h-full flex items-start justify-center p-8">
                <div
                  className={`${breakpointWidths[currentBreakpoint]} transition-all duration-300 bg-card border border-border rounded-lg shadow-lg min-h-[600px]`}
                >
                  <Canvas
                    elements={elements}
                    selectedElements={selectedElements}
                    currentBreakpoint={currentBreakpoint}
                    onElementSelect={handleElementSelect}
                    onAddElement={addElement}
                    onUpdateElement={updateElement}
                    onUpdateElementPosition={updateElementPosition}
                    onDeleteElement={deleteElement}
                    onDuplicateElement={duplicateElement}
                    snapToGrid={snapToGrid}
                    snapSettings={snapSettings}
                    zoom={zoom}
                    showGrid={showGrid}
                    showSections={showSections}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-sidebar-border" />

          {/* Right Sidebar - resizable */}
          <ResizablePanel defaultSize={20} minSize={12} maxSize={35} className="min-w-[240px]">
            <div className="h-full bg-sidebar border-l border-sidebar-border">
              <PropertiesPanel
                selectedElements={selectedElements}
                elements={elements}
                currentBreakpoint={currentBreakpoint}
                onUpdateElement={updateElement}
                onUpdateElementResponsiveStyle={updateElementResponsiveStyle}
                onUpdateElementPosition={updateElementPosition}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Layers Panel */}
      <LayersPanel
        elements={elements}
        selectedElements={selectedElements}
        onElementSelect={handleElementSelect}
        onUpdateElement={updateElement}
        onDeleteElement={deleteElement}
        onDuplicateElement={duplicateElement}
        isOpen={showLayers}
        onClose={() => setShowLayers(false)}
      />
          </div>
          <DragLayer />
        </DndProvider>
      </SignedIn>
    </>
  )
}
