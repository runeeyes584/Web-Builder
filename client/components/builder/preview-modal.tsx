"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Breakpoint, BuilderElement, BuilderPage } from "@/lib/builder-types"
import { Monitor, Smartphone, Tablet, X } from "lucide-react"
import { useState, useMemo } from "react"

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  elements: BuilderElement[]
  pages?: BuilderPage[]
}

export function PreviewModal({ isOpen, onClose, elements, pages = [] }: PreviewModalProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>("desktop")
  const [activePageIndex, setActivePageIndex] = useState(0)

  const isMultiPage = pages && pages.length > 0
  const currentElements = isMultiPage ? (pages[activePageIndex]?.elements || []) : elements

  const breakpointWidths = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  }

  const breakpointIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  }

  const getElementStyles = (element: BuilderElement): Record<string, any> => {
    const baseStyles = element.styles || {}
    const responsiveStyles = element.responsiveStyles?.[currentBreakpoint] || {}
    return { ...baseStyles, ...responsiveStyles }
  }

  // Calculate canvas height based on elements positions
  const canvasHeight = useMemo(() => {
    if (currentElements.length === 0) return 600
    const maxBottom = Math.max(
      ...currentElements.map(el => {
        const pos = el.position || { y: 0, height: 50 }
        return pos.y + (pos.height || 50)
      })
    )
    return Math.max(maxBottom + 50, 600) // Add 50px padding at bottom, minimum 600px
  }, [currentElements])

  const renderElement = (element: BuilderElement): React.ReactNode => {
    const styles = getElementStyles(element)
    const position = element.position || { x: 0, y: 0, width: 200, height: 50 }
    const zIndex = element.props?.zIndex ?? 0
    const rotation = element.props?.rotation ?? 0

    // Check if element is hidden
    const isHidden = element.styles.display === "none"
    if (isHidden) return null // Don't render hidden elements in preview

    // Wrapper styles with absolute positioning - CRITICAL for layout preservation
    const wrapperStyles: React.CSSProperties = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      width: position.width,
      height: position.height,
      zIndex: zIndex,
      transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
      transformOrigin: 'center center',
    }

    // Content styles (applied to inner elements)
    const contentStyles: React.CSSProperties = {
      ...styles,
    }

    switch (element.type) {
      case "heading":
        return (
          <h1 key={element.id} style={{ ...wrapperStyles, ...contentStyles }} className="text-foreground">
            {element.content}
          </h1>
        )
      
      case "paragraph":
        return (
          <p key={element.id} style={{ ...wrapperStyles, ...contentStyles }} className="text-foreground text-sm leading-tight">
            {element.content}
          </p>
        )
      
      case "image":
        return (
          <div key={element.id} style={wrapperStyles}>
            {(() => {
              // Ensure preview always reflects current resized dimensions.
              // Width/height are taken from wrapperStyles (element.position) so we strip them from contentStyles.
              const { width, height, maxWidth, maxHeight, ...rest } = contentStyles as any
              return (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={rest}
                >
                  <img
                    src={element.content || "/placeholder.svg" || ""}
                    alt={element.props?.alt || "Preview"}
                    className="w-full h-full object-contain"
                    style={{ objectFit: rest.objectFit || 'contain' }}
                  />
                </div>
              )
            })()}
          </div>
        )
      
      case "video":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center overflow-hidden relative" style={contentStyles}>
              {(() => {
                const videoUrl = element.content || ''

                // YouTube URL detection
                const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
                const youtubeMatch = videoUrl.match(youtubeRegex)

                // Vimeo URL detection
                const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/
                const vimeoMatch = videoUrl.match(vimeoRegex)

                // Facebook URL detection
                const facebookRegex = /facebook\.com\/.*\/videos\/(\d+)|fb\.watch\/([a-zA-Z0-9_-]+)/
                const facebookMatch = videoUrl.match(facebookRegex)

                if (youtubeMatch) {
                  const videoId = youtubeMatch[1]
                  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${element.props?.autoplay ? 1 : 0}&controls=${element.props?.controls !== false ? 1 : 0}&loop=${element.props?.loop ? 1 : 0}${element.props?.loop ? `&playlist=${videoId}` : ''}&rel=0`
                  return (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      style={{ border: 'none', borderRadius: 'inherit' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      title="YouTube video player"
                    />
                  )
                } else if (vimeoMatch) {
                  const videoId = vimeoMatch[1]
                  return (
                    <iframe
                      src={`https://player.vimeo.com/video/${videoId}?autoplay=${element.props?.autoplay ? 1 : 0}&loop=${element.props?.loop ? 1 : 0}`}
                      className="w-full h-full"
                      style={{ border: 'none', borderRadius: 'inherit' }}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title="Vimeo video player"
                    />
                  )
                } else if (facebookMatch) {
                  return (
                    <iframe
                      src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&autoplay=${element.props?.autoplay ? 'true' : 'false'}`}
                      className="w-full h-full"
                      style={{ border: 'none', borderRadius: 'inherit' }}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                      title="Facebook video player"
                    />
                  )
                } else if (videoUrl && (videoUrl.startsWith('blob:') || videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))) {
                  // Direct video URL (uploaded or external)
                  return (
                    <video
                      src={videoUrl}
                      controls={element.props?.controls !== false}
                      autoPlay={element.props?.autoplay || false}
                      loop={element.props?.loop || false}
                      muted={element.props?.muted || false}
                      className="w-full h-full object-cover"
                      style={{ borderRadius: 'inherit' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )
                } else {
                  // Placeholder
                  return (
                    <div className="text-center text-muted-foreground">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <p className="text-sm">Video Player</p>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        )
      
      case "audio":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={contentStyles}>
              {element.content ? (
                <audio
                  src={element.content}
                  controls={element.props?.controls !== false}
                  autoPlay={element.props?.autoplay || false}
                  muted={element.props?.muted || false}
                  loop={element.props?.loop || false}
                  className="w-full"
                  style={{ maxWidth: '100%', outline: 'none' }}
                />
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">Audio Player</p>
                </div>
              )}
            </div>
          </div>
        )
      
      case "button":
        return (
          <button key={element.id} style={{ ...wrapperStyles, ...contentStyles }} className="text-foreground hover:opacity-90 transition-opacity">
            {element.content}
          </button>
        )
      
      case "card":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full" style={contentStyles}>
              <h3 className="mb-2" style={{
                fontSize: element.props?.titleFontSize || "1.125rem",
                fontWeight: element.props?.titleFontWeight || "600",
                textAlign: element.props?.titleTextAlign || "left",
              }}>
                {element.props?.title || "Card Title"}
              </h3>
              <p className="text-sm text-muted-foreground" style={{
                fontSize: element.props?.descriptionFontSize || "0.875rem",
                fontWeight: element.props?.descriptionFontWeight || "400",
                textAlign: element.props?.descriptionTextAlign || "left",
              }}>
                {element.props?.description || element.content}
              </p>
            </div>
          </div>
        )
      
      case "section":
      case "grid":
      case "footer":
      case "header":
      case "navigation":
        return (
          <div key={element.id} style={{ ...wrapperStyles, ...contentStyles }} className="text-foreground">
            {element.content}
          </div>
        )
      
      case "form":
        return (
          <div key={element.id} style={{ ...wrapperStyles, ...contentStyles }} className="text-foreground">
            {element.content}
          </div>
        )
      
      default:
        return (
          <div key={element.id} style={{ ...wrapperStyles, ...contentStyles }} className="text-foreground overflow-hidden">
            {element.content}
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 z-[200]">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Website Preview</DialogTitle>
            <div className="flex items-center gap-2">
              {/* Breakpoint Controls */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((breakpoint) => {
                  const Icon = breakpointIcons[breakpoint]
                  return (
                    <Button
                      key={breakpoint}
                      variant={currentBreakpoint === breakpoint ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentBreakpoint(breakpoint)}
                      className="h-8 w-8 p-0"
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  )
                })}
              </div>
              <Badge variant="outline" className="ml-2">
                {currentBreakpoint}
              </Badge>
            </div>
          </div>
          {isMultiPage && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto">
              {pages.map((page, index) => (
                <Button
                  key={page.id}
                  variant={activePageIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivePageIndex(index)}
                  className="shrink-0"
                >
                  {page.name}
                </Button>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="flex justify-center">
            <div
              className={`${breakpointWidths[currentBreakpoint]} transition-all duration-300 bg-background border border-border rounded-lg shadow-lg overflow-hidden`}
              style={{ minHeight: `${canvasHeight}px` }}
            >
              {/* Preview canvas with absolute positioning - exactly like builder canvas */}
              <div 
                className="relative w-full"
                style={{ height: `${canvasHeight}px` }}
              >
                {currentElements.map(renderElement)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Preview your website as it will appear to visitors</p>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
