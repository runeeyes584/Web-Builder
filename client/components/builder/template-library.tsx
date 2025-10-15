"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { BuilderElement } from "@/lib/builder-types"
import { templates, type Template } from "@/lib/templates"
import { Bookmark, Clock, Code, Eye, Heart, Layout, Plus, Search, Share, Sparkles, Star, Users, Zap } from "lucide-react"
import { useState } from "react"

interface TemplateLibraryProps {
  onAddTemplate: (elements: BuilderElement[]) => void
}

export function TemplateLibrary({ onAddTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const categories = [
    { id: "all", label: "All Templates", icon: Layout, count: templates.length },
    { id: "hero", label: "Hero Sections", icon: Star, count: templates.filter(t => t.category === "hero").length },
    { id: "about", label: "About", icon: Users, count: templates.filter(t => t.category === "about").length },
    { id: "services", label: "Services", icon: Zap, count: templates.filter(t => t.category === "services").length },
    { id: "contact", label: "Contact", icon: Clock, count: templates.filter(t => t.category === "contact").length },
    { id: "footer", label: "Footer", icon: Layout, count: templates.filter(t => t.category === "footer").length },
    { id: "full-page", label: "Full Pages", icon: Code, count: templates.filter(t => t.category === "full-page").length },
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
        <Button className="w-full bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-primary/20" variant="outline">
          <Sparkles className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl h-[85vh] bg-gradient-to-br from-background to-background/95">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Template Library</DialogTitle>
              <p className="text-sm text-muted-foreground">Choose from professional templates</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Enhanced Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-muted-foreground/20 focus:border-primary/50"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredTemplates.length} templates</span>
            </div>
          </div>

          {/* Enhanced Category Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category.id 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "hover:bg-muted/50"
                }`}
              >
                <category.icon className="w-3 h-3 mr-2" />
                {category.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Enhanced Templates Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
              {filteredTemplates.map((template, index) => (
                <Card 
                  key={template.id} 
                  className="group p-0 hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden bg-card/50 backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-t-lg overflow-hidden relative">
                    <img
                      src={template.thumbnail || "/placeholder.svg"}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
                          <Heart className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
                          <Bookmark className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors duration-200 truncate">
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.popular && (
                            <Badge variant="default" className="text-xs bg-gradient-to-r from-orange-500 to-red-500">
                              <Star className="w-2 h-2 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent hover:bg-muted/50 transition-colors duration-200"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl h-[85vh] bg-gradient-to-br from-background to-background/95">
                          <DialogHeader>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                                <Eye className="w-4 h-4 text-primary-foreground" />
                              </div>
                              <div>
                                <DialogTitle className="text-lg font-bold">{template.name} Preview</DialogTitle>
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                              </div>
                            </div>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="bg-card border rounded-lg p-6 shadow-lg">
                              {template.elements.map(renderElementPreview)}
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" size="sm">
                              <Share className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                            <Button onClick={() => handleAddTemplate(template)} className="bg-gradient-to-r from-primary to-primary/80">
                              <Plus className="w-4 h-4 mr-2" />
                              Add to Project
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200" 
                        onClick={() => handleAddTemplate(template)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria or browse all templates.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
