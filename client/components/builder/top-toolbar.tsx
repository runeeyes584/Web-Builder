"use client"

import { Button } from "@/components/ui/button"
import type { Breakpoint, BuilderElement, BuilderPage } from "@/lib/builder-types"
import { UserButton } from "@clerk/nextjs"
import { Copy, Download, Eye, Grid, Hand, Layers, Layout, Monitor, Moon, MousePointer2, Redo, RotateCcw, Share2, Smartphone, Sun, Tablet, Undo, ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"
import { ExportModal } from "./export-modal"
import { PreviewModal } from "./preview-modal"
import { ProjectManagerComponent } from "./project-manager"
import { ShareDialog } from "./share-dialog"

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
  pages?: BuilderPage[]
  onLoadProject?: (pages: BuilderPage[]) => void
  layout?: { headerHeight: number; footerHeight: number; sections: { id: string; height: number }[] } | null
  zoom?: number
  onZoomChange?: (zoom: number) => void
  showGrid?: boolean
  onGridToggle?: (show: boolean) => void
  showLayers?: boolean
  onLayersToggle?: (show: boolean) => void
  onRotateSelected?: () => void
  showSections?: boolean
  onSectionsToggle?: (show: boolean) => void
  showLeftSidebar?: boolean
  onLeftSidebarToggle?: (show: boolean) => void
  showRightSidebar?: boolean
  onRightSidebarToggle?: (show: boolean) => void
  // Share props
  projectId?: string
  projectName?: string
  isOwner?: boolean
  isPublic?: boolean
  currentUserClerkId?: string
  onProjectChange?: (projectId: string, projectName: string, isPublic?: boolean) => void
  onPublicChange?: (isPublic: boolean) => void
  hasUnsavedChanges?: boolean
  activeTool?: 'select' | 'hand'
  onToolChange?: (tool: 'select' | 'hand') => void
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
  pages = [],
  onLoadProject,
  layout = null,
  zoom = 100,
  onZoomChange,
  showGrid = true,
  onGridToggle,
  showLayers = false,
  onLayersToggle,
  onRotateSelected,
  showSections = true,
  onSectionsToggle,
  showLeftSidebar = true,
  onLeftSidebarToggle,
  showRightSidebar = true,
  onRightSidebarToggle,
  projectId,
  projectName = "Untitled Project",
  isOwner = true,
  isPublic = false,
  currentUserClerkId = "",
  onProjectChange,
  onPublicChange,
  hasUnsavedChanges = false,
  activeTool = 'select',
  onToolChange,
}: TopToolbarProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showShare, setShowShare] = useState(false)

  return (
    <>
      <div className="h-14 bg-gradient-to-r from-card via-card to-card/95 border-b border-border flex items-center gap-4 px-4 backdrop-blur-sm">
        {/* Left Section - Logo & Project */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-sm">WB</span>
            </div>
            <div className="hidden lg:block">
              <span className="font-semibold text-foreground text-sm whitespace-nowrap">Website Builder</span>
            </div>
          </div>

          <div className="h-6 w-px bg-border" />

          <ProjectManagerComponent
            pages={pages}
            onLoadProject={onLoadProject || (() => { })}
            currentProjectName={projectName}
            onProjectChange={onProjectChange}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>

        {/* Center Section - Main Controls */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
          {/* Tool Switcher */}
          <div className="flex items-center gap-0.5 bg-gradient-to-r from-muted to-muted/80 rounded-lg p-0.5 shadow-sm">
            <Button
              variant={activeTool === "select" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange?.("select")}
              className="h-8 w-8 p-0"
              title="Select Tool (V)"
            >
              <MousePointer2 className="w-4 h-4" />
            </Button>
            <Button
              variant={activeTool === "hand" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange?.("hand")}
              className="h-8 w-8 p-0"
              title="Hand Tool (H)"
            >
              <Hand className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Breakpoint Controls */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <Button
              variant={currentBreakpoint === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => onBreakpointChange("desktop")}
              className="h-7 w-7 p-0"
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={currentBreakpoint === "tablet" ? "default" : "ghost"}
              size="sm"
              onClick={() => onBreakpointChange("tablet")}
              className="h-7 w-7 p-0"
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={currentBreakpoint === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => onBreakpointChange("mobile")}
              className="h-7 w-7 p-0"
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Zoom Controls - Compact */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange?.(Math.max(25, zoom - 25))}
              className="h-7 w-7 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-medium px-1.5 min-w-[2.5rem] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange?.(Math.min(200, zoom + 25))}
              className="h-7 w-7 p-0"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* View Controls - Icon only */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <Button
              variant={showGrid ? "default" : "ghost"}
              size="sm"
              onClick={() => onGridToggle?.(!showGrid)}
              className="h-7 w-7 p-0"
              title="Toggle Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={showSections ? "default" : "ghost"}
              size="sm"
              onClick={() => onSectionsToggle?.(!showSections)}
              className="h-7 w-7 p-0"
              title="Toggle Sections"
            >
              <Layout className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={showLayers ? "default" : "ghost"}
              size="sm"
              onClick={() => onLayersToggle?.(!showLayers)}
              className="h-7 w-7 p-0"
              title="Toggle Layers"
            >
              <Layers className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Edit Tools - Icon only */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-7 w-7 p-0"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-7 w-7 p-0"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicateSelected}
              disabled={selectedElements.length === 0}
              className="h-7 w-7 p-0"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRotateSelected}
              disabled={selectedElements.length === 0}
              className="h-7 w-7 p-0"
              title="Rotate 90°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Main Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShare(true)}
              className="h-8 px-3 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
              disabled={!projectId}
              title="Share Project"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="ml-1.5 hidden lg:inline text-xs">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="h-8 px-3 bg-primary/5 hover:bg-primary/10"
              title="Preview Window"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="ml-1.5 hidden lg:inline text-xs">Preview</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExport(true)}
              className="h-8 px-3 bg-primary/5 hover:bg-primary/10"
              title="Export Project"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="ml-1.5 hidden lg:inline text-xs">Export</span>
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDarkModeToggle}
            className="h-8 w-8 p-0 hover:bg-primary/10"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <div className="h-6 w-px bg-border" />
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
      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} elements={elements} pages={pages} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} elements={elements} pages={pages} />
      {projectId && (
        <ShareDialog
          open={showShare}
          onOpenChange={setShowShare}
          projectId={projectId}
          projectName={projectName}
          isOwner={isOwner}
          isPublic={isPublic}
          currentUserClerkId={currentUserClerkId}
          onPublicChange={onPublicChange}
        />
      )}
    </>
  )
}
