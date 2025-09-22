"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PreviewModal } from "./preview-modal"
import { ExportModal } from "./export-modal"
import { ProjectManagerComponent } from "./project-manager"
import { Monitor, Tablet, Smartphone, Eye, Download, Undo, Redo, Copy, Moon, Sun } from "lucide-react"
import type { Breakpoint, BuilderElement } from "@/lib/builder-types"

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
}: TopToolbarProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showExport, setShowExport] = useState(false)

  return (
    <>
      <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
        {/* Left Section - Logo & Project */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">WB</span>
            </div>
            <span className="font-semibold text-foreground">Website Builder</span>
          </div>

          <div className="h-6 w-px bg-border" />

          <ProjectManagerComponent elements={elements} onLoadProject={onLoadProject || (() => {})} />
        </div>

        {/* Center Section - Breakpoint Controls */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={currentBreakpoint === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => onBreakpointChange("desktop")}
            className="h-8"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={currentBreakpoint === "tablet" ? "default" : "ghost"}
            size="sm"
            onClick={() => onBreakpointChange("tablet")}
            className="h-8"
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={currentBreakpoint === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => onBreakpointChange("mobile")}
            className="h-8"
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
              <Redo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDuplicateSelected} disabled={selectedElements.length === 0}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowExport(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button variant="ghost" size="sm" onClick={onDarkModeToggle}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} elements={elements} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} elements={elements} />
    </>
  )
}
