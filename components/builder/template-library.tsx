"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, Eye } from "lucide-react"
import { templates, type Template } from "@/lib/templates"
import type { BuilderElement } from "@/lib/builder-types"

interface TemplateLibraryProps {
  onAddTemplate: (elements: BuilderElement[]) => void
}

export function TemplateLibrary({ onAddTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "hero", label: "Hero Sections" },
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "contact", label: "Contact" },
    { id: "footer", label: "Footer" },
    { id: "full-page", label: "Full Pages" },
  ]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddTemplate = (template: Template) => {
    // Generate new IDs for all elements to avoid conflicts
    const generateNewIds = (elements: BuilderElement[]): BuilderElement[] => {
      return elements.map((element) => ({
        ...element,
        id: `${element.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        children: element.children ? generateNewIds(element.children) : undefined,
      }))
    }

    const elementsWithNewIds = generateNewIds(template.elements)
    onAddTemplate(elementsWithNewIds)
  }

  const renderElementPreview = (element: BuilderElement): React.ReactNode => {
    const styles = { ...element.styles, ...element.responsiveStyles?.desktop }

    switch (element.type) {
      case "heading":
        return (
          <h1 key={element.id} style={styles} className="text-card-foreground">
            {element.content}
          </h1>
        )
      case "paragraph":
        return (
          <p key={element.id} style={styles} className="text-card-foreground">
            {element.content}
          </p>
        )
      case "image":
        return (
          <img
            key={element.id}
            src={element.content || "/placeholder.svg"}
            alt={element.props?.alt || "Preview"}
            style={styles}
            className="max-w-full h-auto"
          />
        )
      case "button":
        return (
          <button key={element.id} style={styles} className="text-card-foreground">
            {element.content}
          </button>
        )
      case "section":
      case "grid":
      case "footer":
        return (
          <div key={element.id} style={styles}>
            {element.children?.map(renderElementPreview)}
          </div>
        )
      case "navigation":
        return (
          <nav key={element.id} style={styles} className="text-card-foreground">
            {element.content}
          </nav>
        )
      case "form":
        return (
          <div key={element.id} style={styles} className="text-card-foreground">
            {element.content}
          </div>
        )
      default:
        return (
          <div key={element.id} style={styles} className="text-card-foreground">
            {element.content}
          </div>
        )
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-transparent" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Template Library</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search and Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                    <img
                      src={template.thumbnail || "/placeholder.svg"}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>

                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{template.name} Preview</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="flex-1">
                            <div className="bg-card border rounded-lg p-4">
                              {template.elements.map(renderElementPreview)}
                            </div>
                          </ScrollArea>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button onClick={() => handleAddTemplate(template)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add to Project
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" className="flex-1" onClick={() => handleAddTemplate(template)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No templates found matching your criteria.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
