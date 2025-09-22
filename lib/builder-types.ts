export type Breakpoint = "desktop" | "tablet" | "mobile"

export interface ResponsiveStyles {
  desktop?: Record<string, any>
  tablet?: Record<string, any>
  mobile?: Record<string, any>
}

export interface BuilderElement {
  id: string
  type: "heading" | "paragraph" | "image" | "button" | "section" | "grid" | "navigation" | "footer" | "form"
  content: string
  styles: Record<string, any>
  responsiveStyles?: ResponsiveStyles
  children?: BuilderElement[]
  props?: Record<string, any>
  position?: {
    x: number
    y: number
    width?: number
    height?: number
  }
}

export interface DragData {
  type: "component" | "element"
  componentType?: string
  elementId?: string
}

export interface DropZone {
  id: string
  parentId?: string
  index: number
}

export const BREAKPOINTS = {
  desktop: { min: 1024, max: Number.POSITIVE_INFINITY, label: "Desktop", icon: "Monitor" },
  tablet: { min: 768, max: 1023, label: "Tablet", icon: "Tablet" },
  mobile: { min: 0, max: 767, label: "Mobile", icon: "Smartphone" },
} as const

export interface SnapSettings {
  enabled: boolean
  gridSize: number
  snapToElements: boolean
  snapDistance: number
}
