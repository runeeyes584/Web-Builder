"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Breakpoint, BuilderElement } from "@/lib/builder-types"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  FolderIcon as BorderIcon,
  Code,
  Layout,
  Monitor,
  Palette,
  Plus,
  Settings,
  Shapes as Shadow,
  Smartphone,
  Tablet,
  Trash2,
  Type,
  Zap
} from "lucide-react"
import { useEffect, useState } from "react"

interface PropertiesPanelProps {
  selectedElements: string[]
  elements: BuilderElement[]
  currentBreakpoint: Breakpoint
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void
  onUpdateElementResponsiveStyle: (id: string, breakpoint: Breakpoint, styles: Record<string, any>) => void
  onUpdateElementPosition: (id: string, position: { x: number; y: number; width?: number; height?: number }) => void
}

export function PropertiesPanel({
  selectedElements,
  elements,
  currentBreakpoint,
  onUpdateElement,
  onUpdateElementResponsiveStyle,
  onUpdateElementPosition,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"content" | "style" | "layout" | "effects" | "animations" | "advanced">("content")
  const [responsiveMode, setResponsiveMode] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
      // When not in responsive mode, update both base styles and responsive styles for current breakpoint
      onUpdateElement(selectedElement.id, {
        styles: {
          ...selectedElement.styles,
          [property]: value,
        },
      })
      // Also update responsive styles for current breakpoint to prevent override
      onUpdateElementResponsiveStyle(selectedElement.id, currentBreakpoint, { [property]: value })
    }
  }

  const updateElementContent = (content: string) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { content })
    }
  }

  const updateElementProps = (props: Record<string, any>) => {
    if (selectedElement) {
      const updates: Partial<BuilderElement> = {
        props: {
          ...(selectedElement.props || {}),
          ...props,
        },
      }

      // Auto-update separator dimensions based on thickness or orientation
      if (selectedElement.type === "separator" && (props.thickness || props.orientation)) {
        const thickness = parseInt(props.thickness || selectedElement.props?.thickness) || 2
        const orientation = props.orientation || selectedElement.props?.orientation || "horizontal"
        
        if (orientation === "horizontal") {
          updates.position = {
            x: selectedElement.position?.x || 0,
            y: selectedElement.position?.y || 0,
            width: selectedElement.position?.width,
            height: thickness,
          }
        } else {
          updates.position = {
            x: selectedElement.position?.x || 0,
            y: selectedElement.position?.y || 0,
            width: thickness,
            height: selectedElement.position?.height,
          }
        }
      }

      onUpdateElement(selectedElement.id, updates)
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

  const renderFormElementsStyling = () => (
    <>
      <Separator className="bg-sidebar-border" />
      <div>
        <Label className="text-sm font-medium mb-3 block">Form Elements Styling</Label>
        
        {/* Form Title */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Form Title</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.titleFontSize) || 14]}
                  onValueChange={([value]) => updateElementProps({ titleFontSize: `${value}px` })}
                  max={32}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.titleFontSize) || 14}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Alignment</Label>
                <Select
                  value={selectedElement?.props?.titleAlign || "left"}
                  onValueChange={(value) => updateElementProps({ titleAlign: value })}
                >
                  <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.titleColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ titleColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Input Fields */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Input Fields</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.inputFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ inputFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.inputFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.inputPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ inputPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.inputPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.inputBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ inputBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.inputBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.inputBorderColor || "#374151"}
                  onChange={(e) => updateElementProps({ inputBorderColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.inputBackgroundColor || "#1f2937"}
                  onChange={(e) => updateElementProps({ inputBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
          
          {/* Button */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Submit Button</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ buttonFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ buttonPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ buttonBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.buttonBackgroundColor || "#3b82f6"}
                  onChange={(e) => updateElementProps({ buttonBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.buttonTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ buttonTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const renderSurveyFormStyling = () => (
    <>
      <Separator className="bg-sidebar-border" />
      <div>
        <Label className="text-sm font-medium mb-3 block">Survey Form Styling</Label>
        
        {/* Form Title */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Form Title</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.titleFontSize) || 14]}
                  onValueChange={([value]) => updateElementProps({ titleFontSize: `${value}px` })}
                  max={32}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.titleFontSize) || 14}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Alignment</Label>
                <Select
                  value={selectedElement?.props?.titleAlign || "left"}
                  onValueChange={(value) => updateElementProps({ titleAlign: value })}
                >
                  <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.titleColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ titleColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Question */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Question</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.questionFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ questionFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.questionFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.questionColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ questionColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Rating Buttons */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Rating Buttons</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Button Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.ratingButtonSize) || 24]}
                  onValueChange={([value]) => updateElementProps({ ratingButtonSize: `${value}px` })}
                  max={40}
                  min={16}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.ratingButtonSize) || 24}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.ratingButtonFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ ratingButtonFontSize: `${value}px` })}
                  max={20}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.ratingButtonFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.ratingButtonBorderColor || "#374151"}
                  onChange={(e) => updateElementProps({ ratingButtonBorderColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.ratingButtonBackgroundColor || "#1f2937"}
                  onChange={(e) => updateElementProps({ ratingButtonBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.ratingButtonTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ ratingButtonTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Textarea */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Comment Textarea</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.textareaFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ textareaFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.textareaFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.textareaPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ textareaPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.textareaPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Height (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.textareaHeight) || 48]}
                  onValueChange={([value]) => updateElementProps({ textareaHeight: `${value}px` })}
                  max={120}
                  min={32}
                  step={4}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.textareaHeight) || 48}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.textareaBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ textareaBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.textareaBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.textareaBorderColor || "#374151"}
                  onChange={(e) => updateElementProps({ textareaBorderColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.textareaBackgroundColor || "#1f2937"}
                  onChange={(e) => updateElementProps({ textareaBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.textareaTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ textareaTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Submit Button</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ buttonFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ buttonPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ buttonBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.buttonBackgroundColor || "#3b82f6"}
                  onChange={(e) => updateElementProps({ buttonBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.buttonTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ buttonTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const renderFeedbackFormStyling = () => (
    <>
      <Separator className="bg-sidebar-border" />
      <div>
        <Label className="text-sm font-medium mb-3 block">Feedback Form Styling</Label>
        
        {/* Form Title */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Form Title</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.titleFontSize) || 14]}
                  onValueChange={([value]) => updateElementProps({ titleFontSize: `${value}px` })}
                  max={32}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.titleFontSize) || 14}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Alignment</Label>
                <Select
                  value={selectedElement?.props?.titleAlign || "left"}
                  onValueChange={(value) => updateElementProps({ titleAlign: value })}
                >
                  <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.titleColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ titleColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Select Dropdown */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Category Select</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.selectFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ selectFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.selectFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.selectPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ selectPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.selectPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.selectBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ selectBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.selectBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.selectBorderColor || "#374151"}
                  onChange={(e) => updateElementProps({ selectBorderColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.selectBackgroundColor || "#1f2937"}
                  onChange={(e) => updateElementProps({ selectBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.selectTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ selectTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Textarea */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Feedback Textarea</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.textareaFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ textareaFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.textareaFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.textareaPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ textareaPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.textareaPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Height (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.textareaHeight) || 64]}
                  onValueChange={([value]) => updateElementProps({ textareaHeight: `${value}px` })}
                  max={120}
                  min={32}
                  step={4}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.textareaHeight) || 64}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.textareaBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ textareaBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.textareaBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.textareaBorderColor || "#374151"}
                  onChange={(e) => updateElementProps({ textareaBorderColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.textareaBackgroundColor || "#1f2937"}
                  onChange={(e) => updateElementProps({ textareaBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.textareaTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ textareaTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Submit Button</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ buttonFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ buttonPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ buttonBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.buttonBackgroundColor || "#3b82f6"}
                  onChange={(e) => updateElementProps({ buttonBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.buttonTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ buttonTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const renderNewsletterSignupStyling = () => (
    <>
      <Separator className="bg-sidebar-border" />
      <div>
        <Label className="text-sm font-medium mb-3 block">Newsletter Signup Styling</Label>
        
        {/* Form Title */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Form Title</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.titleFontSize) || 14]}
                  onValueChange={([value]) => updateElementProps({ titleFontSize: `${value}px` })}
                  max={32}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.titleFontSize) || 14}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Alignment</Label>
                <Select
                  value={selectedElement?.props?.titleAlign || "center"}
                  onValueChange={(value) => updateElementProps({ titleAlign: value })}
                >
                  <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.titleColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ titleColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Description Text</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Description Text</Label>
                <Input
                  placeholder="Stay updated with our latest news"
                  value={selectedElement?.props?.description || ""}
                  onChange={(e) => updateElementProps({ description: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.descriptionFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ descriptionFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.descriptionFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.descriptionColor || "#9ca3af"}
                  onChange={(e) => updateElementProps({ descriptionColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Email Input */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Email Input</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.inputFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ inputFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.inputFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.inputPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ inputPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.inputPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.inputBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ inputBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.inputBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.inputBorderColor || "#374151"}
                  onChange={(e) => updateElementProps({ inputBorderColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.inputBackgroundColor || "#1f2937"}
                  onChange={(e) => updateElementProps({ inputBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.inputTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ inputTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Subscribe Button */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Subscribe Button</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Button Text</Label>
                <Input
                  placeholder="Subscribe"
                  value={selectedElement?.props?.buttonText || ""}
                  onChange={(e) => updateElementProps({ buttonText: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonFontSize) || 12]}
                  onValueChange={([value]) => updateElementProps({ buttonFontSize: `${value}px` })}
                  max={24}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonFontSize) || 12}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonPadding) || 8]}
                  onValueChange={([value]) => updateElementProps({ buttonPadding: `${value}px` })}
                  max={20}
                  min={4}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonPadding) || 8}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <Slider
                  value={[Number.parseInt(selectedElement?.props?.buttonBorderRadius) || 4]}
                  onValueChange={([value]) => updateElementProps({ buttonBorderRadius: `${value}px` })}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {Number.parseInt(selectedElement?.props?.buttonBorderRadius) || 4}px
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Background Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.buttonBackgroundColor || "#3b82f6"}
                  onChange={(e) => updateElementProps({ buttonBackgroundColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <Input
                  type="color"
                  value={selectedElement?.props?.buttonTextColor || "#ffffff"}
                  onChange={(e) => updateElementProps({ buttonTextColor: e.target.value })}
                  className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

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

      {/* Enhanced Tab Navigation with Horizontal Scroll */}
      <div className="border-b border-sidebar-border bg-gradient-to-r from-sidebar-accent/50 to-transparent overflow-x-auto properties-tab-scroll">
        <div className="flex min-w-max">
          {[
            { id: "content", label: "Content", icon: Type },
            { id: "style", label: "Style", icon: Palette },
            { id: "layout", label: "Layout", icon: Layout },
            { id: "effects", label: "Effects", icon: Shadow },
            { id: "animations", label: "Animate", icon: Zap },
            { id: "advanced", label: "Advanced", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-all duration-200 relative min-w-[60px] ${
                activeTab === tab.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border-b-2 border-primary shadow-sm"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <tab.icon className="w-3 h-3" />
                <span className="text-[10px] leading-tight">{tab.label}</span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-3 space-y-4">
          {/* Content Tab */}
          {activeTab === "content" && (
            <>
              <div>
                <Label className="text-sm font-medium mb-2 block">Content</Label>
                {selectedElement.type === "heading" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Heading Text</Label>
                      <Input
                        placeholder="Enter heading text"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "image" ? (
                  <div className="space-y-3">
                    {/* Image Preview */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Preview</Label>
                      <div className="mt-1 border border-sidebar-border rounded-lg p-2 bg-sidebar-accent">
                        <img
                          src={selectedElement.content || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-32 object-contain rounded"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Image URL</Label>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Upload from Computer</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const result = event.target?.result as string
                              updateElementContent(result)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-1"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        Choose Image
                      </Button>
                    </div>
                    
                    {/* Image Rotation */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Rotation</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateElementProps({ 
                            rotation: ((selectedElement.props?.rotation || 0) - 90) % 360 
                          })}
                          className="flex-1"
                        >
                          ↺ -90°
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateElementProps({ 
                            rotation: ((selectedElement.props?.rotation || 0) + 90) % 360 
                          })}
                          className="flex-1"
                        >
                          ↻ +90°
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateElementProps({ rotation: 0 })}
                          className="flex-1"
                        >
                          Reset
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateElementProps({ 
                            rotation: ((selectedElement.props?.rotation || 0) + 180) % 360 
                          })}
                          className="flex-1"
                        >
                          180°
                        </Button>
                      </div>
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
                ) : selectedElement.type === "link" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Link Text</Label>
                      <Input
                        placeholder="Link text"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">URL</Label>
                      <Input
                        placeholder="https://example.com"
                        value={selectedElement.props?.href || ""}
                        onChange={(e) => updateElementProps({ href: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "code-block" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Code Content</Label>
                      <Textarea
                        placeholder="console.log('Hello World');"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border min-h-[120px] font-mono text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Language</Label>
                      <Select
                        value={selectedElement.props?.language || "javascript"}
                        onValueChange={(value) => updateElementProps({ language: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="typescript">TypeScript</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : selectedElement.type === "markdown" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Markdown Content</Label>
                      <Textarea
                        placeholder="# Heading&#10;&#10;This is **bold** text and *italic* text."
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border min-h-[120px] font-mono text-xs"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "rich-text" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Rich Text Content</Label>
                      <Textarea
                        placeholder="Rich text content..."
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border min-h-[120px]"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "form" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Form Title</Label>
                      <Input
                        placeholder="Contact Form"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Action URL</Label>
                      <Input
                        placeholder="/submit"
                        value={selectedElement.props?.action || ""}
                        onChange={(e) => updateElementProps({ action: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Method</Label>
                      <Select
                        value={selectedElement.props?.method || "POST"}
                        onValueChange={(value) => updateElementProps({ method: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="Submit"
                        value={selectedElement.props?.buttonText || "Submit"}
                        onChange={(e) => updateElementProps({ buttonText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.enableScaling || false}
                        onCheckedChange={(checked) => updateElementProps({ enableScaling: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Scale elements with form size</Label>
                    </div>
                    
                    {/* Form Elements Styling */}
                    <Separator className="bg-sidebar-border" />
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Form Elements Styling</Label>
                      
                      {/* Input Fields */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Input Fields</Label>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                              <Slider
                                value={[Number.parseInt(selectedElement.props?.inputFontSize) || 12]}
                                onValueChange={([value]) => updateElementProps({ inputFontSize: `${value}px` })}
                                max={24}
                                min={8}
                                step={1}
                                className="mt-2"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {Number.parseInt(selectedElement.props?.inputFontSize) || 12}px
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Padding</Label>
                              <Slider
                                value={[Number.parseInt(selectedElement.props?.inputPadding) || 8]}
                                onValueChange={([value]) => updateElementProps({ inputPadding: `${value}px` })}
                                max={20}
                                min={4}
                                step={1}
                                className="mt-2"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {Number.parseInt(selectedElement.props?.inputPadding) || 8}px
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Border Radius</Label>
                              <Slider
                                value={[Number.parseInt(selectedElement.props?.inputBorderRadius) || 4]}
                                onValueChange={([value]) => updateElementProps({ inputBorderRadius: `${value}px` })}
                                max={20}
                                min={0}
                                step={1}
                                className="mt-2"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {Number.parseInt(selectedElement.props?.inputBorderRadius) || 4}px
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Border Color</Label>
                              <Input
                                type="color"
                                value={selectedElement.props?.inputBorderColor || "#374151"}
                                onChange={(e) => updateElementProps({ inputBorderColor: e.target.value })}
                                className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Background Color</Label>
                              <Input
                                type="color"
                                value={selectedElement.props?.inputBackgroundColor || "#1f2937"}
                                onChange={(e) => updateElementProps({ inputBackgroundColor: e.target.value })}
                                className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Textarea */}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Textarea</Label>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Min Height (px)</Label>
                              <Slider
                                value={[Number.parseInt(selectedElement.props?.textareaMinHeight) || 64]}
                                onValueChange={([value]) => updateElementProps({ textareaMinHeight: `${value}px` })}
                                max={200}
                                min={40}
                                step={4}
                                className="mt-2"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {Number.parseInt(selectedElement.props?.textareaMinHeight) || 64}px
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Button */}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Submit Button</Label>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                              <Slider
                                value={[Number.parseInt(selectedElement.props?.buttonFontSize) || 12]}
                                onValueChange={([value]) => updateElementProps({ buttonFontSize: `${value}px` })}
                                max={24}
                                min={8}
                                step={1}
                                className="mt-2"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {Number.parseInt(selectedElement.props?.buttonFontSize) || 12}px
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Padding</Label>
                              <Slider
                                value={[Number.parseInt(selectedElement.props?.buttonPadding) || 8]}
                                onValueChange={([value]) => updateElementProps({ buttonPadding: `${value}px` })}
                                max={20}
                                min={4}
                                step={1}
                                className="mt-2"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {Number.parseInt(selectedElement.props?.buttonPadding) || 8}px
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Border Radius</Label>
                              <Slider
                                value={[Number.parseInt(selectedElement.props?.buttonBorderRadius) || 4]}
                                onValueChange={([value]) => updateElementProps({ buttonBorderRadius: `${value}px` })}
                                max={20}
                                min={0}
                                step={1}
                                className="mt-2"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {Number.parseInt(selectedElement.props?.buttonBorderRadius) || 4}px
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Background Color</Label>
                              <Input
                                type="color"
                                value={selectedElement.props?.buttonBackgroundColor || "#3b82f6"}
                                onChange={(e) => updateElementProps({ buttonBackgroundColor: e.target.value })}
                                className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Text Color</Label>
                              <Input
                                type="color"
                                value={selectedElement.props?.buttonTextColor || "#ffffff"}
                                onChange={(e) => updateElementProps({ buttonTextColor: e.target.value })}
                                className="bg-sidebar-accent border-sidebar-border mt-1 h-8"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedElement.type === "input" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Placeholder</Label>
                      <Input
                        placeholder="Enter placeholder text"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Input Type</Label>
                      <Select
                        value={selectedElement.props?.type || "text"}
                        onValueChange={(value) => updateElementProps({ type: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="password">Password</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="tel">Phone</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.required || false}
                        onCheckedChange={(checked) => updateElementProps({ required: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Required</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "textarea" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Placeholder</Label>
                      <Input
                        placeholder="Enter placeholder text"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rows</Label>
                      <Input
                        type="number"
                        placeholder="4"
                        value={selectedElement.props?.rows || 4}
                        onChange={(e) => updateElementProps({ rows: parseInt(e.target.value) || 4 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.required || false}
                        onCheckedChange={(checked) => updateElementProps({ required: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Required</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "select" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Options (one per line)</Label>
                      <Textarea
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        value={selectedElement.props?.options?.join('\n') || ""}
                        onChange={(e) => updateElementProps({ options: e.target.value.split('\n').filter(o => o.trim()) })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Default Value</Label>
                      <Input
                        placeholder="Default option"
                        value={selectedElement.props?.defaultValue || ""}
                        onChange={(e) => updateElementProps({ defaultValue: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "video" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Video URL</Label>
                      <Input
                        placeholder="https://example.com/video.mp4"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.autoplay || false}
                        onCheckedChange={(checked) => updateElementProps({ autoplay: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Autoplay</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.controls || true}
                        onCheckedChange={(checked) => updateElementProps({ controls: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Show Controls</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.loop || false}
                        onCheckedChange={(checked) => updateElementProps({ loop: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Loop</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "audio" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Audio URL</Label>
                      <Input
                        placeholder="https://example.com/audio.mp3"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.autoplay || false}
                        onCheckedChange={(checked) => updateElementProps({ autoplay: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Autoplay</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.controls || true}
                        onCheckedChange={(checked) => updateElementProps({ controls: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Show Controls</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "table" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Table Title</Label>
                      <Input
                        placeholder="Data Table"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Columns</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={selectedElement.props?.columns || 3}
                        onChange={(e) => updateElementProps({ columns: parseInt(e.target.value) || 3 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rows</Label>
                      <Input
                        type="number"
                        placeholder="4"
                        value={selectedElement.props?.rows || 4}
                        onChange={(e) => updateElementProps({ rows: parseInt(e.target.value) || 4 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "chart" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Chart Title</Label>
                      <Input
                        placeholder="Sales Chart"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Chart Type</Label>
                      <Select
                        value={selectedElement.props?.chartType || "bar"}
                        onValueChange={(value) => updateElementProps({ chartType: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="doughnut">Doughnut Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : selectedElement.type === "progress" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Progress Label</Label>
                      <Input
                        placeholder="Loading..."
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Progress Value (%)</Label>
                      <Slider
                        value={[selectedElement.props?.value || 50]}
                        onValueChange={([value]) => updateElementProps({ value })}
                        max={100}
                        min={0}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedElement.props?.value || 50}%
                      </div>
                    </div>
                  </div>
                ) : selectedElement.type === "counter" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Counter Label</Label>
                      <Input
                        placeholder="Total Users"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Target Value</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={selectedElement.props?.targetValue || 1000}
                        onChange={(e) => updateElementProps({ targetValue: parseInt(e.target.value) || 1000 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Suffix</Label>
                      <Input
                        placeholder="+"
                        value={selectedElement.props?.suffix || ""}
                        onChange={(e) => updateElementProps({ suffix: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "rating" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Rating Value</Label>
                      <Slider
                        value={[selectedElement.props?.value || 4]}
                        onValueChange={([value]) => updateElementProps({ value })}
                        max={5}
                        min={1}
                        step={0.5}
                        className="mt-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedElement.props?.value || 4} stars
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.readonly || false}
                        onCheckedChange={(checked) => updateElementProps({ readonly: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Read Only</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "pricing-table" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Table Title</Label>
                      <Input
                        placeholder="Pricing Plans"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Plans</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={selectedElement.props?.plans || 3}
                        onChange={(e) => updateElementProps({ plans: parseInt(e.target.value) || 3 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "hero" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Hero Title</Label>
                      <Input
                        placeholder="Welcome to Our Platform"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Subtitle</Label>
                      <Textarea
                        placeholder="Build amazing websites with our drag-and-drop builder..."
                        value={selectedElement.props?.subtitle || ""}
                        onChange={(e) => updateElementProps({ subtitle: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Primary Button Text</Label>
                      <Input
                        placeholder="Get Started"
                        value={selectedElement.props?.primaryButton || ""}
                        onChange={(e) => updateElementProps({ primaryButton: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Secondary Button Text</Label>
                      <Input
                        placeholder="Learn More"
                        value={selectedElement.props?.secondaryButton || ""}
                        onChange={(e) => updateElementProps({ secondaryButton: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "cta" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">CTA Title</Label>
                      <Input
                        placeholder="Call to Action"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Textarea
                        placeholder="Get started today and transform your business"
                        value={selectedElement.props?.description || ""}
                        onChange={(e) => updateElementProps({ description: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="Get Started"
                        value={selectedElement.props?.buttonText || ""}
                        onChange={(e) => updateElementProps({ buttonText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "contact-form" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Form Title</Label>
                      <Input
                        placeholder="Contact Us Form"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Action URL</Label>
                      <Input
                        placeholder="/contact"
                        value={selectedElement.props?.action || ""}
                        onChange={(e) => updateElementProps({ action: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submit Button Text</Label>
                      <Input
                        placeholder="Send Message"
                        value={selectedElement.props?.submitText || ""}
                        onChange={(e) => updateElementProps({ submitText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "newsletter-signup" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <Input
                        placeholder="Newsletter Signup"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Textarea
                        placeholder="Stay updated with our latest news"
                        value={selectedElement.props?.description || ""}
                        onChange={(e) => updateElementProps({ description: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="Subscribe"
                        value={selectedElement.props?.buttonText || ""}
                        onChange={(e) => updateElementProps({ buttonText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    {renderNewsletterSignupStyling()}
                  </div>
                ) : selectedElement.type === "login-form" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Form Title</Label>
                      <Input
                        placeholder="Login Form"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submit Button Text</Label>
                      <Input
                        placeholder="Login"
                        value={selectedElement.props?.submitText || ""}
                        onChange={(e) => updateElementProps({ submitText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Forgot Password Link</Label>
                      <Input
                        placeholder="Forgot password?"
                        value={selectedElement.props?.forgotPasswordText || ""}
                        onChange={(e) => updateElementProps({ forgotPasswordText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    {renderFormElementsStyling()}
                  </div>
                ) : selectedElement.type === "registration-form" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Form Title</Label>
                      <Input
                        placeholder="Registration Form"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submit Button Text</Label>
                      <Input
                        placeholder="Register"
                        value={selectedElement.props?.submitText || ""}
                        onChange={(e) => updateElementProps({ submitText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    {renderFormElementsStyling()}
                  </div>
                ) : selectedElement.type === "survey-form" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Survey Title</Label>
                      <Input
                        placeholder="Survey Form"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Question</Label>
                      <Input
                        placeholder="How satisfied are you?"
                        value={selectedElement.props?.question || ""}
                        onChange={(e) => updateElementProps({ question: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submit Button Text</Label>
                      <Input
                        placeholder="Submit"
                        value={selectedElement.props?.submitText || ""}
                        onChange={(e) => updateElementProps({ submitText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    {renderSurveyFormStyling()}
                  </div>
                ) : selectedElement.type === "order-form" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Form Title</Label>
                      <Input
                        placeholder="Order Form"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submit Button Text</Label>
                      <Input
                        placeholder="Place Order"
                        value={selectedElement.props?.submitText || ""}
                        onChange={(e) => updateElementProps({ submitText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    {renderFormElementsStyling()}
                  </div>
                ) : selectedElement.type === "booking-form" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Form Title</Label>
                      <Input
                        placeholder="Booking Form"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submit Button Text</Label>
                      <Input
                        placeholder="Book Now"
                        value={selectedElement.props?.submitText || ""}
                        onChange={(e) => updateElementProps({ submitText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    {renderFormElementsStyling()}
                  </div>
                ) : selectedElement.type === "feedback-form" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Form Title</Label>
                      <Input
                        placeholder="Feedback Form"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submit Button Text</Label>
                      <Input
                        placeholder="Submit Feedback"
                        value={selectedElement.props?.submitText || ""}
                        onChange={(e) => updateElementProps({ submitText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    {renderFeedbackFormStyling()}
                  </div>
                ) : selectedElement.type === "navigation" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Navigation Title</Label>
                      <Input
                        placeholder="Main Navigation"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Menu Items (one per line)</Label>
                      <Textarea
                        placeholder="Home&#10;About&#10;Services&#10;Contact"
                        value={selectedElement.props?.menuItems?.join('\n') || ""}
                        onChange={(e) => updateElementProps({ menuItems: e.target.value.split('\n').filter(item => item.trim()) })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "footer" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Footer Title</Label>
                      <Input
                        placeholder="Company Footer"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Copyright Text</Label>
                      <Input
                        placeholder="© 2024 Company Name"
                        value={selectedElement.props?.copyright || ""}
                        onChange={(e) => updateElementProps({ copyright: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "header" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Header Title</Label>
                      <Input
                        placeholder="Page Header"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Subtitle</Label>
                      <Input
                        placeholder="Page subtitle or description"
                        value={selectedElement.props?.subtitle || ""}
                        onChange={(e) => updateElementProps({ subtitle: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "sidebar" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Sidebar Title</Label>
                      <Input
                        placeholder="Sidebar"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sidebar Items (one per line)</Label>
                      <Textarea
                        placeholder="Dashboard&#10;Settings&#10;Profile&#10;Logout"
                        value={selectedElement.props?.sidebarItems?.join('\n') || ""}
                        onChange={(e) => updateElementProps({ sidebarItems: e.target.value.split('\n').filter(item => item.trim()) })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "card" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Card Title</Label>
                      <Input
                        placeholder="Card Title"
                        value={selectedElement.props?.title || ""}
                        onChange={(e) => updateElementProps({ title: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Card Description</Label>
                      <Textarea
                        placeholder="Card description or content..."
                        value={selectedElement.props?.description || selectedElement.content}
                        onChange={(e) => updateElementProps({ description: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="Learn More"
                        value={selectedElement.props?.buttonText || ""}
                        onChange={(e) => updateElementProps({ buttonText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "quote" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Quote Text</Label>
                      <Textarea
                        placeholder="Enter quote text..."
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Author</Label>
                      <Input
                        placeholder="Quote author"
                        value={selectedElement.props?.author || ""}
                        onChange={(e) => updateElementProps({ author: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "list" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">List Title</Label>
                      <Input
                        placeholder="List Title"
                        value={selectedElement.props?.title || ""}
                        onChange={(e) => updateElementProps({ title: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-muted-foreground">List Items</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const currentItems = selectedElement.props?.listItems || [];
                            updateElementProps({ listItems: [...currentItems, `Item ${currentItems.length + 1}`] });
                          }}
                          className="h-7"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Item
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {(selectedElement.props?.listItems || []).map((item: string, index: number) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Item ${index + 1}`}
                              value={item}
                              onChange={(e) => {
                                const newItems = [...(selectedElement.props?.listItems || [])];
                                newItems[index] = e.target.value;
                                updateElementProps({ listItems: newItems });
                              }}
                              className="bg-sidebar-accent border-sidebar-border flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newItems = (selectedElement.props?.listItems || []).filter((_: any, i: number) => i !== index);
                                updateElementProps({ listItems: newItems });
                              }}
                              className="h-10 w-10 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">List Type</Label>
                      <Select
                        value={selectedElement.props?.listType || "ul"}
                        onValueChange={(value) => updateElementProps({ listType: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ul">Unordered List</SelectItem>
                          <SelectItem value="ol">Ordered List</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : selectedElement.type === "checkbox" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Checkbox Label</Label>
                      <Input
                        placeholder="Checkbox option"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.checked || false}
                        onCheckedChange={(checked) => updateElementProps({ checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Checked by default</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.required || false}
                        onCheckedChange={(checked) => updateElementProps({ required: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Required</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "radio" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Radio Label</Label>
                      <Input
                        placeholder="Radio option"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Group Name</Label>
                      <Input
                        placeholder="radio-group"
                        value={selectedElement.props?.groupName || ""}
                        onChange={(e) => updateElementProps({ groupName: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.checked || false}
                        onCheckedChange={(checked) => updateElementProps({ checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Selected by default</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "switch" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Switch Label</Label>
                      <Input
                        placeholder="Toggle option"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.checked || false}
                        onCheckedChange={(checked) => updateElementProps({ checked })}
                      />
                      <Label className="text-xs text-muted-foreground">On by default</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "gallery" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Gallery Title</Label>
                      <Input
                        placeholder="Image Gallery"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Images</Label>
                      <Input
                        type="number"
                        placeholder="6"
                        value={selectedElement.props?.imageCount || 6}
                        onChange={(e) => updateElementProps({ imageCount: parseInt(e.target.value) || 6 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Columns</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={selectedElement.props?.columns || 3}
                        onChange={(e) => updateElementProps({ columns: parseInt(e.target.value) || 3 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "icon" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Icon Name</Label>
                      <Input
                        placeholder="heart"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Icon Size</Label>
                      <Select
                        value={selectedElement.props?.size || "24"}
                        onValueChange={(value) => updateElementProps({ size: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16">Small (16px)</SelectItem>
                          <SelectItem value="24">Medium (24px)</SelectItem>
                          <SelectItem value="32">Large (32px)</SelectItem>
                          <SelectItem value="48">Extra Large (48px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : selectedElement.type === "badge" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Badge Text</Label>
                      <Input
                        placeholder="New"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Badge Variant</Label>
                      <Select
                        value={selectedElement.props?.variant || "default"}
                        onValueChange={(value) => updateElementProps({ variant: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="destructive">Destructive</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : selectedElement.type === "avatar" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Avatar Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Avatar URL</Label>
                      <Input
                        placeholder="https://example.com/avatar.jpg"
                        value={selectedElement.props?.src || ""}
                        onChange={(e) => updateElementProps({ src: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Avatar Size</Label>
                      <Select
                        value={selectedElement.props?.size || "md"}
                        onValueChange={(value) => updateElementProps({ size: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : selectedElement.type === "modal" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Modal Title</Label>
                      <Input
                        placeholder="Modal Title"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Modal Content</Label>
                      <Textarea
                        placeholder="Modal content..."
                        value={selectedElement.props?.modalContent || ""}
                        onChange={(e) => updateElementProps({ modalContent: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="Open Modal"
                        value={selectedElement.props?.buttonText || ""}
                        onChange={(e) => updateElementProps({ buttonText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "tooltip" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Tooltip Text</Label>
                      <Input
                        placeholder="Tooltip content"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Trigger Text</Label>
                      <Input
                        placeholder="Hover me"
                        value={selectedElement.props?.triggerText || ""}
                        onChange={(e) => updateElementProps({ triggerText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      <Select
                        value={selectedElement.props?.position || "top"}
                        onValueChange={(value) => updateElementProps({ position: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : selectedElement.type === "dropdown" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Dropdown Label</Label>
                      <Input
                        placeholder="Select option"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Options (one per line)</Label>
                      <Textarea
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        value={selectedElement.props?.options?.join('\n') || ""}
                        onChange={(e) => updateElementProps({ options: e.target.value.split('\n').filter(o => o.trim()) })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Default Value</Label>
                      <Input
                        placeholder="Default option"
                        value={selectedElement.props?.defaultValue || ""}
                        onChange={(e) => updateElementProps({ defaultValue: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "tabs" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Tabs Title</Label>
                      <Input
                        placeholder="Tab Group"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tab Names (one per line)</Label>
                      <Textarea
                        placeholder="Tab 1&#10;Tab 2&#10;Tab 3"
                        value={selectedElement.props?.tabNames?.join('\n') || ""}
                        onChange={(e) => updateElementProps({ tabNames: e.target.value.split('\n').filter(tab => tab.trim()) })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "accordion" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Accordion Title</Label>
                      <Input
                        placeholder="FAQ Section"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Items</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={selectedElement.props?.itemCount || 3}
                        onChange={(e) => updateElementProps({ itemCount: parseInt(e.target.value) || 3 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "carousel" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Carousel Title</Label>
                      <Input
                        placeholder="Image Carousel"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Slides</Label>
                      <Input
                        type="number"
                        placeholder="5"
                        value={selectedElement.props?.slideCount || 5}
                        onChange={(e) => updateElementProps({ slideCount: parseInt(e.target.value) || 5 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedElement.props?.autoplay || false}
                        onCheckedChange={(checked) => updateElementProps({ autoplay: checked })}
                      />
                      <Label className="text-xs text-muted-foreground">Autoplay</Label>
                    </div>
                  </div>
                ) : selectedElement.type === "timeline" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Timeline Title</Label>
                      <Input
                        placeholder="Project Timeline"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Events</Label>
                      <Input
                        type="number"
                        placeholder="4"
                        value={selectedElement.props?.eventCount || 4}
                        onChange={(e) => updateElementProps({ eventCount: parseInt(e.target.value) || 4 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "stats" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Stats Title</Label>
                      <Input
                        placeholder="Statistics"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Stats</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={selectedElement.props?.statCount || 3}
                        onChange={(e) => updateElementProps({ statCount: parseInt(e.target.value) || 3 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "product-card" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Product Name</Label>
                      <Input
                        placeholder="Product Name"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <Input
                        placeholder="$99.99"
                        value={selectedElement.props?.price || ""}
                        onChange={(e) => updateElementProps({ price: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Textarea
                        placeholder="Product description..."
                        value={selectedElement.props?.description || ""}
                        onChange={(e) => updateElementProps({ description: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="Add to Cart"
                        value={selectedElement.props?.buttonText || ""}
                        onChange={(e) => updateElementProps({ buttonText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "price" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Price Amount</Label>
                      <Input
                        placeholder="$99.99"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Currency</Label>
                      <Select
                        value={selectedElement.props?.currency || "USD"}
                        onValueChange={(value) => updateElementProps({ currency: value })}
                      >
                        <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Period</Label>
                      <Input
                        placeholder="/month"
                        value={selectedElement.props?.period || ""}
                        onChange={(e) => updateElementProps({ period: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "cart" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cart Title</Label>
                      <Input
                        placeholder="Shopping Cart"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Items</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={selectedElement.props?.itemCount || 3}
                        onChange={(e) => updateElementProps({ itemCount: parseInt(e.target.value) || 3 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Amount</Label>
                      <Input
                        placeholder="$299.97"
                        value={selectedElement.props?.totalAmount || ""}
                        onChange={(e) => updateElementProps({ totalAmount: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "checkout" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Checkout Title</Label>
                      <Input
                        placeholder="Checkout"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Amount</Label>
                      <Input
                        placeholder="$299.97"
                        value={selectedElement.props?.totalAmount || ""}
                        onChange={(e) => updateElementProps({ totalAmount: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        placeholder="Complete Purchase"
                        value={selectedElement.props?.buttonText || ""}
                        onChange={(e) => updateElementProps({ buttonText: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "social-links" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Social Links Title</Label>
                      <Input
                        placeholder="Follow Us"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Social Platforms (one per line)</Label>
                      <Textarea
                        placeholder="Facebook&#10;Twitter&#10;Instagram&#10;LinkedIn"
                        value={selectedElement.props?.platforms?.join('\n') || ""}
                        onChange={(e) => updateElementProps({ platforms: e.target.value.split('\n').filter(p => p.trim()) })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "contact-info" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Contact Title</Label>
                      <Input
                        placeholder="Contact Information"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        value={selectedElement.props?.phone || ""}
                        onChange={(e) => updateElementProps({ phone: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Input
                        placeholder="contact@example.com"
                        value={selectedElement.props?.email || ""}
                        onChange={(e) => updateElementProps({ email: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Address</Label>
                      <Textarea
                        placeholder="123 Main St, City, State 12345"
                        value={selectedElement.props?.address || ""}
                        onChange={(e) => updateElementProps({ address: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[60px]"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "map" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Map Title</Label>
                      <Input
                        placeholder="Our Location"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Address</Label>
                      <Textarea
                        placeholder="123 Main St, City, State 12345"
                        value={selectedElement.props?.address || ""}
                        onChange={(e) => updateElementProps({ address: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Map Height</Label>
                      <Input
                        placeholder="300px"
                        value={selectedElement.props?.height || ""}
                        onChange={(e) => updateElementProps({ height: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "team" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Team Title</Label>
                      <Input
                        placeholder="Our Team"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Members</Label>
                      <Input
                        type="number"
                        placeholder="4"
                        value={selectedElement.props?.memberCount || 4}
                        onChange={(e) => updateElementProps({ memberCount: parseInt(e.target.value) || 4 })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "testimonial" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Testimonial Text</Label>
                      <Textarea
                        placeholder="This product is amazing!"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Customer Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={selectedElement.props?.customerName || ""}
                        onChange={(e) => updateElementProps({ customerName: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Customer Title</Label>
                      <Input
                        placeholder="CEO, Company Inc."
                        value={selectedElement.props?.customerTitle || ""}
                        onChange={(e) => updateElementProps({ customerTitle: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                  </div>
                ) : selectedElement.type === "about" ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">About Title</Label>
                      <Input
                        placeholder="About Us"
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="bg-sidebar-accent border-sidebar-border mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Textarea
                        placeholder="We are a team of passionate developers..."
                        value={selectedElement.props?.description || ""}
                        onChange={(e) => updateElementProps({ description: e.target.value })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stats (one per line)</Label>
                      <Textarea
                        placeholder="100+ Projects&#10;50+ Clients&#10;5+ Years Experience"
                        value={selectedElement.props?.stats?.join('\n') || ""}
                        onChange={(e) => updateElementProps({ stats: e.target.value.split('\n').filter(s => s.trim()) })}
                        className="bg-sidebar-accent border-sidebar-border min-h-[60px]"
                      />
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
              {/* Typography for List */}
              {selectedElement.type === "list" && (
                <>
                  {/* Font Family (Common) */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Font Family
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Family</Label>
                        <Select
                          value={selectedElement.props?.fontFamily || "inherit"}
                          onValueChange={(value) => updateElementProps({ fontFamily: value })}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">Default</SelectItem>
                            <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                            <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                            <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                            <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                            <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                            <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                            <SelectItem value="'Merriweather', serif">Merriweather</SelectItem>
                            <SelectItem value="'Georgia', serif">Georgia</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                            <SelectItem value="'Monaco', monospace">Monaco</SelectItem>
                            <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                            <SelectItem value="'Helvetica', sans-serif">Helvetica</SelectItem>
                            <SelectItem value="'Verdana', sans-serif">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-sidebar-border" />

                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      List Title Typography
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                        <Slider
                          value={[Number.parseInt(selectedElement.props?.titleFontSize) || 16]}
                          onValueChange={([value]) => updateElementProps({ titleFontSize: `${value}px` })}
                          max={72}
                          min={8}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Number.parseInt(selectedElement.props?.titleFontSize) || 16}px
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Weight</Label>
                        <Select
                          value={selectedElement.props?.titleFontWeight || "400"}
                          onValueChange={(value) => updateElementProps({ titleFontWeight: value })}
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
                        <Label className="text-xs text-muted-foreground">Font Style</Label>
                        <Select
                          value={selectedElement.props?.titleFontStyle || "normal"}
                          onValueChange={(value) => updateElementProps({ titleFontStyle: value })}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="italic">Italic</SelectItem>
                            <SelectItem value="oblique">Oblique</SelectItem>
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
                              variant={selectedElement.props?.titleTextAlign === align.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateElementProps({ titleTextAlign: align.value })}
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

                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      List Items Typography
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                        <Slider
                          value={[Number.parseInt(selectedElement.props?.itemsFontSize) || 14]}
                          onValueChange={([value]) => updateElementProps({ itemsFontSize: `${value}px` })}
                          max={72}
                          min={8}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Number.parseInt(selectedElement.props?.itemsFontSize) || 14}px
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Weight</Label>
                        <Select
                          value={selectedElement.props?.itemsFontWeight || "400"}
                          onValueChange={(value) => updateElementProps({ itemsFontWeight: value })}
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
                        <Label className="text-xs text-muted-foreground">Font Style</Label>
                        <Select
                          value={selectedElement.props?.itemsFontStyle || "normal"}
                          onValueChange={(value) => updateElementProps({ itemsFontStyle: value })}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="italic">Italic</SelectItem>
                            <SelectItem value="oblique">Oblique</SelectItem>
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
                              variant={selectedElement.props?.itemsTextAlign === align.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateElementProps({ itemsTextAlign: align.value })}
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
                        <Label className="text-xs text-muted-foreground">Font Family</Label>
                        <Select
                          value={currentStyles?.fontFamily || "inherit"}
                          onValueChange={(value) => updateElementStyle("fontFamily", value)}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">Default</SelectItem>
                            <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                            <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                            <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                            <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                            <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                            <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                            <SelectItem value="'Merriweather', serif">Merriweather</SelectItem>
                            <SelectItem value="'Georgia', serif">Georgia</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                            <SelectItem value="'Monaco', monospace">Monaco</SelectItem>
                            <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                            <SelectItem value="'Helvetica', sans-serif">Helvetica</SelectItem>
                            <SelectItem value="'Verdana', sans-serif">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                        <Slider
                          value={[(() => {
                            const fontSize = currentStyles?.fontSize?.toString() || '16px';
                            // Convert rem to px (1rem = 16px)
                            if (fontSize.includes('rem')) {
                              return Math.round(parseFloat(fontSize) * 16);
                            }
                            // Parse px value
                            return Number.parseInt(fontSize.replace(/\D/g, '')) || 16;
                          })()]}
                          onValueChange={([value]) => updateElementStyle("fontSize", `${value}px`)}
                          max={72}
                          min={8}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const fontSize = currentStyles?.fontSize?.toString() || '16px';
                            // Convert rem to px (1rem = 16px)
                            if (fontSize.includes('rem')) {
                              return Math.round(parseFloat(fontSize) * 16);
                            }
                            // Parse px value
                            return Number.parseInt(fontSize.replace(/\D/g, '')) || 16;
                          })()}px
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Weight</Label>
                        <Select
                          value={(() => {
                            const weight = currentStyles?.fontWeight?.toString();
                            // Map string values to numeric values
                            if (!weight || weight === 'normal') return 'inherit';
                            if (weight === 'bold') return '700';
                            if (weight === 'lighter') return '300';
                            if (weight === 'bolder') return '800';
                            return weight;
                          })()}
                          onValueChange={(value) => updateElementStyle("fontWeight", value === "inherit" ? undefined : value)}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue placeholder="Default" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">Default</SelectItem>
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

              {/* Typography for Card */}
              {selectedElement.type === "card" && (
                <>
                  {/* Font Family (Common) */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Font Family
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Family</Label>
                        <Select
                          value={selectedElement.props?.fontFamily || "inherit"}
                          onValueChange={(value) => updateElementProps({ fontFamily: value })}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">Default</SelectItem>
                            <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                            <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                            <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                            <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                            <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                            <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                            <SelectItem value="'Merriweather', serif">Merriweather</SelectItem>
                            <SelectItem value="'Georgia', serif">Georgia</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                            <SelectItem value="'Monaco', monospace">Monaco</SelectItem>
                            <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                            <SelectItem value="'Helvetica', sans-serif">Helvetica</SelectItem>
                            <SelectItem value="'Verdana', sans-serif">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-sidebar-border" />

                  {/* Title Typography */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Title Typography
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                        <Slider
                          value={[Number.parseInt(selectedElement.props?.titleFontSize) || 18]}
                          onValueChange={([value]) => updateElementProps({ titleFontSize: `${value}px` })}
                          max={72}
                          min={8}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Number.parseInt(selectedElement.props?.titleFontSize) || 18}px
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Weight</Label>
                        <Select
                          value={selectedElement.props?.titleFontWeight || "600"}
                          onValueChange={(value) => updateElementProps({ titleFontWeight: value })}
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
                              variant={selectedElement.props?.titleTextAlign === align.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateElementProps({ titleTextAlign: align.value })}
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

                  {/* Description Typography */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Description Typography
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                        <Slider
                          value={[Number.parseInt(selectedElement.props?.descriptionFontSize) || 14]}
                          onValueChange={([value]) => updateElementProps({ descriptionFontSize: `${value}px` })}
                          max={48}
                          min={8}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Number.parseInt(selectedElement.props?.descriptionFontSize) || 14}px
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Weight</Label>
                        <Select
                          value={selectedElement.props?.descriptionFontWeight || "400"}
                          onValueChange={(value) => updateElementProps({ descriptionFontWeight: value })}
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
                              variant={selectedElement.props?.descriptionTextAlign === align.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateElementProps({ descriptionTextAlign: align.value })}
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

                  {/* Button Typography */}
                  {selectedElement.props?.buttonText && (
                    <>
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                          <Type className="w-4 h-4" />
                          Button Typography
                        </Label>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                            <Slider
                              value={[Number.parseInt(selectedElement.props?.buttonFontSize) || 12]}
                              onValueChange={([value]) => updateElementProps({ buttonFontSize: `${value}px` })}
                              max={24}
                              min={8}
                              step={1}
                              className="mt-2"
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {Number.parseInt(selectedElement.props?.buttonFontSize) || 12}px
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Font Weight</Label>
                            <Select
                              value={selectedElement.props?.buttonFontWeight || "500"}
                              onValueChange={(value) => updateElementProps({ buttonFontWeight: value })}
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
                        </div>
                      </div>
                      <Separator className="bg-sidebar-border" />
                    </>
                  )}
                </>
              )}

              {/* Typography for Quote */}
              {selectedElement.type === "quote" && (
                <>
                  {/* Font Family */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Font Family
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Family</Label>
                        <Select
                          value={selectedElement.props?.fontFamily || "inherit"}
                          onValueChange={(value) => updateElementProps({ fontFamily: value })}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">Default</SelectItem>
                            <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                            <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                            <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                            <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                            <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                            <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                            <SelectItem value="'Merriweather', serif">Merriweather</SelectItem>
                            <SelectItem value="'Georgia', serif">Georgia</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                            <SelectItem value="'Monaco', monospace">Monaco</SelectItem>
                            <SelectItem value="'Arial', sans-serif">Arial</SelectItem>
                            <SelectItem value="'Helvetica', sans-serif">Helvetica</SelectItem>
                            <SelectItem value="'Verdana', sans-serif">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-sidebar-border" />

                  {/* Quote Typography */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Quote Typography
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                        <Slider
                          value={[Number.parseInt(selectedElement.props?.fontSize) || 14]}
                          onValueChange={([value]) => updateElementProps({ fontSize: `${value}px` })}
                          max={48}
                          min={8}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Number.parseInt(selectedElement.props?.fontSize) || 14}px
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Font Weight</Label>
                        <Select
                          value={selectedElement.props?.fontWeight || "400"}
                          onValueChange={(value) => updateElementProps({ fontWeight: value })}
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
                        <Label className="text-xs text-muted-foreground">Font Style</Label>
                        <Select
                          value={selectedElement.props?.fontStyle || "italic"}
                          onValueChange={(value) => updateElementProps({ fontStyle: value })}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="italic">Italic</SelectItem>
                            <SelectItem value="oblique">Oblique</SelectItem>
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
                              variant={selectedElement.props?.textAlign === align.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateElementProps({ textAlign: align.value })}
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

              {/* Auto-scale Settings */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Layout className="w-4 h-4" />
                  Auto Scale
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Scale content with resize</Label>
                    <Switch
                      checked={selectedElement.props?.autoScale !== false}
                      onCheckedChange={(checked) => updateElementProps({ autoScale: checked })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically scale fonts, padding, and spacing when resizing the component
                  </p>
                </div>
              </div>

              <Separator className="bg-sidebar-border" />

              {/* Quote Author Styles */}
              {selectedElement.type === "quote" && (
                <>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      Author Style
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Author Font Size</Label>
                        <Slider
                          value={[Number.parseInt(selectedElement.props?.authorFontSize) || 12]}
                          onValueChange={([value]) => updateElementProps({ authorFontSize: `${value}px` })}
                          max={32}
                          min={8}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Number.parseInt(selectedElement.props?.authorFontSize) || 12}px
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Author Font Weight</Label>
                        <Select
                          value={selectedElement.props?.authorFontWeight || "400"}
                          onValueChange={(value) => updateElementProps({ authorFontWeight: value })}
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
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-sidebar-border" />
                </>
              )}

              {/* Separator Specific Styles */}
              {selectedElement.type === "separator" && (
                <>
                  <Separator className="bg-sidebar-border" />
                  
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Layout className="w-4 h-4" />
                      Separator Style
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Thickness</Label>
                        <Slider
                          value={[Number.parseInt(selectedElement.props?.thickness) || 1]}
                          onValueChange={([value]) => updateElementProps({ thickness: `${value}px` })}
                          max={10}
                          min={1}
                          step={1}
                          className="mt-2"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {Number.parseInt(selectedElement.props?.thickness) || 1}px
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Orientation</Label>
                        <Select
                          value={selectedElement.props?.orientation || "horizontal"}
                          onValueChange={(value) => updateElementProps({ orientation: value })}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="horizontal">Horizontal</SelectItem>
                            <SelectItem value="vertical">Vertical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Style</Label>
                        <Select
                          value={selectedElement.props?.separatorStyle || "solid"}
                          onValueChange={(value) => updateElementProps({ separatorStyle: value })}
                        >
                          <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="dashed">Dashed</SelectItem>
                            <SelectItem value="dotted">Dotted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={currentStyles?.backgroundColor || "#6b7280"}
                            onChange={(e) => {
                              setColorInputs((prev) => ({ ...prev, backgroundColor: e.target.value }))
                              updateElementStyle("backgroundColor", e.target.value)
                            }}
                            className="w-10 h-10 rounded border border-sidebar-border cursor-pointer"
                          />
                          <Input
                            placeholder="#6b7280"
                            value={currentStyles?.backgroundColor || "#6b7280"}
                            onChange={(e) => {
                              setColorInputs((prev) => ({ ...prev, backgroundColor: e.target.value }))
                              updateElementStyle("backgroundColor", e.target.value)
                            }}
                            className="bg-sidebar-accent border-sidebar-border text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
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

              {/* Quote Position Settings */}
              {selectedElement.type === "quote" && (
                <>
                  <Separator className="bg-sidebar-border" />
                  
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Layout className="w-4 h-4" />
                      Position
                    </Label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">X Position (px)</Label>
                          <Input
                            placeholder="100"
                            value={selectedElement.position?.x || ""}
                            onChange={(e) => onUpdateElementPosition(selectedElement.id, { 
                              x: Number.parseInt(e.target.value) || 0,
                              y: selectedElement.position?.y || 0,
                              width: selectedElement.position?.width,
                              height: selectedElement.position?.height
                            })}
                            className="bg-sidebar-accent border-sidebar-border mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Y Position (px)</Label>
                          <Input
                            placeholder="100"
                            value={selectedElement.position?.y || ""}
                            onChange={(e) => onUpdateElementPosition(selectedElement.id, { 
                              x: selectedElement.position?.x || 0,
                              y: Number.parseInt(e.target.value) || 0,
                              width: selectedElement.position?.width,
                              height: selectedElement.position?.height
                            })}
                            className="bg-sidebar-accent border-sidebar-border mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Width (px)</Label>
                          <Input
                            placeholder="450"
                            value={selectedElement.position?.width || ""}
                            onChange={(e) => onUpdateElementPosition(selectedElement.id, { 
                              x: selectedElement.position?.x || 0,
                              y: selectedElement.position?.y || 0,
                              width: Number.parseInt(e.target.value) || 200,
                              height: selectedElement.position?.height
                            })}
                            className="bg-sidebar-accent border-sidebar-border mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Height (px)</Label>
                          <Input
                            placeholder="140"
                            value={selectedElement.position?.height || ""}
                            onChange={(e) => onUpdateElementPosition(selectedElement.id, { 
                              x: selectedElement.position?.x || 0,
                              y: selectedElement.position?.y || 0,
                              width: selectedElement.position?.width,
                              height: Number.parseInt(e.target.value) || 50
                            })}
                            className="bg-sidebar-accent border-sidebar-border mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Label className="text-xs text-muted-foreground">Quick Actions</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateElementPosition(selectedElement.id, { 
                              x: 50,
                              y: 50,
                              width: selectedElement.position?.width,
                              height: selectedElement.position?.height
                            })}
                            className="text-xs"
                          >
                            Reset Position
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateElementPosition(selectedElement.id, { 
                              x: selectedElement.position?.x || 0,
                              y: selectedElement.position?.y || 0,
                              width: 450,
                              height: 140
                            })}
                            className="text-xs"
                          >
                            Default Size
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Effects Tab */}
          {activeTab === "effects" && (
            <>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <BorderIcon className="w-4 h-4" />
                  Border & Radius
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
                  <div>
                    <Label className="text-xs text-muted-foreground">Border Width</Label>
                    <Slider
                      value={[Number.parseInt(currentStyles?.borderWidth) || 0]}
                      onValueChange={([value]) => updateElementStyle("borderWidth", `${value}px`)}
                      max={10}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-sidebar-border" />

              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Shadow className="w-4 h-4" />
                  Shadow & Glow
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

              <Separator className="bg-sidebar-border" />

              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4" />
                  Background Effects
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Background Gradient</Label>
                    <Input
                      placeholder="linear-gradient(45deg, #ff6b6b, #4ecdc4)"
                      value={currentStyles?.backgroundImage || ""}
                      onChange={(e) => updateElementStyle("backgroundImage", e.target.value)}
                      className="bg-sidebar-accent border-sidebar-border mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateElementStyle("backgroundImage", "linear-gradient(45deg, #667eea 0%, #764ba2 100%)")}
                      className="flex-1"
                    >
                      Purple
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateElementStyle("backgroundImage", "linear-gradient(45deg, #f093fb 0%, #f5576c 100%)")}
                      className="flex-1"
                    >
                      Pink
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateElementStyle("backgroundImage", "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)")}
                      className="flex-1"
                    >
                      Blue
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Animations Tab */}
          {activeTab === "animations" && (
            <>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4" />
                  Animation Type
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Animation</Label>
                    <Select
                      value={selectedElement?.animations?.type || "none"}
                      onValueChange={(value) => {
                        if (selectedElement) {
                          onUpdateElement(selectedElement.id, {
                            animations: {
                              type: value as "fadeIn" | "slideIn" | "zoomIn" | "bounce" | "pulse" | "shake" | "none",
                              duration: selectedElement.animations?.duration || 600,
                              delay: selectedElement.animations?.delay || 0,
                              direction: selectedElement.animations?.direction,
                            }
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="bg-sidebar-accent border-sidebar-border mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="fadeIn">Fade In</SelectItem>
                        <SelectItem value="slideIn">Slide In</SelectItem>
                        <SelectItem value="zoomIn">Zoom In</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                        <SelectItem value="pulse">Pulse</SelectItem>
                        <SelectItem value="shake">Shake</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Duration (ms)</Label>
                    <Slider
                      value={[selectedElement?.animations?.duration || 600]}
                      onValueChange={([value]) => {
                        if (selectedElement) {
                          onUpdateElement(selectedElement.id, {
                            animations: {
                              type: selectedElement.animations?.type || "none",
                              duration: value,
                              delay: selectedElement.animations?.delay || 0,
                              direction: selectedElement.animations?.direction,
                            }
                          })
                        }
                      }}
                      max={2000}
                      min={100}
                      step={100}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedElement?.animations?.duration || 600}ms
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Delay (ms)</Label>
                    <Slider
                      value={[selectedElement?.animations?.delay || 0]}
                      onValueChange={([value]) => {
                        if (selectedElement) {
                          onUpdateElement(selectedElement.id, {
                            animations: {
                              type: selectedElement.animations?.type || "none",
                              duration: selectedElement.animations?.duration || 600,
                              delay: value,
                              direction: selectedElement.animations?.direction,
                            }
                          })
                        }
                      }}
                      max={1000}
                      min={0}
                      step={50}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedElement?.animations?.delay || 0}ms
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Code className="w-4 h-4" />
                  Custom CSS
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Custom Styles</Label>
                    <Textarea
                      placeholder="Enter custom CSS properties..."
                      value={currentStyles?.customCSS || ""}
                      onChange={(e) => updateElementStyle("customCSS", e.target.value)}
                      className="bg-sidebar-accent border-sidebar-border min-h-[100px] font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-sidebar-border" />

              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4" />
                  Element Properties
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Lock Element</Label>
                    <Switch
                      checked={selectedElement?.props?.locked || false}
                      onCheckedChange={(checked) => updateElementProps({ locked: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Hide Element</Label>
                    <Switch
                      checked={selectedElement?.props?.hidden || false}
                      onCheckedChange={(checked) => updateElementProps({ hidden: checked })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}