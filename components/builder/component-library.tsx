"use client"

import { Card } from "@/components/ui/card"
import type { BuilderElement, DragData } from "@/lib/builder-types"
import { Activity, AlertCircle, AlignLeft, Award, BarChart, Bell, Brush, Calendar, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, Code, CreditCard, DollarSign, Download, File, FileText, Filter, Flag, Folder, FormInput, Grid3X3, Hash, Home, ImageIcon, Info, Layout, Link, List, Lock, Mail, MapPin, Maximize, Menu, MessageSquare, Minimize, Minus, Move, Music, Navigation, Phone, Play, Quote, RotateCcw, Search, Share, ShoppingCart, Smartphone, Sparkles, Square, Star, Tag, Target, ToggleLeft, TrendingUp, Type, Upload, User, Users, Video, X } from "lucide-react"
import React, { useState } from "react"
import { TemplateLibrary } from "./template-library"

const componentCategories = [
  {
    name: "Basic Elements",
    components: [
      { name: "Heading", icon: Type, description: "H1, H2, H3 headings", type: "heading" },
      { name: "Paragraph", icon: AlignLeft, description: "Text content", type: "paragraph" },
      { name: "Image", icon: ImageIcon, description: "Images and media", type: "image" },
      { name: "Button", icon: Square, description: "Interactive buttons", type: "button" },
      { name: "Card", icon: Card, description: "Content cards", type: "card" },
      { name: "Quote", icon: Quote, description: "Blockquotes", type: "quote" },
      { name: "Separator", icon: Layout, description: "Dividers", type: "separator" },
      { name: "List", icon: List, description: "Bulleted lists", type: "list" },
    ],
  },
  {
    name: "Layout",
    components: [
      { name: "Section", icon: Layout, description: "Content sections", type: "section" },
      { name: "Grid", icon: Grid3X3, description: "Grid layouts", type: "grid" },
      { name: "Navigation", icon: Navigation, description: "Nav menus", type: "navigation" },
      { name: "Footer", icon: FileText, description: "Page footers", type: "footer" },
      { name: "Header", icon: Layout, description: "Page headers", type: "header" },
      { name: "Sidebar", icon: Layout, description: "Side panels", type: "sidebar" },
    ],
  },
  {
    name: "Forms & Inputs",
    components: [
      { name: "Form", icon: FormInput, description: "Contact forms", type: "form" },
      { name: "Input", icon: FormInput, description: "Text inputs", type: "input" },
      { name: "Textarea", icon: AlignLeft, description: "Multi-line text", type: "textarea" },
      { name: "Select", icon: ChevronDown, description: "Dropdown menus", type: "select" },
      { name: "Checkbox", icon: Check, description: "Checkboxes", type: "checkbox" },
      { name: "Radio", icon: Circle, description: "Radio buttons", type: "radio" },
      { name: "Switch", icon: ToggleLeft, description: "Toggle switches", type: "switch" },
    ],
  },
  {
    name: "Media & Icons",
    components: [
      { name: "Video", icon: Video, description: "Video players", type: "video" },
      { name: "Audio", icon: Music, description: "Audio players", type: "audio" },
      { name: "Gallery", icon: Camera, description: "Image galleries", type: "gallery" },
      { name: "Icon", icon: Star, description: "Icons", type: "icon" },
      { name: "Badge", icon: Award, description: "Status badges", type: "badge" },
      { name: "Avatar", icon: User, description: "User avatars", type: "avatar" },
    ],
  },
  {
    name: "Interactive",
    components: [
      { name: "Modal", icon: Maximize, description: "Pop-up modals", type: "modal" },
      { name: "Tooltip", icon: Info, description: "Hover tooltips", type: "tooltip" },
      { name: "Dropdown", icon: ChevronDown, description: "Dropdown menus", type: "dropdown" },
      { name: "Tabs", icon: Layout, description: "Tabbed content", type: "tabs" },
      { name: "Accordion", icon: ChevronDown, description: "Collapsible content", type: "accordion" },
      { name: "Carousel", icon: ChevronLeft, description: "Image carousels", type: "carousel" },
    ],
  },
  {
    name: "Data Display",
    components: [
      { name: "Table", icon: Grid3X3, description: "Data tables", type: "table" },
      { name: "Chart", icon: BarChart, description: "Data charts", type: "chart" },
      { name: "Progress", icon: Activity, description: "Progress bars", type: "progress" },
      { name: "Timeline", icon: Clock, description: "Event timelines", type: "timeline" },
      { name: "Stats", icon: TrendingUp, description: "Statistics cards", type: "stats" },
      { name: "Counter", icon: Hash, description: "Number counters", type: "counter" },
    ],
  },
  {
    name: "E-commerce",
    components: [
      { name: "Product Card", icon: ShoppingCart, description: "Product displays", type: "product-card" },
      { name: "Price", icon: DollarSign, description: "Price displays", type: "price" },
      { name: "Rating", icon: Star, description: "Star ratings", type: "rating" },
      { name: "Cart", icon: ShoppingCart, description: "Shopping cart", type: "cart" },
      { name: "Checkout", icon: CreditCard, description: "Checkout forms", type: "checkout" },
    ],
  },
  {
    name: "Social & Contact",
    components: [
      { name: "Social Links", icon: Share, description: "Social media", type: "social-links" },
      { name: "Contact Info", icon: Phone, description: "Contact details", type: "contact-info" },
      { name: "Map", icon: MapPin, description: "Location maps", type: "map" },
      { name: "Newsletter", icon: Mail, description: "Email signup", type: "newsletter" },
      { name: "Team", icon: Users, description: "Team members", type: "team" },
      { name: "Testimonial", icon: Quote, description: "Customer reviews", type: "testimonial" },
    ],
  },
  {
    name: "Advanced UI",
    components: [
      { name: "Calendar", icon: Calendar, description: "Date picker", type: "calendar" },
      { name: "Search Bar", icon: Search, description: "Search input", type: "search-bar" },
      { name: "Filter", icon: Filter, description: "Filter controls", type: "filter" },
      { name: "Breadcrumb", icon: ChevronRight, description: "Navigation breadcrumbs", type: "breadcrumb" },
      { name: "Pagination", icon: ChevronLeft, description: "Page navigation", type: "pagination" },
      { name: "Spinner", icon: RotateCcw, description: "Loading spinner", type: "spinner" },
      { name: "Skeleton", icon: Square, description: "Loading skeleton", type: "skeleton" },
      { name: "Alert", icon: AlertCircle, description: "Alert messages", type: "alert" },
      { name: "Toast", icon: Bell, description: "Toast notifications", type: "toast" },
      { name: "Drawer", icon: Minimize, description: "Side drawer", type: "drawer" },
    ],
  },
  {
    name: "Content & Text",
    components: [
      { name: "Code Block", icon: Code, description: "Code snippets", type: "code-block" },
      { name: "Markdown", icon: FileText, description: "Markdown content", type: "markdown" },
      { name: "Rich Text", icon: Type, description: "Rich text editor", type: "rich-text" },
      { name: "Typography", icon: Brush, description: "Text styles", type: "typography" },
      { name: "Link", icon: Link, description: "External links", type: "link" },
      { name: "Tag", icon: Tag, description: "Content tags", type: "tag" },
      { name: "Label", icon: Flag, description: "Text labels", type: "label" },
    ],
  },
  {
    name: "File & Media",
    components: [
      { name: "File Upload", icon: Upload, description: "File uploader", type: "file-upload" },
      { name: "File Download", icon: Download, description: "Download links", type: "file-download" },
      { name: "PDF Viewer", icon: File, description: "PDF display", type: "pdf-viewer" },
      { name: "Document", icon: FileText, description: "Document viewer", type: "document" },
      { name: "Folder", icon: Folder, description: "Folder structure", type: "folder" },
      { name: "Image Gallery", icon: Camera, description: "Photo gallery", type: "image-gallery" },
      { name: "Video Gallery", icon: Video, description: "Video collection", type: "video-gallery" },
      { name: "Media Player", icon: Play, description: "Media controls", type: "media-player" },
    ],
  },
  {
    name: "Navigation & Menu",
    components: [
      { name: "Menu", icon: Menu, description: "Dropdown menu", type: "menu" },
      { name: "Tab Navigation", icon: Layout, description: "Tab menu", type: "tab-nav" },
      { name: "Side Menu", icon: Layout, description: "Side navigation", type: "side-menu" },
      { name: "Mobile Menu", icon: Smartphone, description: "Mobile nav", type: "mobile-menu" },
      { name: "Back Button", icon: ChevronLeft, description: "Go back", type: "back-button" },
      { name: "Home Button", icon: Home, description: "Home link", type: "home-button" },
    ],
  },
  {
    name: "Feedback & Status",
    components: [
      { name: "Loading", icon: RotateCcw, description: "Loading indicator", type: "loading" },
      { name: "Progress Ring", icon: Circle, description: "Circular progress", type: "progress-ring" },
      { name: "Status Badge", icon: Award, description: "Status indicator", type: "status-badge" },
      { name: "Notification", icon: Bell, description: "Notification bell", type: "notification" },
      { name: "Alert Banner", icon: AlertCircle, description: "Alert banner", type: "alert-banner" },
      { name: "Success Message", icon: Check, description: "Success alert", type: "success-message" },
      { name: "Error Message", icon: X, description: "Error alert", type: "error-message" },
      { name: "Warning Message", icon: AlertCircle, description: "Warning alert", type: "warning-message" },
    ],
  },
  {
    name: "Utility & Tools",
    components: [
      { name: "Divider", icon: Minus, description: "Content divider", type: "divider" },
      { name: "Spacer", icon: Square, description: "Empty space", type: "spacer" },
      { name: "Container", icon: Square, description: "Content wrapper", type: "container" },
      { name: "Wrapper", icon: Layout, description: "Element wrapper", type: "wrapper" },
      { name: "Flexbox", icon: Layout, description: "Flex container", type: "flexbox" },
      { name: "Grid Container", icon: Grid3X3, description: "Grid wrapper", type: "grid-container" },
      { name: "Center", icon: Circle, description: "Centered content", type: "center" },
      { name: "Stack", icon: Layout, description: "Vertical stack", type: "stack" },
    ],
  },
  {
    name: "Business & Marketing",
    components: [
      { name: "Pricing Table", icon: DollarSign, description: "Pricing plans", type: "pricing-table" },
      { name: "Feature List", icon: Check, description: "Feature highlights", type: "feature-list" },
      { name: "FAQ", icon: Info, description: "Frequently asked questions", type: "faq" },
      { name: "Blog Post", icon: FileText, description: "Blog article", type: "blog-post" },
      { name: "Case Study", icon: BarChart, description: "Success stories", type: "case-study" },
      { name: "Call to Action", icon: Target, description: "CTA sections", type: "cta" },
      { name: "Hero Section", icon: Star, description: "Landing hero", type: "hero" },
      { name: "About Section", icon: Users, description: "About us", type: "about" },
    ],
  },
  {
    name: "Forms & Validation",
    components: [
      { name: "Contact Form", icon: Mail, description: "Contact us form", type: "contact-form" },
      { name: "Newsletter Signup", icon: Mail, description: "Email subscription", type: "newsletter-signup" },
      { name: "Login Form", icon: Lock, description: "User login", type: "login-form" },
      { name: "Registration Form", icon: User, description: "User signup", type: "registration-form" },
      { name: "Survey Form", icon: BarChart, description: "Feedback survey", type: "survey-form" },
      { name: "Order Form", icon: ShoppingCart, description: "Order placement", type: "order-form" },
      { name: "Booking Form", icon: Calendar, description: "Appointment booking", type: "booking-form" },
      { name: "Feedback Form", icon: MessageSquare, description: "User feedback", type: "feedback-form" },
    ],
  },
]

interface ComponentLibraryProps {
  onAddTemplate?: (elements: BuilderElement[]) => void
}

export function ComponentLibrary({ onAddTemplate }: ComponentLibraryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    const dragData: DragData = {
      type: "component",
      componentType,
    }
    e.dataTransfer.setData("application/json", JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = "copy"
  }

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

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
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-sidebar-accent/50 border border-sidebar-border/30 rounded-lg text-xs text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 focus:bg-sidebar-accent/70 transition-all duration-200"
          />
        </div>
      </div>

      {/* Compact Categories */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="p-3 space-y-2">
          {componentCategories.map((category, categoryIndex) => {
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
                        <Card
                          key={component.name}
                          className="group relative p-3 cursor-grab hover:bg-gradient-to-r hover:from-sidebar-accent/80 hover:to-sidebar-accent/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-sidebar-border/30 bg-gradient-to-r from-sidebar-accent/30 to-sidebar-accent/15 backdrop-blur-sm active:cursor-grabbing hover:border-primary/40 hover:ring-1 hover:ring-primary/20"
                          draggable
                          onDragStart={(e) => handleDragStart(e, component.type)}
                          style={{ animationDelay: `${(categoryIndex * 50) + (componentIndex * 30)}ms` }}
                        >
                          <div className="relative flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:via-primary/25 group-hover:to-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                              <component.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-sidebar-foreground group-hover:text-primary transition-colors duration-300 mb-1">
                                {component.name}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed group-hover:text-muted-foreground/80 transition-colors duration-300">
                                {component.description}
                              </p>
                            </div>
                            
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                              <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                                <Move className="w-3 h-3 text-primary" />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
}
