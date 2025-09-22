"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TemplateLibrary } from "./template-library"
import { Type, AlignLeft, ImageIcon, Square, Layout, Grid3X3, Navigation, FileText } from "lucide-react"
import type { DragData, BuilderElement } from "@/lib/builder-types"

const componentCategories = [
  {
    name: "Basic Elements",
    components: [
      { name: "Heading", icon: Type, description: "H1, H2, H3 headings", type: "heading" },
      { name: "Paragraph", icon: AlignLeft, description: "Text content", type: "paragraph" },
      { name: "Image", icon: ImageIcon, description: "Images and media", type: "image" },
      { name: "Button", icon: Square, description: "Interactive buttons", type: "button" },
    ],
  },
  {
    name: "Layout",
    components: [
      { name: "Section", icon: Layout, description: "Content sections", type: "section" },
      { name: "Grid", icon: Grid3X3, description: "Grid layouts", type: "grid" },
      { name: "Navigation", icon: Navigation, description: "Nav menus", type: "navigation" },
      { name: "Footer", icon: FileText, description: "Page footers", type: "footer" },
    ],
  },
  {
    name: "Forms",
    components: [{ name: "Form", icon: FileText, description: "Contact forms", type: "form" }],
  },
]

interface ComponentLibraryProps {
  onAddTemplate?: (elements: BuilderElement[]) => void
}

export function ComponentLibrary({ onAddTemplate }: ComponentLibraryProps) {
  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    const dragData: DragData = {
      type: "component",
      componentType,
    }
    e.dataTransfer.setData("application/json", JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground">Components</h2>
        <p className="text-sm text-muted-foreground mt-1">Drag to add elements</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {componentCategories.map((category) => (
            <div key={category.name}>
              <h3 className="text-sm font-medium text-sidebar-foreground mb-3">{category.name}</h3>
              <div className="space-y-2">
                {category.components.map((component) => (
                  <Card
                    key={component.name}
                    className="p-3 cursor-grab hover:bg-sidebar-accent transition-colors border-sidebar-border bg-sidebar active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, component.type)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center">
                        <component.icon className="w-4 h-4 text-sidebar-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground">{component.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{component.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <TemplateLibrary onAddTemplate={onAddTemplate || (() => {})} />
      </div>
    </div>
  )
}
