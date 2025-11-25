"use client"

import { CollaborativeCanvas } from "@/components/builder/collaborative-canvas"
import { ComponentLibrary } from "@/components/builder/component-library"
import { LayersPanel } from "@/components/builder/layers-panel"
import { PageManager } from "@/components/builder/page-manager"
import { PropertiesPanel } from "@/components/builder/properties-panel"
import { TopToolbar } from "@/components/builder/top-toolbar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useAutoSave } from "@/hooks/use-auto-save"
import { useBuilderState } from "@/hooks/use-builder-state"
import type { BuilderElement, BuilderPage, RegionsLayout } from "@/lib/builder-types"
import { componentCategories } from "@/lib/component-categories"
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import { Layers, LayoutGrid, Palette } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"
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
    isPreviewMode,
    setIsPreviewMode,
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
    // Multi-page state and functions
    pages,
    activePageId,
    addPage,
    deletePage,
    duplicatePage,
    renamePage,
    switchPage,
    updatePageMetadata,
    activeTool,
    setActiveTool,
  } = useBuilderState()

  const [isDarkMode, setIsDarkMode] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(true)
  const [showLayers, setShowLayers] = useState(false)
  const [showPageManager, setShowPageManager] = useState(true) // Show page manager by default
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  // Active left panel: components | pages | siteStyle
  const [activeLeftPanel, setActiveLeftPanel] = useState<'components' | 'pages' | 'siteStyle'>('pages')
  const [regionsLayout, setRegionsLayout] = useState<RegionsLayout | null>(null)
  const [canvasLayout, setCanvasLayout] = useState<{ headerHeight: number; footerHeight: number; sections: { id: string; height: number }[] } | null>(null)

  // Project and collaboration state
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined)
  const [currentProjectName, setCurrentProjectName] = useState("Untitled Project")
  const [isProjectOwner, setIsProjectOwner] = useState(true)
  const [isProjectPublic, setIsProjectPublic] = useState(false)
  const [userRole, setUserRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER'>('OWNER')

  // Get current user info from Clerk
  const { user } = useUser()

  // Computed property for edit permission
  const canEdit = userRole !== 'VIEWER'

  // Auto-save hook - only enabled when user has edit permission and project is open
  const { hasUnsavedChanges } = useAutoSave({
    projectId: currentProjectId || null,
    projectName: currentProjectName,
    elements: elements,
    layout: canvasLayout,
    enabled: canEdit && !!currentProjectId, // Only auto-save if can edit and project is open
    interval: 30000, // Auto-save every 30 seconds after last change
  })

  // Ref to store sendElementChange function from CollaborativeCanvas
  const sendElementChangeRef = useRef<((change: any) => void) | null>(null)

  // Ref to store sendLayoutChange function from CollaborativeCanvas
  const sendLayoutChangeRef = useRef<((layout: any) => void) | null>(null)

  // Track undo/redo operations
  const undoRedoRef = useRef<{ isActive: boolean; beforeElements: BuilderElement[] }>({
    isActive: false,
    beforeElements: [],
  })

  // Callback when CollaborativeCanvas is ready
  const handleCollaborationReady = useCallback((sendElementChange: (change: any) => void) => {
    sendElementChangeRef.current = sendElementChange
  }, [])

  // Callback when layout collaboration is ready
  const handleLayoutChangeReady = useCallback((sendLayoutChange: (layout: any) => void) => {
    sendLayoutChangeRef.current = sendLayoutChange
  }, [])

  // Handle layout updates from other collaborators
  const handleLayoutUpdate = useCallback((layout: { headerHeight: number; footerHeight: number; sections: { id: string; height: number }[] }) => {
    // Update local canvas layout state when receiving layout changes from other users
    setCanvasLayout(layout)
  }, [])

  // Handle immediate save when sections are added/removed (not debounced)
  const handleSectionsChange = useCallback(async (sections: { id: string; height: number }[], headerHeight: number, footerHeight: number) => {
    if (!currentProjectId || !canEdit) return

    const newLayout = { headerHeight, footerHeight, sections }

    // Update local state immediately
    setCanvasLayout(newLayout)

    // Broadcast to collaborators via WebSocket immediately
    if (sendLayoutChangeRef.current) {
      sendLayoutChangeRef.current(newLayout)
    }

    // Save to database immediately (no debounce for add/remove operations)
    try {
      const { projectsApi } = await import('@/api/projects.api')
      await projectsApi.update(currentProjectId, {
        name: currentProjectName,
        elements: elements,
        layout: newLayout,
      })
    } catch (error) {
      console.error('Failed to save layout after section change:', error)
    }
  }, [currentProjectId, canEdit, currentProjectName, elements])

  // Detect and broadcast changes between two element states
  const broadcastElementsDiff = useCallback((oldElements: BuilderElement[], newElements: BuilderElement[]) => {
    if (!currentProjectId || !sendElementChangeRef.current) return

    const oldIds = new Set(oldElements.map(el => el.id))
    const newIds = new Set(newElements.map(el => el.id))

    // Elements deleted (were in old, not in new)
    oldElements.forEach(el => {
      if (!newIds.has(el.id)) {
        sendElementChangeRef.current!({
          action: 'delete',
          element: { id: el.id },
        })
      }
    })

    // Elements added (in new, not in old)
    newElements.forEach(el => {
      if (!oldIds.has(el.id)) {
        sendElementChangeRef.current!({
          action: 'add',
          element: el,
        })
      }
    })

    // Elements updated (in both, but different)
    newElements.forEach(newEl => {
      if (oldIds.has(newEl.id)) {
        const oldEl = oldElements.find(el => el.id === newEl.id)
        if (oldEl && JSON.stringify(oldEl) !== JSON.stringify(newEl)) {
          sendElementChangeRef.current!({
            action: 'update',
            element: newEl,
          })
        }
      }
    })
  }, [currentProjectId])

  // Watch for elements changes after undo/redo
  useEffect(() => {
    if (undoRedoRef.current.isActive) {
      broadcastElementsDiff(undoRedoRef.current.beforeElements, elements)
      undoRedoRef.current.isActive = false
      undoRedoRef.current.beforeElements = []
    }
  }, [elements, broadcastElementsDiff])

  // Wrapped undo that broadcasts changes
  const collaborativeUndo = useCallback(() => {
    if (!canEdit || !canUndo) return // Block if viewer

    undoRedoRef.current = {
      isActive: true,
      beforeElements: [...elements],
    }
    undo()
  }, [canEdit, canUndo, elements, undo])

  // Wrapped redo that broadcasts changes
  const collaborativeRedo = useCallback(() => {
    if (!canEdit || !canRedo) return // Block if viewer

    undoRedoRef.current = {
      isActive: true,
      beforeElements: [...elements],
    }
    redo()
  }, [canEdit, canRedo, elements, redo])

  // Wrapped callbacks that broadcast changes (with permission check)
  const collaborativeUpdateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    if (!canEdit) return // Block if viewer

    // Apply locally first
    updateElement(id, updates)

    // Broadcast to others if in a project
    if (currentProjectId && sendElementChangeRef.current) {
      sendElementChangeRef.current({
        action: 'update',
        element: { id, ...updates },
      })
    }
  }, [canEdit, currentProjectId, updateElement])

  const collaborativeUpdateElementPosition = useCallback((id: string, position: { x: number; y: number; width?: number; height?: number }) => {
    if (!canEdit) return // Block if viewer

    // Apply locally first
    updateElementPosition(id, position)

    // Broadcast to others if in a project
    if (currentProjectId && sendElementChangeRef.current) {
      sendElementChangeRef.current({
        action: 'move',
        element: { id, ...position },
      })
    }
  }, [canEdit, currentProjectId, updateElementPosition])

  const collaborativeDeleteElement = useCallback((id: string) => {
    if (!canEdit) return // Block if viewer

    // Apply locally first
    deleteElement(id)

    // Broadcast to others if in a project
    if (currentProjectId && sendElementChangeRef.current) {
      sendElementChangeRef.current({
        action: 'delete',
        element: { id },
      })
    }
  }, [canEdit, currentProjectId, deleteElement])

  // Handle project change from ProjectManager
  const handleProjectChange = async (projectId: string, projectName: string, isPublic?: boolean) => {
    setCurrentProjectId(projectId)
    setCurrentProjectName(projectName)
    setIsProjectPublic(isPublic ?? false)

    // Check user role in this project
    if (user?.id) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/projects/${projectId}/role/${user.id}`)

        if (response.ok) {
          const data = await response.json()
          setUserRole(data.role) // 'OWNER', 'EDITOR', or 'VIEWER'
          setIsProjectOwner(data.role === 'OWNER')
        } else {
          // Default to OWNER if error (for backward compatibility)
          setUserRole('OWNER')
          setIsProjectOwner(true)
        }
      } catch (error) {
        // Default to OWNER if error (for backward compatibility)
        setUserRole('OWNER')
        setIsProjectOwner(true)
      }
    }
  }

  // Wrapper for loadProject that handles multi-page format
  const handleLoadProject = useCallback((loadedPages: BuilderPage[]) => {
    loadProject(loadedPages)

    // Set canvas layout from first page if available
    if (loadedPages.length > 0 && loadedPages[0].layout) {
      setCanvasLayout(loadedPages[0].layout)
    } else {
      setCanvasLayout(null) // Reset to default
    }
  }, [loadProject])

  // Fetch role when project changes (important for refreshing role after owner changes it)
  useEffect(() => {
    if (currentProjectId && user?.id) {
      const fetchRole = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/projects/${currentProjectId}/role/${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setUserRole(data.role)
            setIsProjectOwner(data.role === 'OWNER')
          }
        } catch (error) {
          // Silent error handling
        }
      }
      fetchRole()
    }
  }, [currentProjectId, user?.id])

  // Ref to control component library category expansion
  const toggleCategoryRef = useRef<((categoryName: string) => void) | null>(null)

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

  // Auto-hide right sidebar when preview mode is opened
  const rightSidebarStateRef = useRef(true)

  useEffect(() => {
    if (isPreviewMode) {
      // Save current state and hide right sidebar
      rightSidebarStateRef.current = showRightSidebar
      setShowRightSidebar(false)
    } else {
      // Restore right sidebar state when preview is closed
      if (rightSidebarStateRef.current) {
        setShowRightSidebar(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode])

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

  const handleElementSelect = (elementId: string | string[], multiSelect = false) => {
    if (!elementId || (Array.isArray(elementId) && elementId.length === 0)) {
      setSelectedElements([])
      return
    }

    if (Array.isArray(elementId)) {
      if (multiSelect) {
        // Add unique new elements to existing selection
        setSelectedElements((prev) => {
          const newSet = new Set([...prev, ...elementId])
          return Array.from(newSet)
        })
      } else {
        setSelectedElements(elementId)
      }
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
      // Block all keyboard shortcuts for viewers
      if (!canEdit) return

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault()
              collaborativeRedo()
            } else {
              e.preventDefault()
              collaborativeUndo()
            }
            break
          case 'y':
            e.preventDefault()
            collaborativeRedo()
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
  }, [collaborativeUndo, collaborativeRedo, selectedElements, duplicateElement, handleRotateSelected, canEdit])



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
              onUndo={collaborativeUndo}
              onRedo={collaborativeRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              selectedElements={selectedElements}
              onDuplicateSelected={() => {
                selectedElements.forEach((id) => duplicateElement(id))
              }}
              elements={elements}
              pages={pages}
              layout={canvasLayout}
              onLoadProject={handleLoadProject}
              zoom={zoom}
              onZoomChange={setZoom}
              showGrid={showGrid}
              onGridToggle={setShowGrid}
              showLayers={showLayers}
              onLayersToggle={setShowLayers}
              onRotateSelected={handleRotateSelected}
              showSections={showSections}
              onSectionsToggle={setShowSections}
              showLeftSidebar={showLeftSidebar}
              onLeftSidebarToggle={setShowLeftSidebar}
              showRightSidebar={showRightSidebar}
              onRightSidebarToggle={setShowRightSidebar}
              // Share props
              projectId={currentProjectId}
              projectName={currentProjectName}
              isOwner={isProjectOwner}
              isPublic={isProjectPublic}
              currentUserClerkId={user?.id || ""}
              onProjectChange={handleProjectChange}
              onPublicChange={setIsProjectPublic}
              hasUnsavedChanges={hasUnsavedChanges}
              activeTool={activeTool}
              onToolChange={setActiveTool}
            />

            {/* View Only Banner for Viewers */}
            {userRole === 'VIEWER' && (
              <div className="bg-yellow-500/20 border-b border-yellow-500/50 px-4 py-2 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-medium text-yellow-500">View Only Mode - You cannot edit this project</span>
              </div>
            )}

            {/* Main Layout */}
            <div className="flex-1 overflow-hidden relative">
              {/* Floating Toggle Button - Show when right sidebar is hidden */}
              {!showRightSidebar && (
                <button
                  onClick={() => setShowRightSidebar(true)}
                  className="absolute top-4 right-0 z-40 w-4 h-20 flex items-center justify-center bg-[#27408B] hover:bg-[#1e3270] border border-r-0 border-primary/30 shadow-xl hover:shadow-2xl hover:w-8 text-primary-foreground hover:text-white transition-all duration-300 rounded-l-md"
                  title="Show Properties"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 hover:opacity-100">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              )}

              <ResizablePanelGroup direction="horizontal">
                {/* Left Sidebar with always-visible icon rail */}
                <>
                  <ResizablePanel
                    defaultSize={showLeftSidebar ? 20 : 3.5}
                    minSize={showLeftSidebar ? 15 : 3.5}
                    maxSize={showLeftSidebar ? 35 : 3.5}
                    className={`relative ${showLeftSidebar ? 'min-w-[280px]' : 'min-w-[56px] max-w-[56px]'} transition-all`}
                  >
                    <div className="h-full flex">
                      {/* Icon Rail - Always Visible */}
                      <div className="flex flex-col items-center gap-3 py-4 w-14 bg-sidebar border-r border-sidebar-border relative z-10">
                        {/* Components Icon */}
                        <button
                          onClick={() => {
                            if (activeLeftPanel === 'components' && showLeftSidebar) {
                              setShowLeftSidebar(false)
                            } else {
                              setActiveLeftPanel('components')
                              setShowLeftSidebar(true)
                            }
                          }}
                          className={`group/icon relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${activeLeftPanel === 'components' && showLeftSidebar
                            ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-125 hover:shadow-md'
                            }`}
                          title="Components"
                        >
                          <Layers className="w-5 h-5 transition-transform duration-200 group-hover/icon:scale-110" />
                        </button>

                        {/* Pages Icon */}
                        <button
                          onClick={() => {
                            if (activeLeftPanel === 'pages' && showLeftSidebar) {
                              setShowLeftSidebar(false)
                            } else {
                              setActiveLeftPanel('pages')
                              setShowLeftSidebar(true)
                            }
                          }}
                          className={`group/icon relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${activeLeftPanel === 'pages' && showLeftSidebar
                            ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-125 hover:shadow-md'
                            }`}
                          title="Pages"
                        >
                          <LayoutGrid className="w-5 h-5 transition-transform duration-200 group-hover/icon:scale-110" />
                        </button>

                        {/* Site Style Icon */}
                        <button
                          onClick={() => {
                            if (activeLeftPanel === 'siteStyle' && showLeftSidebar) {
                              setShowLeftSidebar(false)
                            } else {
                              setActiveLeftPanel('siteStyle')
                              setShowLeftSidebar(true)
                            }
                          }}
                          className={`group/icon relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${activeLeftPanel === 'siteStyle' && showLeftSidebar
                            ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-125 hover:shadow-md'
                            }`}
                          title="Site Style"
                        >
                          <Palette className="w-5 h-5 transition-transform duration-200 group-hover/icon:scale-110" />
                        </button>
                      </div>

                      {/* Content Area - Slides in/out */}
                      <div
                        className={`flex-1 h-full bg-sidebar overflow-hidden transition-all duration-300 ${showLeftSidebar ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute pointer-events-none'
                          }`}
                      >
                        <div className="h-full flex flex-col">
                          {/* Header with Close Button */}
                          {showLeftSidebar && (
                            <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border bg-sidebar">
                              <h3 className="text-sm font-semibold text-sidebar-foreground">
                                {activeLeftPanel === 'pages' && 'Pages'}
                                {activeLeftPanel === 'components' && 'Components'}
                                {activeLeftPanel === 'siteStyle' && 'Site Style'}
                              </h3>
                              <button
                                onClick={() => setShowLeftSidebar(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-200 hover:scale-110 hover:shadow-md"
                                title="Close Panel"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}

                          {/* Panel Content */}
                          <div className="flex-1 overflow-hidden">
                            {activeLeftPanel === 'pages' && (
                              <PageManager
                                pages={pages}
                                activePageId={activePageId}
                                onPageSelect={switchPage}
                                onPageCreate={addPage}
                                onPageDelete={deletePage}
                                onPageDuplicate={duplicatePage}
                                onPageRename={renamePage}
                                onPageUpdateMetadata={updatePageMetadata}
                                canEdit={canEdit}
                              />
                            )}
                            {activeLeftPanel === 'components' && (
                              <ComponentLibrary
                                onAddTemplate={handleAddTemplate}
                                onToggleCategoryRef={toggleCategoryRef}
                              />
                            )}
                            {activeLeftPanel === 'siteStyle' && (
                              <div className="h-full">
                                {/* Direct import; small placeholder component */}
                                {React.createElement((require('@/components/builder/site-style-panel') as any).SiteStylePanel, { canEdit })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle className="bg-sidebar-border" />
                </>

                {/* Center Canvas */}
                <ResizablePanel defaultSize={60} minSize={30}>
                  <div className="h-full bg-canvas canvas-grid overflow-hidden relative">
                    {/* Enhanced glow effect background - adapts to theme */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Radial gradient overlay for spotlight effect */}
                      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/5 dark:to-white/5"></div>
                    </div>

                    <div className="h-full flex items-start justify-center p-8 relative z-10">
                      <div
                        className={`${breakpointWidths[currentBreakpoint]} transition-all duration-300 bg-card border border-border rounded-lg min-h-[600px] h-full max-h-full overflow-auto custom-scrollbar relative
                          shadow-[0_0_80px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_0_80px_-12px_rgba(255,255,255,0.15)]
                          ring-1 ring-black/5 dark:ring-white/10
                          before:absolute before:inset-0 before:rounded-lg before:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] dark:before:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] before:pointer-events-none
                        `}
                        style={{
                          transform: 'translateY(-2px)',
                        }}
                      >
                        <CollaborativeCanvas
                          activeTool={activeTool}
                          projectId={currentProjectId || null}
                          pageId={activePageId}
                          canEdit={canEdit}
                          elements={elements}
                          selectedElements={selectedElements}
                          currentBreakpoint={currentBreakpoint}
                          onElementSelect={handleElementSelect}
                          onAddElement={addElement}
                          onUpdateElement={updateElement}
                          onUpdateElementPosition={updateElementPosition}
                          onDeleteElement={deleteElement}
                          onDuplicateElement={duplicateElement}
                          onCollaborationReady={handleCollaborationReady}
                          onLayoutChangeReady={handleLayoutChangeReady}
                          onLayoutUpdate={handleLayoutUpdate}
                          onRoleChanged={(newRole: string) => {
                            setUserRole(newRole as 'OWNER' | 'EDITOR' | 'VIEWER')
                            setIsProjectOwner(newRole === 'OWNER')

                            // Show toast notification
                            if (newRole === 'VIEWER') {
                              alert('⚠️ Your role has been changed to VIEWER. You can no longer edit this project.')
                            } else if (newRole === 'EDITOR') {
                              alert('✅ Your role has been changed to EDITOR. You can now edit this project.')
                            }
                          }}
                          snapToGrid={snapToGrid}
                          snapSettings={snapSettings}
                          zoom={zoom}
                          showGrid={showGrid}
                          showSections={showSections}
                          isPreviewMode={isPreviewMode}
                          toggleCategoryRef={toggleCategoryRef}
                          onRegionsChange={setRegionsLayout}
                          onLayoutChange={setCanvasLayout}
                          onSectionsChange={handleSectionsChange}
                          initialLayout={canvasLayout}
                          onShowLeftSidebar={() => setShowLeftSidebar(true)}
                          onSetActiveLeftPanel={(panel) => setActiveLeftPanel(panel)}
                        />
                      </div>
                    </div>
                  </div>
                </ResizablePanel>

                {showRightSidebar && (
                  <>
                    <ResizableHandle withHandle className="bg-sidebar-border" />

                    {/* Right Sidebar - resizable */}
                    <ResizablePanel defaultSize={20} minSize={12} maxSize={35} className="min-w-[240px] relative group -ml-2 z-[60]">
                      {/* Collapse Button - Outside Edge */}
                      <button
                        onClick={() => setShowRightSidebar(false)}
                        className="absolute top-4 -left-1 z-[65] w-4 h-20 flex items-center justify-center bg-[#27408B] hover:bg-[#1e3270] border border-primary/30 shadow-lg hover:shadow-xl text-primary-foreground hover:text-white transition-all duration-300 hover:w-8 rounded-md"
                        title="Hide Properties"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 hover:opacity-100">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                      <div className="h-full bg-sidebar border-l border-sidebar-border pl-7">

                        <PropertiesPanel
                          selectedElements={selectedElements}
                          elements={elements}
                          currentBreakpoint={currentBreakpoint}
                          onUpdateElement={collaborativeUpdateElement}
                          onUpdateElementResponsiveStyle={updateElementResponsiveStyle}
                          onUpdateElementPosition={collaborativeUpdateElementPosition}
                          isPreviewMode={isPreviewMode}
                          onPreviewModeToggle={setIsPreviewMode}
                        />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>

            {/* Layers Panel */}
            <LayersPanel
              elements={elements}
              selectedElements={selectedElements}
              onElementSelect={handleElementSelect}
              onUpdateElement={collaborativeUpdateElement}
              onDeleteElement={collaborativeDeleteElement}
              onDuplicateElement={duplicateElement}
              isOpen={showLayers}
              onClose={() => setShowLayers(false)}
              regions={regionsLayout || undefined}
            />
          </div>
          <DragLayer />
        </DndProvider>
      </SignedIn>
    </>
  )
}
