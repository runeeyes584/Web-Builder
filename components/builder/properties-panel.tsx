"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Type,
  Palette,
  Layout,
  FolderIcon as BorderIcon,
  Shapes as Shadow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react"
import type { BuilderElement, Breakpoint } from "@/lib/builder-types"

interface PropertiesPanelProps {
  selectedElements: string[]
  elements: BuilderElement[]
  currentBreakpoint: Breakpoint
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void
  onUpdateElementResponsiveStyle: (id: string, breakpoint: Breakpoint, styles: Record<string, any>) => void
}

export function PropertiesPanel({
  selectedElements,
  elements,
  currentBreakpoint,
  onUpdateElement,
  onUpdateElementResponsiveStyle,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"content" | "style" | "layout" | "effects">("content")
  const [responsiveMode, setResponsiveMode] = useState(false)

  const selectedElement = selectedElements.length === 1 ? elements.find((el) => el.id === selectedElements[0]) : null
  const multipleSelected = selectedElements.length > 1

  const getCurrentStyles = () => {
    if (!selectedElement) return {}
    if (responsiveMode && selectedElement.responsiveStyles?.[currentBreakpoint]) {
      return { ...selectedElement.styles, ...selectedElement.responsiveStyles[currentBreakpoint] }
    }
    return selectedElement.styles || {}
  }

  const currentStyles = getCurrentStyles()

  const [colorInputs, setColorInputs] = useState({
    textColor: currentStyles?.color || "#ffffff",
    backgroundColor: currentStyles?.backgroundColor || "transparent",
    borderColor: currentStyles?.borderColor || "#000000",
  })

  useEffect(() => {
    const styles = getCurrentStyles()
    setColorInputs({
      textColor: styles?.color || "#ffffff",
      backgroundColor: styles?.backgroundColor || "transparent",
      borderColor: styles?.borderColor || "#000000",
    })
  }, [selectedElement, currentBreakpoint, responsiveMode])

  const updateElementStyle = (property: string, value: any) => {
    if (!selectedElement) return

    if (responsiveMode) {
      onUpdateElementResponsiveStyle(selectedElement.id, currentBreakpoint, { [property]: value })
    } else {
      onUpdateElement(selectedElement.id, {
        styles: {
          ...selectedElement.styles,
          [property]: value,
        },
      })
    }
  }

  const updateElementContent = (content: string) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { content })
    }
  }

  const updateElementProps = (props: Record<string, any>) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, {
        props: {
          ...selectedElement.props,
          ...props,
        },
      })
    }
  }

  const getBreakpointIcon = (breakpoint: Breakpoint) => {
    switch (breakpoint) {
      case "desktop":
        return Monitor
      case "tablet":
        return Tablet
      case "mobile":
        return Smartphone
    }
  }

  if (selectedElements.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="font-semibold text-sidebar-foreground">Properties</h2>
          <p className="text-sm text-muted-foreground mt-1">Select an element to edit</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No element selected</p>
          </div>
        </div>
      </div>
    )
  }

  if (multipleSelected) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="font-semibold text-sidebar-foreground">Properties</h2>
          <p className="text-sm text-muted-foreground mt-1">{selectedElements.length} elements selected</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Multi-element editing coming soon...</p>
        </div>
      </div>
    )
  }

  if (!selectedElement) return null

  const BreakpointIcon = getBreakpointIcon(currentBreakpoint)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sidebar-foreground">Properties</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <BreakpointIcon className="w-3 h-3 mr-1" />
              {currentBreakpoint}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground capitalize">{selectedElement.type} element</p>

        {/* Responsive Mode Toggle */}
        <div className="flex items-center justify-between mt-3 p-2 bg-sidebar-accent rounded-md">
          <Label className="text-xs font-medium">Responsive Editing</Label>
          <Switch checked={responsiveMode} onCheckedChange={setResponsiveMode} />
        </div>

        {responsiveMode && (
          <p className="text-xs text-muted-foreground mt-2">
            Changes will only apply to {currentBreakpoint} breakpoint
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-sidebar-border">
        {[
          { id: "content", label: "Content", icon: Type },
          { id: "style", label: "Style", icon: Palette },
          { id: "layout", label: "Layout", icon: Layout },
          { id: "effects", label: "Effects", icon: Shadow },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 p-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-sidebar-foreground"
            }`}
          >
            <tab.icon className="w-3 h-3 mx-auto mb-1" />
            {tab.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Content Tab */}
          {activeTab === "content" && (
            <>
              <div>
                <Label className="text-sm font-medium mb-3 block">Content</Label>
                {selectedElement.type === "image" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Image URL</Label>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Alt Text</Label>
                      <Input
                        placeholder="Image description"
                        value={selectedElement.props?.alt || ""}
                        onChange={(e) => updateElementProps({ alt: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "button" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="Click me"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Link URL</Label>
                      <Input
                        placeholder="https://example.com"
                        value={selectedElement.props?.href || ""}
                        onChange={(e) => updateElementProps({ href: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.openInNewTab || false}
                        onCheckedChange={(checked) => updateElementProps({ openInNewTab: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Open in new tab</Label>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    placeholder="Enter content..."
                    value={selectedElement.content}
                    onChange={(e) => updateElementContent(e.target.value)}
                    className="bg-sidebar-accent border-sidebar-border min-h-[100px]"
                  />
                )}
              </div>
            </>
          )}

          {/* Style Tab */}
          {activeTab === "style" && (
            <>
              {/* Typography */}
              {["heading", "paragraph", "button"].includes(selectedElement.type) && (
                <>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Typography
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                        <Slider
                          value={[Number.parseInt(currentStyles?.fontSize) || 16]}
                          onValueChange={([value]) => updateElementStyle("fontSize", `${value}px`)}
                          max={72}
                          min={8}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Number.parseInt(currentStyles?.fontSize) || 16}px
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Weight</Label>
                        <Select
                          value={currentStyles?.fontWeight || "400"}
                          onValueChange={(value) => updateElementStyle("fontWeight", value)}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="300">Light (300)</SelectItem>
                            <SelectItem value="400">Normal (400)</SelectItem>
                            <SelectItem value="500">Medium (500)</SelectItem>
                            <SelectItem value="600">Semibold (600)</SelectItem>
                            <SelectItem value="700">Bold (700)</SelectItem>
                            <SelectItem value="800">Extra Bold (800)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Text Alignment</Label>
                        <div className="flex gap-1 mt-1">
                          {[
                            { value: "left", icon: AlignLeft },
                            { value: "center", icon: AlignCenter },
                            { value: "right", icon: AlignRight },
                            { value: "justify", icon: AlignJustify },
                          ].map((align) => (
                            <Button
                              key={align.value}
                              variant={currentStyles?.textAlign === align.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateElementStyle("textAlign", align.value)}
                              className="flex-1"
                            >
                              <align.icon className="w-4 h-4" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-sidebar-border" />
                </>
              )}

              {/* Colors */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4" />
                  Colors
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="#ffffff"
                        value={colorInputs.textColor}
                        onChange={(e) => {
                          setColorInputs((prev) => ({ ...prev, textColor: e.target.value }))
                          updateElementStyle("color", e.target.value)
                        }}
                        className="bg-sidebar-accent border-sidebar-border"
                      />
                      <input
                        type="color"
                        value={colorInputs.textColor}
                        onChange={(e) => {
                          setColorInputs((prev) => ({ ...prev, textColor: e.target.value }))
                          updateElementStyle("color", e.target.value)
                        }}
                        className="w-10 h-10 rounded border border-sidebar-border cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Background Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="transparent"
                        value={colorInputs.backgroundColor}
                        onChange={(e) => {
                          setColorInputs((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          updateElementStyle("backgroundColor", e.target.value)
                        }}
                        className="bg-sidebar-accent border-sidebar-border"
                      />
                      <input
                        type="color"
                        value={colorInputs.backgroundColor === "transparent" ? "#000000" : colorInputs.backgroundColor}
                        onChange={(e) => {
                          setColorInputs((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          updateElementStyle("backgroundColor", e.target.value)
                        }}
                        className="w-10 h-10 rounded border border-sidebar-border cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Layout Tab */}
          {activeTab === "layout" && (
            <>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Layout className="w-4 h-4" />
                  Spacing
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Margin</Label>
                    <Input
                      placeholder="0px"
                      value={currentStyles?.margin || ""}
                      onChange={(e) => updateElementStyle("margin", e.target.value)}
                      className="bg-sidebar-accent border-sidebar-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Padding</Label>
                    <Input
                      placeholder="0px"
                      value={currentStyles?.padding || ""}
                      onChange={(e) => updateElementStyle("padding", e.target.value)}
                      className="bg-sidebar-accent border-sidebar-border mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-sidebar-border" />

              <div>
                <Label className="text-sm font-medium mb-3 block">Dimensions</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <Input
                      placeholder="auto"
                      value={currentStyles?.width || ""}
                      onChange={(e) => updateElementStyle("width", e.target.value)}
                      className="bg-sidebar-accent border-sidebar-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Height</Label>
                    <Input
                      placeholder="auto"
                      value={currentStyles?.height || ""}
                      onChange={(e) => updateElementStyle("height", e.target.value)}
                      className="bg-sidebar-accent border-sidebar-border mt-1"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Effects Tab */}
          {activeTab === "effects" && (
            <>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <BorderIcon className="w-4 h-4" />
                  Border
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Border Radius (px)</Label>
                    <Slider
                      value={[Number.parseInt(currentStyles?.borderRadius) || 0]}
                      onValueChange={([value]) => updateElementStyle("borderRadius", `${value}px`)}
                      max={50}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {Number.parseInt(currentStyles?.borderRadius) || 0}px
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-sidebar-border" />

              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Shadow className="w-4 h-4" />
                  Shadow
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Box Shadow</Label>
                    <Input
                      placeholder="0 4px 6px rgba(0, 0, 0, 0.1)"
                      value={currentStyles?.boxShadow || ""}
                      onChange={(e) => updateElementStyle("boxShadow", e.target.value)}
                      className="bg-sidebar-accent border-sidebar-border mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateElementStyle("boxShadow", "0 1px 3px rgba(0, 0, 0, 0.1)")}
                      className="flex-1"
                    >
                      Small
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateElementStyle("boxShadow", "0 4px 6px rgba(0, 0, 0, 0.1)")}
                      className="flex-1"
                    >
                      Medium
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateElementStyle("boxShadow", "0 10px 15px rgba(0, 0, 0, 0.1)")}
                      className="flex-1"
                    >
                      Large
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
