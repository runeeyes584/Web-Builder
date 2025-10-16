export type Breakpoint = "desktop" | "tablet" | "mobile"

export interface ResponsiveStyles {
  desktop?: Record<string, any>
  tablet?: Record<string, any>
  mobile?: Record<string, any>
}

export interface BuilderElement {
  id: string
  type: "heading" | "paragraph" | "image" | "button" | "section" | "grid" | "navigation" | "footer" | "form" | "card" | "quote" | "separator" | "list" | "header" | "sidebar" | "input" | "textarea" | "select" | "checkbox" | "radio" | "switch" | "video" | "audio" | "gallery" | "icon" | "badge" | "avatar" | "modal" | "tooltip" | "dropdown" | "tabs" | "carousel" | "table" | "chart" | "progress" | "timeline" | "stats" | "counter" | "product-card" | "price" | "rating" | "cart" | "checkout" | "social-links" | "contact-info" | "map" | "newsletter" | "team" | "testimonial" | "calendar" | "search-bar" | "filter" | "breadcrumb" | "pagination" | "spinner" | "skeleton" | "alert" | "toast" | "drawer" | "code-block" | "markdown" | "rich-text" | "typography" | "link" | "tag" | "label" | "file-upload" | "file-download" | "pdf-viewer" | "document" | "folder" | "image-gallery" | "video-gallery" | "media-player" | "menu" | "tab-nav" | "side-menu" | "mobile-menu" | "back-button" | "home-button" | "loading" | "progress-ring" | "status-badge" | "notification" | "alert-banner" | "success-message" | "error-message" | "warning-message" | "divider" | "spacer" | "container" | "wrapper" | "flexbox" | "grid-container" | "center" | "stack" | "pricing-table" | "feature-list" | "faq" | "blog-post" | "case-study" | "cta" | "hero" | "about" | "contact-form" | "newsletter-signup" | "login-form" | "registration-form" | "survey-form" | "order-form" | "booking-form" | "feedback-form"
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
  animations?: {
    type: "fadeIn" | "slideIn" | "zoomIn" | "bounce" | "pulse" | "shake" | "none"
    duration: number
    delay: number
    direction?: "up" | "down" | "left" | "right"
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
