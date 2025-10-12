"use client"

import { Button } from "@/components/ui/button"
import type { Breakpoint, BuilderElement } from "@/lib/builder-types"
import { UserButton } from "@clerk/nextjs"
import { Copy, Download, Eye, Grid, Layers, Layout, Monitor, Moon, Redo, RotateCcw, Smartphone, Sun, Tablet, Undo, ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"
import { ExportModal } from "./export-modal"
import { PreviewModal } from "./preview-modal"
import { ProjectManagerComponent } from "./project-manager"

interface TopToolbarProps {
  currentBreakpoint: Breakpoint
  onBreakpointChange: (breakpoint: Breakpoint) => void
  isDarkMode: boolean
  onDarkModeToggle: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  selectedElements: string[]
  onDuplicateSelected: () => void
  elements?: BuilderElement[]
  onLoadProject?: (elements: BuilderElement[]) => void
  zoom?: number
  onZoomChange?: (zoom: number) => void
  showGrid?: boolean
  onGridToggle?: (show: boolean) => void
  showLayers?: boolean
  onLayersToggle?: (show: boolean) => void
  onRotateSelected?: () => void
  showSections?: boolean
  onSectionsToggle?: (show: boolean) => void
  
}

export function TopToolbar({
  currentBreakpoint,
  onBreakpointChange,
  isDarkMode,
  onDarkModeToggle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedElements,
  onDuplicateSelected,
  elements = [],
  onLoadProject,
  zoom = 100,
  onZoomChange,
  showGrid = true,
  onGridToggle,
  showLayers = false,
  onLayersToggle,
  onRotateSelected,
  showSections = true,
  onSectionsToggle,
}: TopToolbarProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showExport, setShowExport] = useState(false)

  return (
    <>
      <div className="h-16 bg-gradient-to-r from-card via-card to-card/95 border-b border-border flex items-center justify-between gap-4 px-4 backdrop-blur-sm overflow-hidden">
        {/* Left Section - All Controls */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Logo & Project */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-lg">WB</span>
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-lg whitespace-nowrap truncate block max-w-[180px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[300px]">Website Builder</span>
              <p className="text-xs text-muted-foreground truncate hidden sm:block max-w-[240px]">Professional Design Tool</p>
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="shrink-0">
            <ProjectManagerComponent elements={elements} onLoadProject={onLoadProject || (() => {})} />
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Breakpoint Controls & Tools */}
          <div className="flex items-center gap-4 shrink-0 min-w-0">
          {/* Breakpoint Controls */}
          <div className="flex items-center gap-1 bg-gradient-to-r from-muted to-muted/80 rounded-xl p-1 shadow-sm">
            <Button
              variant={currentBreakpoint === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => onBreakpointChange("desktop")}
              className="h-9 px-3"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop
            </Button>
            <Button
              variant={currentBreakpoint === "tablet" ? "default" : "ghost"}
              size="sm"
              onClick={() => onBreakpointChange("tablet")}
              className="h-9 px-3"
            >
              <Tablet className="w-4 h-4 mr-2" />
              Tablet
            </Button>
            <Button
              variant={currentBreakpoint === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => onBreakpointChange("mobile")}
              className="h-9 px-3"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => onZoomChange?.(Math.max(25, zoom - 25))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[3rem] text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={() => onZoomChange?.(Math.min(200, zoom + 25))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-1">
            <Button 
              variant={showGrid ? "default" : "ghost"} 
              size="sm" 
              onClick={() => onGridToggle?.(!showGrid)}
              title="Toggle Grid"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={showSections ? "default" : "ghost"} 
              size="sm" 
              onClick={() => onSectionsToggle?.(!showSections)}
              title="Toggle Sections"
            >
              <Layout className="w-4 h-4" />
            </Button>
            <Button 
              variant={showLayers ? "default" : "ghost"} 
              size="sm" 
              onClick={() => onLayersToggle?.(!showLayers)}
              title="Toggle Layers Panel"
            >
              <Layers className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Edit Tools */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onUndo} 
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRedo} 
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDuplicateSelected} 
              disabled={selectedElements.length === 0}
              title="Duplicate selected elements (Ctrl+D)"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRotateSelected}
              disabled={selectedElements.length === 0}
              title="Rotate selected elements 90°"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Main Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="bg-primary/5 hover:bg-primary/10">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="bg-primary/5 hover:bg-primary/10">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="h-8 w-px bg-border" />

          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={onDarkModeToggle} className="hover:bg-primary/10">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          </div>
        </div>

        {/* Right Section - User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-card border border-border shadow-lg",
                userButtonPopoverActionButton: "text-foreground hover:bg-accent",
                userButtonPopoverActionButtonText: "text-foreground",
                userButtonPopoverFooter: "hidden"
              }
            }}
            afterSignOutUrl="/welcome"
            showName={false}
          />
        </div>
      </div>

      {/* Modals */}
      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} elements={elements} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} elements={elements} />
    </>
  )
}
