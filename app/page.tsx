"use client"

import { Canvas } from "@/components/builder/canvas"
import { ComponentLibrary } from "@/components/builder/component-library"
import { LayersPanel } from "@/components/builder/layers-panel"
import { PropertiesPanel } from "@/components/builder/properties-panel"
import { TopToolbar } from "@/components/builder/top-toolbar"
import { useBuilderState } from "@/hooks/use-builder-state"
import type { BuilderElement } from "@/lib/builder-types"
import { useEffect, useState } from "react"

export default function WebsiteBuilder() {
  const {
    elements,
    selectedElements,
    setSelectedElements,
    currentBreakpoint,
    setCurrentBreakpoint,
    snapSettings,
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
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Library */}
        <div className="w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0">
          <ComponentLibrary onAddTemplate={handleAddTemplate} />
        </div>

        {/* Center Canvas */}
        <div className="flex-1 bg-canvas canvas-grid overflow-auto">
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
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="w-80 bg-sidebar border-l border-sidebar-border flex-shrink-0">
          <PropertiesPanel
            selectedElements={selectedElements}
            elements={elements}
            currentBreakpoint={currentBreakpoint}
            onUpdateElement={updateElement}
            onUpdateElementResponsiveStyle={updateElementResponsiveStyle}
          />
        </div>
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
  )
}
