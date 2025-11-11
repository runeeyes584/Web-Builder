"use client"

import { Card } from "@/components/ui/card"
import type { BuilderElement } from "@/lib/builder-types"
import { componentCategories } from "@/lib/component-categories"
import { ChevronDown, Move, Search, Sparkles } from "lucide-react"
import React, { useCallback, useMemo, useState } from "react"
import { useDrag } from "react-dnd"
import { getEmptyImage } from "react-dnd-html5-backend"
import { TemplateLibrary } from "./template-library"

interface ComponentLibraryProps {
  onAddTemplate?: (elements: BuilderElement[]) => void
  onToggleCategoryRef?: React.MutableRefObject<((categoryName: string) => void) | null>
}

export const ComponentLibrary = React.memo(function ComponentLibrary({ onAddTemplate, onToggleCategoryRef }: ComponentLibraryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Memoize filtered categories để tránh tính toán lại mỗi lần render
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return componentCategories

    const query = searchQuery.toLowerCase()
    return componentCategories
      .map((category) => ({
        ...category,
        components: category.components.filter(
          (comp) =>
            comp.name.toLowerCase().includes(query) ||
            comp.description.toLowerCase().includes(query) ||
            comp.type.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.components.length > 0)
  }, [searchQuery])

  const DraggableCard: React.FC<{ component: { name: string; description: string; icon: any; type: string } }> = React.memo(({ component }) => {
    const [{ isDragging }, dragRef, preview] = useDrag(() => ({
      type: "COMPONENT",
      item: { componentType: component.type, name: component.name },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      options: {
        dropEffect: 'copy'
      },
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult()
        console.log('Drag ended:', { item, dropResult, didDrop: monitor.didDrop() })
      },
    }), [component.type, component.name])

    // Set the preview image with optimized options
    React.useEffect(() => {
      preview(getEmptyImage(), { 
        captureDraggingState: true,
        anchorX: 0.5,
        anchorY: 0.5
      })
    }, [preview])

    return (
      <Card
        ref={dragRef as unknown as React.Ref<HTMLDivElement>}
        className={`group relative p-3 cursor-grab transition-all duration-200 border-sidebar-border/30 bg-gradient-to-r from-sidebar-accent/30 to-sidebar-accent/15 backdrop-blur-sm active:cursor-grabbing ${
          isDragging 
            ? "opacity-30 scale-95 shadow-xl border-primary/50 bg-gradient-to-r from-primary/20 to-primary/10" 
            : "hover:bg-gradient-to-r hover:from-sidebar-accent/80 hover:to-sidebar-accent/50 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40 hover:ring-1 hover:ring-primary/20"
        }`}
        style={{
          willChange: isDragging ? 'transform, opacity' : 'auto',
          transform: isDragging ? 'translateZ(0)' : 'none'
        }}
      >
        <div className="relative flex items-center gap-3">
          <div className={`w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${
            isDragging
              ? "from-primary/40 via-primary/30 to-primary/20 scale-110 rotate-12"
              : "from-primary/20 via-primary/15 to-primary/10 group-hover:from-primary/30 group-hover:via-primary/25 group-hover:to-primary/20 group-hover:scale-110 group-hover:rotate-3"
          }`}>
            <component.icon className={`w-4 h-4 text-primary transition-transform duration-300 ${
              isDragging ? "scale-125" : "group-hover:scale-110"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold transition-colors duration-300 mb-1 ${
              isDragging 
                ? "text-primary font-bold" 
                : "text-sidebar-foreground group-hover:text-primary"
            }`}>
              {component.name}
            </p>
            <p className={`text-xs line-clamp-1 leading-relaxed transition-colors duration-300 ${
              isDragging 
                ? "text-primary/70" 
                : "text-muted-foreground group-hover:text-muted-foreground/80"
            }`}>
              {component.description}
            </p>
          </div>
          <div className={`transition-all duration-300 ${
            isDragging 
              ? "opacity-100 scale-125 rotate-12" 
              : "opacity-0 group-hover:opacity-100 group-hover:scale-110"
          }`}>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
              isDragging 
                ? "bg-primary/30 shadow-lg" 
                : "bg-primary/10"
            }`}>
              <Move className={`w-3 h-3 text-primary ${isDragging ? "animate-pulse" : ""}`} />
            </div>
          </div>
        </div>
        
        {/* Animated border when dragging */}
        {isDragging && (
          <div className="absolute inset-0 rounded-lg border-2 border-dashed border-primary/60 animate-pulse pointer-events-none"></div>
        )}
      </Card>
    )
  })

  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(categoryName)) {
        newExpanded.delete(categoryName)
      } else {
        newExpanded.add(categoryName)
      }
      return newExpanded
    })
  }, [])

  // Expose toggleCategory via ref
  React.useEffect(() => {
    if (onToggleCategoryRef) {
      onToggleCategoryRef.current = toggleCategory
    }
  }, [onToggleCategoryRef, expandedCategories])

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-sidebar via-sidebar/95 to-sidebar/90 backdrop-blur-xl relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
      </div>

      {/* Compact Header */}
      <div className="relative p-4 border-b border-sidebar-border/20 bg-gradient-to-r from-sidebar-accent/30 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-lg flex items-center justify-center shadow-lg ring-1 ring-primary/20">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg text-sidebar-foreground">
              Components
            </h2>
            <p className="text-xs text-muted-foreground">Drag to build</p>
          </div>
        </div>
        
        {/* Compact Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-sidebar-accent/50 border border-sidebar-border/30 rounded-lg text-xs text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 focus:bg-sidebar-accent/70 transition-all duration-200"
          />
        </div>
      </div>

      {/* Compact Categories */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="p-3 space-y-2">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No components found</p>
              <p className="text-xs text-muted-foreground">Try a different search term</p>
            </div>
          ) : (
            filteredCategories.map((category, categoryIndex) => {
            const isExpanded = expandedCategories.has(category.name)
            return (
              <div key={category.name} className="animate-in slide-in-from-left duration-300" style={{ animationDelay: `${categoryIndex * 50}ms` }}>
                {/* Compact Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className={`relative flex items-center justify-between w-full p-3 rounded-lg transition-all duration-300 group ${
                    isExpanded 
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-lg backdrop-blur-sm" 
                      : "hover:bg-gradient-to-r hover:from-sidebar-accent/50 hover:to-sidebar-accent/30 border border-transparent hover:border-sidebar-border/30 hover:shadow-md backdrop-blur-sm"
                  }`}
                >
                  <div className="relative flex items-center gap-3">
                    <div className={`w-2 h-6 rounded-full transition-all duration-300 ${
                      isExpanded 
                        ? "bg-gradient-to-b from-primary to-primary/80 shadow-sm" 
                        : "bg-gradient-to-b from-muted-foreground/50 to-muted-foreground/30 group-hover:from-primary/60 group-hover:to-primary/40"
                    }`}></div>
                    <div className="text-left">
                      <h3 className={`text-sm font-semibold transition-colors duration-300 ${
                        isExpanded 
                          ? "text-primary" 
                          : "text-sidebar-foreground group-hover:text-primary"
                      }`}>
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {category.components.length} components
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium transition-all duration-300 ${
                      isExpanded 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted/60 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary"
                    }`}>
                      {category.components.length}
                    </span>
                    <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground" />
                    </div>
                  </div>
                </button>

                {/* Compact Components Grid */}
                {isExpanded && (
                  <div className="mt-2 ml-5 animate-in slide-in-from-top duration-300 space-y-1.5">
                    <div className="grid grid-cols-1 gap-1.5">
                      {category.components.map((component, componentIndex) => (
                        <div key={component.name} style={{ animationDelay: `${(categoryIndex * 50) + (componentIndex * 30)}ms` }}>
                          <DraggableCard component={component as any} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
          )}
        </div>
      </div>

      {/* Compact Footer */}
      <div className="relative p-3 border-t border-sidebar-border/20 bg-gradient-to-r from-sidebar-accent/30 to-transparent backdrop-blur-sm">
        <div className="relative">
          <TemplateLibrary onAddTemplate={onAddTemplate || (() => {})} />
        </div>
      </div>
    </div>
  )
})
