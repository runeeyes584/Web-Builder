"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Breakpoint, BuilderElement, BuilderPage } from "@/lib/builder-types"
import { Monitor, Smartphone, Tablet, X } from "lucide-react"
import { useMemo, useState } from "react"

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

  // Canvas reference width (same as builder canvas default)
  const CANVAS_REFERENCE_WIDTH = 1200

  // Calculate scale factor for responsive breakpoints
  const getScaleFactor = (breakpoint: Breakpoint): number => {
    switch (breakpoint) {
      case "tablet":
        return 768 / CANVAS_REFERENCE_WIDTH // ~0.64
      case "mobile":
        return 375 / CANVAS_REFERENCE_WIDTH // ~0.3125
      default:
        return 1 // desktop - no scaling
    }
  }

  const scaleFactor = getScaleFactor(currentBreakpoint)

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

  // Scaled canvas height for responsive preview
  const scaledCanvasHeight = canvasHeight * scaleFactor

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
        const handleButtonClick = () => {
          if (element.props?.href) {
            const url = element.props.href
            // Ensure URL has protocol
            const finalUrl = url.startsWith('http://') || url.startsWith('https://')
              ? url
              : `https://${url}`

            if (element.props?.openInNewTab) {
              window.open(finalUrl, '_blank', 'noopener,noreferrer')
            } else {
              window.location.href = finalUrl
            }
          }
        }
        return (
          <button
            key={element.id}
            style={{ ...wrapperStyles, ...contentStyles }}
            className="text-foreground hover:opacity-90 transition-opacity cursor-pointer"
            onClick={handleButtonClick}
          >
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

      case "table":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg overflow-hidden" style={contentStyles}>
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {Array.from({ length: element.props?.columns || 3 }, (_, i) => (
                      <th
                        key={i}
                        className="p-2 text-left"
                        style={{
                          fontFamily: element.props?.headerFontFamily === "default" || element.props?.headerFontFamily === "inherit" ? undefined : element.props?.headerFontFamily,
                          fontSize: element.props?.headerFontSize ? `${element.props.headerFontSize}px` : undefined,
                          fontWeight: element.props?.headerFontWeight === "default" || element.props?.headerFontWeight === "inherit" ? undefined : element.props?.headerFontWeight,
                          color: element.props?.headerTextColor || undefined
                        }}
                      >
                        {element.props?.tableData?.headers?.[i] || `Header ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: element.props?.rows || 4 }, (_, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-border">
                      {Array.from({ length: element.props?.columns || 3 }, (_, colIndex) => (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className="p-2"
                          style={{
                            fontFamily: element.props?.contentFontFamily === "default" || element.props?.contentFontFamily === "inherit" ? undefined : element.props?.contentFontFamily,
                            fontSize: element.props?.contentFontSize ? `${element.props.contentFontSize}px` : undefined,
                            fontWeight: element.props?.contentFontWeight === "default" || element.props?.contentFontWeight === "inherit" ? undefined : element.props?.contentFontWeight,
                            color: element.props?.contentTextColor || undefined
                          }}
                        >
                          {element.props?.tableData?.rows?.[rowIndex]?.[colIndex] || `Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "timeline":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={contentStyles}>
              <div className="space-y-4">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{
                    fontFamily: element.props?.titleFontFamily || undefined,
                    fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : undefined,
                    fontWeight: element.props?.titleFontWeight || undefined,
                    color: element.props?.titleTextColor || undefined,
                  }}
                >
                  {element.content || "Timeline"}
                </h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

                  {/* Timeline events */}
                  {Array.from({ length: element.props?.eventCount || 4 }, (_, index) => (
                    <div key={index} className="relative flex items-start gap-4 pb-6">
                      {/* Event dot */}
                      <div
                        className="w-3 h-3 bg-primary rounded-full mt-1 flex-shrink-0 z-10"
                        style={{
                          backgroundColor: element.props?.timelineEvents?.[index]?.dotColor || undefined,
                        }}
                      ></div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-sm font-medium"
                          style={{
                            fontFamily: element.props?.eventTitleFontFamily || undefined,
                            fontSize: element.props?.eventTitleFontSize ? `${element.props.eventTitleFontSize}px` : undefined,
                            fontWeight: element.props?.eventTitleFontWeight || undefined,
                            color: element.props?.eventTitleTextColor || undefined,
                          }}
                        >
                          {element.props?.timelineEvents?.[index]?.title || `Event ${index + 1}`}
                        </h4>
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          style={{
                            fontFamily: element.props?.descriptionFontFamily || undefined,
                            fontSize: element.props?.descriptionFontSize ? `${element.props.descriptionFontSize}px` : undefined,
                            fontWeight: element.props?.descriptionFontWeight || undefined,
                            color: element.props?.descriptionTextColor || undefined,
                          }}
                        >
                          {element.props?.timelineEvents?.[index]?.description || `Description for event ${index + 1}`}
                        </p>
                        {element.props?.timelineEvents?.[index]?.date && (
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            style={{
                              fontFamily: element.props?.dateFontFamily || undefined,
                              fontSize: element.props?.dateFontSize ? `${element.props.dateFontSize}px` : undefined,
                              fontWeight: element.props?.dateFontWeight || undefined,
                              color: element.props?.dateTextColor || undefined,
                            }}
                          >
                            {element.props.timelineEvents[index].date}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "chart":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex flex-col p-4" style={contentStyles}>
              <div className="text-center mb-4">
                <h3 className="text-sm font-medium">{element.content || "Chart"}</h3>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {element.props?.chartType === "bar" && (
                  <div className="w-full h-full flex items-end justify-center gap-2 p-4">
                    {(element.props?.chartData || Array.from({ length: element.props?.dataPoints || 5 }, (_, i) => ({ label: `Item ${i + 1}`, value: Math.random() * 100 }))).map((data: any, index: number) => {
                      const maxValue = Math.max(...(element.props?.chartData || []).map((d: any) => d.value || 0), 1)
                      const height = `${(data.value / maxValue) * 80}%`
                      return (
                        <div key={index} className="flex flex-col items-center gap-1">
                          <div
                            className="bg-primary rounded-t w-8 transition-all duration-300"
                            style={{ height: height || "20%" }}
                          />
                          <span className="text-xs text-muted-foreground">{data.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {element.props?.chartType === "line" && (
                  <div className="w-full h-full relative p-4">
                    <svg className="w-full h-full" viewBox="0 0 300 200">
                      {element.props?.showGrid && (
                        <defs>
                          <pattern id={`grid-${element.id}`} width="30" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                          </pattern>
                        </defs>
                      )}
                      {element.props?.showGrid && <rect width="100%" height="100%" fill={`url(#grid-${element.id})`} />}
                      {(element.props?.chartData || []).length > 1 && (
                        <>
                          <polyline
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            points={(element.props?.chartData || []).map((data: any, index: number) => {
                              const x = (index / Math.max(1, (element.props?.chartData || []).length - 1)) * 280 + 10
                              const y = 190 - ((data.value || 0) / Math.max(1, Math.max(...(element.props?.chartData || []).map((d: any) => d.value || 0)))) * 160
                              return `${x},${y}`
                            }).join(' ')}
                          />
                          {(element.props?.chartData || []).map((data: any, index: number) => {
                            const x = (index / Math.max(1, (element.props?.chartData || []).length - 1)) * 280 + 10
                            const y = 190 - ((data.value || 0) / Math.max(1, Math.max(...(element.props?.chartData || []).map((d: any) => d.value || 0)))) * 160
                            return (
                              <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="3"
                                fill="hsl(var(--primary))"
                              />
                            )
                          })}
                        </>
                      )}
                    </svg>
                  </div>
                )}
                {element.props?.chartType === "pie" && (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <svg className="w-32 h-32" viewBox="0 0 100 100">
                      {(element.props?.chartData || []).map((data: any, index: number) => {
                        const total = (element.props?.chartData || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0)
                        const percentage = total > 0 ? (data.value || 0) / total : 0
                        const angle = percentage * 360
                        const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]
                        const color = colors[index % colors.length]

                        let startAngle = 0
                        for (let i = 0; i < index; i++) {
                          const prevData = (element.props?.chartData || [])[i]
                          const prevPercentage = total > 0 ? (prevData?.value || 0) / total : 0
                          startAngle += prevPercentage * 360
                        }

                        const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180)
                        const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180)
                        const x2 = 50 + 40 * Math.cos((startAngle + angle - 90) * Math.PI / 180)
                        const y2 = 50 + 40 * Math.sin((startAngle + angle - 90) * Math.PI / 180)
                        const largeArcFlag = angle > 180 ? 1 : 0

                        return (
                          <path
                            key={index}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={color}
                          />
                        )
                      })}
                    </svg>
                  </div>
                )}
                {element.props?.chartType === "doughnut" && (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <svg className="w-32 h-32" viewBox="0 0 100 100">
                      {(element.props?.chartData || []).map((data: any, index: number) => {
                        const total = (element.props?.chartData || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0)
                        const percentage = total > 0 ? (data.value || 0) / total : 0
                        const angle = percentage * 360
                        const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]
                        const color = colors[index % colors.length]

                        let startAngle = 0
                        for (let i = 0; i < index; i++) {
                          const prevData = (element.props?.chartData || [])[i]
                          const prevPercentage = total > 0 ? (prevData?.value || 0) / total : 0
                          startAngle += prevPercentage * 360
                        }

                        const radius = 30
                        const innerRadius = 15
                        const x1 = 50 + radius * Math.cos((startAngle - 90) * Math.PI / 180)
                        const y1 = 50 + radius * Math.sin((startAngle - 90) * Math.PI / 180)
                        const x2 = 50 + radius * Math.cos((startAngle + angle - 90) * Math.PI / 180)
                        const y2 = 50 + radius * Math.sin((startAngle + angle - 90) * Math.PI / 180)
                        const x3 = 50 + innerRadius * Math.cos((startAngle + angle - 90) * Math.PI / 180)
                        const y3 = 50 + innerRadius * Math.sin((startAngle + angle - 90) * Math.PI / 180)
                        const x4 = 50 + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180)
                        const y4 = 50 + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180)
                        const largeArcFlag = angle > 180 ? 1 : 0

                        return (
                          <path
                            key={index}
                            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`}
                            fill={color}
                          />
                        )
                      })}
                    </svg>
                  </div>
                )}
                {!element.props?.chartType && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">Chart</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case "progress":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full flex flex-col justify-center p-4" style={contentStyles}>
              {element.props?.showLabel !== false && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{element.content || "Progress"}</span>
                  <span className="text-sm text-muted-foreground">{element.props?.value || 50}%</span>
                </div>
              )}
              <div
                className="w-full bg-muted rounded-full overflow-hidden"
                style={{ height: `${element.props?.thickness || 8}px` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${element.props?.value || 50}%`,
                    backgroundColor: element.props?.progressColor || "#3b82f6",
                  }}
                />
              </div>
            </div>
          </div>
        )

      case "stats":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={contentStyles}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                {Array.from({ length: element.props?.statCount || 3 }, (_, index) => {
                  const stat = element.props?.stats?.[index] || {}
                  return (
                    <div key={index} className="bg-muted/50 border border-border rounded-lg p-4 text-center flex flex-col justify-center">
                      <div
                        className="text-2xl font-bold text-primary mb-2"
                        style={{
                          fontFamily: element.props?.valueFontFamily || undefined,
                          fontSize: element.props?.valueFontSize ? `${element.props.valueFontSize}px` : undefined,
                          fontWeight: element.props?.valueFontWeight || undefined,
                          color: element.props?.valueTextColor || undefined,
                        }}
                      >
                        {stat.value || `${(index + 1) * 1000}`}
                      </div>
                      <div
                        className="text-sm text-muted-foreground"
                        style={{
                          fontFamily: element.props?.labelFontFamily || undefined,
                          fontSize: element.props?.labelFontSize ? `${element.props.labelFontSize}px` : undefined,
                          fontWeight: element.props?.labelFontWeight || undefined,
                          color: element.props?.labelTextColor || undefined,
                        }}
                      >
                        {stat.label || `Stat ${index + 1}`}
                      </div>
                      {stat.description && (
                        <div
                          className="text-xs text-muted-foreground mt-1"
                          style={{
                            fontFamily: element.props?.descriptionFontFamily || undefined,
                            fontSize: element.props?.descriptionFontSize ? `${element.props.descriptionFontSize}px` : undefined,
                            fontWeight: element.props?.descriptionFontWeight || undefined,
                            color: element.props?.descriptionTextColor || undefined,
                          }}
                        >
                          {stat.description}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case "counter":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full flex flex-col items-center justify-center p-4" style={contentStyles}>
              <div
                className="text-4xl font-bold text-primary mb-2"
                style={{
                  fontFamily: element.props?.valueFontFamily || undefined,
                  fontSize: element.props?.valueFontSize ? `${element.props.valueFontSize}px` : undefined,
                  fontWeight: element.props?.valueFontWeight || undefined,
                  color: element.props?.valueTextColor || undefined,
                }}
              >
                {element.props?.prefix || ""}{(element.props?.targetValue || 1000).toLocaleString()}{element.props?.suffix || ""}
              </div>
              {element.props?.showLabel !== false && (
                <div
                  className="text-sm text-muted-foreground"
                  style={{
                    fontFamily: element.props?.labelFontFamily || undefined,
                    fontSize: element.props?.labelFontSize ? `${element.props.labelFontSize}px` : undefined,
                    fontWeight: element.props?.labelFontWeight || undefined,
                    color: element.props?.labelTextColor || undefined,
                  }}
                >
                  {element.content || "Counter"}
                </div>
              )}
            </div>
          </div>
        )

      case "carousel":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full bg-card border border-border rounded-lg overflow-hidden relative" style={contentStyles}>
              <div className="w-full h-full flex items-center justify-center bg-muted">
                {element.props?.uploadedImages?.[0] ? (
                  <img
                    src={element.props.uploadedImages[0]}
                    alt="Carousel slide"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm">Carousel ({element.props?.slideCount || 5} slides)</p>
                  </div>
                )}
              </div>
              {/* Carousel indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {Array.from({ length: element.props?.slideCount || 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-primary/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case "tabs":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full bg-card border border-border rounded-lg p-4" style={contentStyles}>
              <div className="flex border-b border-border mb-4">
                {Array.from({ length: element.props?.tabCount || 3 }, (_, i) => (
                  <button
                    key={i}
                    className={`px-4 py-2 text-sm font-medium ${i === 0 ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                  >
                    {element.props?.tabs?.[i]?.label || `Tab ${i + 1}`}
                  </button>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {element.props?.tabs?.[0]?.content || "Tab content here..."}
              </div>
            </div>
          </div>
        )

      case "quote":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full bg-card border-l-4 border-primary p-4 italic" style={contentStyles}>
              <p className="text-foreground mb-2">{element.content || "Quote text here..."}</p>
              {element.props?.author && (
                <cite className="text-sm text-muted-foreground">— {element.props.author}</cite>
              )}
            </div>
          </div>
        )

      case "separator":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full flex items-center justify-center"
              style={contentStyles}
            >
              <div
                className={`${element.props?.orientation === 'vertical' ? 'h-full w-px' : 'w-full h-px'} bg-border`}
                style={{
                  backgroundColor: element.props?.color || undefined,
                }}
              />
            </div>
          </div>
        )

      case "list":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full p-2" style={contentStyles}>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                {(element.props?.items || ["Item 1", "Item 2", "Item 3"]).map((item: string, i: number) => (
                  <li key={i} className="text-sm">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )

      case "icon":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              {element.props?.iconImage ? (
                <img
                  src={element.props.iconImage}
                  alt={element.props?.iconFileName || 'Icon'}
                  style={{
                    width: `${element.props?.size || 24}px`,
                    height: `${element.props?.size || 24}px`,
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <span style={{ fontSize: `${element.props?.size || 24}px`, color: contentStyles.color }}>
                  {element.content || "★"}
                </span>
              )}
            </div>
          </div>
        )

      case "badge":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full flex items-center justify-center"
              style={contentStyles}
            >
              <span
                className="inline-flex items-center justify-center"
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontFamily: contentStyles.fontFamily,
                  fontSize: contentStyles.fontSize,
                  fontWeight: contentStyles.fontWeight,
                  backgroundColor: element.props?.variant === 'outline' ? 'transparent' :
                    (element.props?.variant === 'secondary' ? 'var(--secondary)' :
                      element.props?.variant === 'destructive' ? 'var(--destructive)' : 'var(--primary)'),
                  color: element.props?.variant === 'outline' ? 'var(--foreground)' :
                    (element.props?.variant === 'secondary' ? 'var(--secondary-foreground)' :
                      element.props?.variant === 'destructive' ? 'var(--destructive-foreground)' : 'var(--primary-foreground)'),
                  border: element.props?.variant === 'outline' ? '1px solid var(--border)' : undefined,
                }}
              >
                {element.content || "Badge"}
              </span>
            </div>
          </div>
        )

      case "avatar":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full flex items-center justify-center"
              style={contentStyles}
            >
              {element.props?.src ? (
                <img
                  src={element.props.src}
                  alt={element.content || "Avatar"}
                  className="object-cover"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                  }}
                />
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: contentStyles.backgroundColor || 'var(--muted)',
                    fontSize: `${(position.height || 60) * 0.4}px`,
                    color: contentStyles.color || 'var(--foreground)',
                  }}
                >
                  {element.content || '👤'}
                </div>
              )}
            </div>
          </div>
        )

      case "product-card":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg overflow-hidden" style={contentStyles}>
              <div
                className="bg-muted flex items-center justify-center overflow-hidden"
                style={{ height: `${element.props?.imageHeight || 40}%` }}
              >
                {element.props?.imageUrl ? (
                  <img src={element.props.imageUrl} alt={element.content} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1" style={{
                  fontFamily: element.props?.productNameFontFamily || undefined,
                  fontSize: element.props?.productNameFontSize ? `${element.props.productNameFontSize}px` : undefined,
                  fontWeight: element.props?.productNameFontWeight || undefined,
                  color: element.props?.productNameColor || undefined,
                }}>
                  {element.content || "Product Name"}
                </h3>
                <p className="text-xs text-muted-foreground mb-2" style={{
                  fontFamily: element.props?.descriptionFontFamily || undefined,
                  fontSize: element.props?.descriptionFontSize ? `${element.props.descriptionFontSize}px` : undefined,
                  color: element.props?.descriptionColor || undefined,
                }}>
                  {element.props?.description || "Product description"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary" style={{
                    fontFamily: element.props?.priceFontFamily || undefined,
                    fontSize: element.props?.priceFontSize ? `${element.props.priceFontSize}px` : undefined,
                    color: element.props?.priceColor || undefined,
                  }}>
                    ${element.props?.price || "99.99"}
                  </span>
                  <button className="px-2 py-1 text-xs rounded" style={{
                    backgroundColor: element.props?.buttonBackgroundColor || "#3b82f6",
                    color: element.props?.buttonTextColor || "#ffffff",
                  }}>
                    {element.props?.buttonText || "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "price":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              <span style={{
                fontFamily: element.props?.priceFontFamily || undefined,
                fontSize: element.props?.priceFontSize ? `${element.props.priceFontSize}px` : "24px",
                fontWeight: element.props?.priceFontWeight || "700",
                color: element.props?.priceTextColor || undefined,
              }}>
                {(() => {
                  const currency = element.props?.currency || "USD"
                  const amount = element.props?.priceAmount || element.content || "99.99"
                  const period = element.props?.period || ""
                  const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", VND: "₫" }
                  const symbol = currencySymbols[currency] || "$"
                  return `${symbol}${amount}${period}`
                })()}
              </span>
            </div>
          </div>
        )

      case "rating":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={contentStyles}>
              <div className="flex items-center justify-center gap-1 mb-3">
                {Array.from({ length: element.props?.maxStars || 5 }).map((_, index) => {
                  const value = element.props?.value || 4
                  const isFilled = index < Math.floor(value)
                  return (
                    <svg key={index} className={`w-6 h-6 ${isFilled ? "text-yellow-400" : "text-muted-foreground/30"}`} fill={isFilled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )
                })}
              </div>
              {element.props?.showComment !== false && (
                <textarea placeholder={element.props?.commentPlaceholder || "Write your review..."} className="w-full px-3 py-2 border border-border rounded bg-background resize-none text-sm" rows={3} disabled />
              )}
              {element.props?.showSubmitButton !== false && (
                <button className="w-full mt-3 px-4 py-2 rounded text-sm" style={{ backgroundColor: element.props?.buttonBackgroundColor || "#3b82f6", color: element.props?.buttonTextColor || "#ffffff" }}>
                  {element.props?.submitButtonText || "Submit Review"}
                </button>
              )}
            </div>
          </div>
        )

      case "cart":
        return (
          <button key={element.id} style={{ ...wrapperStyles, ...contentStyles, backgroundColor: element.props?.cartBackgroundColor || "#3b82f6", color: element.props?.cartTextColor || "#ffffff" }} className="rounded-lg">
            {element.content}
          </button>
        )

      case "checkout":
        return (
          <button key={element.id} style={{ ...wrapperStyles, ...contentStyles, backgroundColor: element.props?.checkoutBackgroundColor || "#3b82f6", color: element.props?.checkoutTextColor || "#ffffff" }} className="rounded-lg font-semibold">
            {element.content}
          </button>
        )

      case "social-links":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg flex items-center justify-center p-4" style={contentStyles}>
              <div className="flex gap-2">
                {(element.props?.socialLinks || [{ platform: "Facebook", url: "#" }, { platform: "Twitter", url: "#" }]).map((link: any, index: number) => (
                  <div key={index} className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "contact-info":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={contentStyles}>
              <div className="space-y-2">
                {element.props?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{element.props.phone}</span>
                  </div>
                )}
                {element.props?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{element.props.email}</span>
                  </div>
                )}
                {element.props?.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{element.props.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case "map":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg overflow-hidden" style={contentStyles}>
              {element.props?.mapUrl ? (
                <iframe src={element.props.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title={element.content || "Map Location"} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center p-4">
                    <svg className="w-8 h-8 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs text-muted-foreground">Map Location</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case "newsletter":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={contentStyles}>
              <div className="text-center">
                <h3 className="font-semibold text-sm mb-2" style={{
                  fontFamily: element.props?.titleFontFamily || undefined,
                  fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : undefined,
                  color: element.props?.titleTextColor || undefined,
                }}>
                  {element.content || "Subscribe to Newsletter"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">{element.props?.subtitle || "Get updates delivered to your inbox"}</p>
                <div className="flex gap-2">
                  <input type="email" placeholder={element.props?.inputPlaceholder || "Enter email"} className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background" />
                  <button className="px-3 py-1 text-xs rounded" style={{ backgroundColor: element.props?.buttonBackgroundColor || "#3b82f6", color: element.props?.buttonTextColor || "#ffffff" }}>
                    {element.props?.buttonText || "Subscribe"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "team":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg overflow-hidden" style={contentStyles}>
              <div className="bg-muted flex items-center justify-center" style={{ height: `${element.props?.imageHeight || 40}%` }}>
                {element.props?.memberImage ? (
                  <img src={element.props.memberImage} alt={element.content || "Team Member"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3 text-center">
                <h3 className="font-semibold text-sm mb-1">{element.content || "Team Member"}</h3>
                <p className="text-xs text-muted-foreground">{element.props?.role || "Team Member"}</p>
              </div>
            </div>
          </div>
        )

      case "testimonial":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg shadow-lg p-4" style={contentStyles}>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                  </svg>
                </div>
                <p className="text-sm italic mb-2">"{element.content || "Customer Review"}"</p>
                <div className="text-xs font-medium text-muted-foreground">{element.props?.customerName || "Customer Name"}</div>
                {element.props?.customerTitle && (
                  <div className="text-xs text-muted-foreground/80 mt-1">{element.props.customerTitle}</div>
                )}
              </div>
            </div>
          </div>
        )

      case "newsletter-signup":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                <h3
                  className="w-full"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize || '14px',
                    fontWeight: element.props?.titleFontWeight || '500',
                    textAlign: element.props?.titleAlign || 'center',
                    color: element.props?.titleColor || '#ffffff'
                  }}
                >
                  {element.content || "Newsletter Signup"}
                </h3>
                <p
                  className="w-full"
                  style={{
                    fontFamily: element.props?.descriptionFontFamily || 'inherit',
                    fontSize: element.props?.descriptionFontSize || '12px',
                    fontWeight: element.props?.descriptionFontWeight || '400',
                    color: element.props?.descriptionColor || '#9ca3af',
                    textAlign: element.props?.titleAlign || 'center'
                  }}
                >
                  {element.props?.description || "Stay updated with our latest news"}
                </p>
                <div className="flex gap-2 w-full">
                  <input
                    type="email"
                    placeholder={element.props?.emailPlaceholder || "Enter email"}
                    className="flex-1 border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <button
                    className="rounded"
                    style={{
                      padding: element.props?.buttonPadding || '8px 12px',
                      fontSize: element.props?.buttonFontSize || '12px',
                      borderRadius: element.props?.buttonBorderRadius || '4px',
                      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                      color: element.props?.buttonTextColor || '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {element.props?.buttonText || "Subscribe"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "login-form":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="w-full h-full space-y-3">
                <h3
                  className="w-full"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize || '14px',
                    fontWeight: element.props?.titleFontWeight || '500',
                    textAlign: element.props?.titleAlign || 'left',
                    color: element.props?.titleColor || '#ffffff'
                  }}
                >
                  {element.content || "Login Form"}
                </h3>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder={element.props?.emailPlaceholder || "Email"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="password"
                    placeholder={element.props?.passwordPlaceholder || "Password"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <button
                    className="w-full rounded"
                    style={{
                      padding: element.props?.buttonPadding || '8px 12px',
                      fontSize: element.props?.buttonFontSize || '12px',
                      borderRadius: element.props?.buttonBorderRadius || '4px',
                      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                      color: element.props?.buttonTextColor || '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {element.props?.submitText || "Login"}
                  </button>
                  <div
                    className="text-xs text-center"
                    style={{ color: element.props?.forgotPasswordColor || '#9ca3af' }}
                  >
                    {element.props?.forgotPasswordText || "Forgot password?"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "registration-form":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="w-full h-full space-y-2">
                <h3
                  className="w-full"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize || '14px',
                    fontWeight: element.props?.titleFontWeight || '500',
                    textAlign: element.props?.titleAlign || 'left',
                    color: element.props?.titleColor || '#ffffff'
                  }}
                >
                  {element.content || "Registration Form"}
                </h3>
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder={element.props?.fullNamePlaceholder || "Full Name"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="email"
                    placeholder={element.props?.emailPlaceholder || "Email"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="password"
                    placeholder={element.props?.passwordPlaceholder || "Password"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="password"
                    placeholder={element.props?.confirmPasswordPlaceholder || "Confirm Password"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <button
                    className="w-full rounded"
                    style={{
                      padding: element.props?.buttonPadding || '8px 12px',
                      fontSize: element.props?.buttonFontSize || '12px',
                      borderRadius: element.props?.buttonBorderRadius || '4px',
                      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                      color: element.props?.buttonTextColor || '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {element.props?.submitText || "Register"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "survey-form":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="w-full h-full space-y-3">
                <h3
                  className="w-full"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize || '14px',
                    fontWeight: element.props?.titleFontWeight || '500',
                    textAlign: element.props?.titleAlign || 'left',
                    color: element.props?.titleColor || '#ffffff'
                  }}
                >
                  {element.content || "Survey Form"}
                </h3>
                <div className="space-y-2">
                  <div
                    className="font-medium"
                    style={{
                      fontFamily: element.props?.questionFontFamily || 'inherit',
                      fontSize: element.props?.questionFontSize || '12px',
                      fontWeight: element.props?.questionFontWeight || '500',
                      color: element.props?.questionColor || '#ffffff'
                    }}
                  >
                    {element.props?.question || "How satisfied are you?"}
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        className="border rounded"
                        style={{
                          fontFamily: element.props?.ratingButtonFontFamily || 'inherit',
                          width: element.props?.ratingButtonSize || '24px',
                          height: element.props?.ratingButtonSize || '24px',
                          fontSize: element.props?.ratingButtonFontSize || '12px',
                          fontWeight: element.props?.ratingButtonFontWeight || '400',
                          borderColor: element.props?.ratingButtonBorderColor || '#374151',
                          backgroundColor: element.props?.ratingButtonBackgroundColor || '#1f2937',
                          color: element.props?.ratingButtonTextColor || '#ffffff'
                        }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder={element.props?.commentsPlaceholder || "Additional comments"}
                    className="w-full border resize-none"
                    style={{
                      fontFamily: element.props?.textareaFontFamily || 'inherit',
                      padding: element.props?.textareaPadding || '8px 12px',
                      fontSize: element.props?.textareaFontSize || '12px',
                      fontWeight: element.props?.textareaFontWeight || '400',
                      borderRadius: element.props?.textareaBorderRadius || '4px',
                      borderColor: element.props?.textareaBorderColor || '#374151',
                      backgroundColor: element.props?.textareaBackgroundColor || '#1f2937',
                      color: element.props?.textareaTextColor || '#ffffff',
                      height: element.props?.textareaHeight || '48px'
                    }}
                    disabled
                  />
                  <button
                    className="w-full rounded"
                    style={{
                      padding: element.props?.buttonPadding || '8px 12px',
                      fontSize: element.props?.buttonFontSize || '12px',
                      borderRadius: element.props?.buttonBorderRadius || '4px',
                      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                      color: element.props?.buttonTextColor || '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {element.props?.submitText || "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "order-form":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="w-full h-full space-y-3">
                <h3
                  className="w-full"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize || '14px',
                    fontWeight: element.props?.titleFontWeight || '500',
                    textAlign: element.props?.titleAlign || 'left',
                    color: element.props?.titleColor || '#ffffff'
                  }}
                >
                  {element.content || "Order Form"}
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder={element.props?.productNamePlaceholder || "Product Name"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="number"
                    placeholder={element.props?.quantityPlaceholder || "Quantity"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="text"
                    placeholder={element.props?.shippingAddressPlaceholder || "Shipping Address"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <button
                    className="w-full rounded"
                    style={{
                      padding: element.props?.buttonPadding || '8px 12px',
                      fontSize: element.props?.buttonFontSize || '12px',
                      borderRadius: element.props?.buttonBorderRadius || '4px',
                      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                      color: element.props?.buttonTextColor || '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {element.props?.submitText || "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "booking-form":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="w-full h-full space-y-3">
                <h3
                  className="w-full"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize || '14px',
                    fontWeight: element.props?.titleFontWeight || '500',
                    textAlign: element.props?.titleAlign || 'left',
                    color: element.props?.titleColor || '#ffffff'
                  }}
                >
                  {element.content || "Booking Form"}
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder={element.props?.namePlaceholder || "Your Name"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="date"
                    placeholder={element.props?.datePlaceholder || "Select Date"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="time"
                    placeholder={element.props?.timePlaceholder || "Select Time"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <button
                    className="w-full rounded"
                    style={{
                      padding: element.props?.buttonPadding || '8px 12px',
                      fontSize: element.props?.buttonFontSize || '12px',
                      borderRadius: element.props?.buttonBorderRadius || '4px',
                      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                      color: element.props?.buttonTextColor || '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {element.props?.submitText || "Book Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "feedback-form":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="w-full h-full space-y-3">
                <h3
                  className="w-full"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize || '14px',
                    fontWeight: element.props?.titleFontWeight || '500',
                    textAlign: element.props?.titleAlign || 'left',
                    color: element.props?.titleColor || '#ffffff'
                  }}
                >
                  {element.content || "Feedback Form"}
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder={element.props?.namePlaceholder || "Your Name"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="email"
                    placeholder={element.props?.emailPlaceholder || "Email"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <textarea
                    placeholder={element.props?.feedbackPlaceholder || "Your feedback"}
                    className="w-full border resize-none"
                    style={{
                      fontFamily: element.props?.textareaFontFamily || 'inherit',
                      padding: element.props?.textareaPadding || '8px 12px',
                      fontSize: element.props?.textareaFontSize || '12px',
                      fontWeight: element.props?.textareaFontWeight || '400',
                      borderRadius: element.props?.textareaBorderRadius || '4px',
                      borderColor: element.props?.textareaBorderColor || '#374151',
                      backgroundColor: element.props?.textareaBackgroundColor || '#1f2937',
                      color: element.props?.textareaTextColor || '#ffffff',
                      height: element.props?.textareaHeight || '60px'
                    }}
                    disabled
                  />
                  <button
                    className="w-full rounded"
                    style={{
                      padding: element.props?.buttonPadding || '8px 12px',
                      fontSize: element.props?.buttonFontSize || '12px',
                      borderRadius: element.props?.buttonBorderRadius || '4px',
                      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                      color: element.props?.buttonTextColor || '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {element.props?.submitText || "Submit Feedback"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "contact-form":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="w-full h-full space-y-3">
                <h3
                  className="w-full"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize || '14px',
                    fontWeight: element.props?.titleFontWeight || '500',
                    textAlign: element.props?.titleAlign || 'left',
                    color: element.props?.titleColor || '#ffffff'
                  }}
                >
                  {element.content || "Contact Form"}
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder={element.props?.namePlaceholder || "Name"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <input
                    type="email"
                    placeholder={element.props?.emailPlaceholder || "Email"}
                    className="w-full border"
                    style={{
                      padding: element.props?.inputPadding || '8px 12px',
                      fontSize: element.props?.inputFontSize || '12px',
                      borderRadius: element.props?.inputBorderRadius || '4px',
                      borderColor: element.props?.inputBorderColor || '#374151',
                      backgroundColor: element.props?.inputBackgroundColor || '#1f2937',
                      color: element.props?.inputTextColor || '#ffffff'
                    }}
                    disabled
                  />
                  <textarea
                    placeholder={element.props?.messagePlaceholder || "Message"}
                    className="w-full border resize-none"
                    style={{
                      fontFamily: element.props?.textareaFontFamily || 'inherit',
                      padding: element.props?.textareaPadding || '8px 12px',
                      fontSize: element.props?.textareaFontSize || '12px',
                      fontWeight: element.props?.textareaFontWeight || '400',
                      borderRadius: element.props?.textareaBorderRadius || '4px',
                      borderColor: element.props?.textareaBorderColor || '#374151',
                      backgroundColor: element.props?.textareaBackgroundColor || '#1f2937',
                      color: element.props?.textareaTextColor || '#ffffff',
                      height: element.props?.textareaHeight || '60px'
                    }}
                    disabled
                  />
                  <button
                    className="w-full rounded"
                    style={{
                      padding: element.props?.buttonPadding || '8px 12px',
                      fontSize: element.props?.buttonFontSize || '12px',
                      borderRadius: element.props?.buttonBorderRadius || '4px',
                      backgroundColor: element.props?.buttonBackgroundColor || '#3b82f6',
                      color: element.props?.buttonTextColor || '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {element.props?.buttonText || "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case "file-upload":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full flex flex-col items-center justify-center"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-foreground)',
                backgroundColor: element.props?.backgroundColor || 'var(--color-background)',
                borderColor: element.props?.borderColor || 'var(--color-border)',
                borderRadius: element.props?.borderRadius || '0.5rem',
                padding: element.props?.padding || '0.75rem',
                borderStyle: element.props?.borderStyle || 'dashed',
                borderWidth: element.props?.borderWidth || '2px',
                border: `${element.props?.borderWidth || '2px'} ${element.props?.borderStyle || 'dashed'} ${element.props?.borderColor || 'var(--color-border)'}`
              }}
            >
              <svg
                className="w-8 h-8 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span
                className="text-sm"
                style={{
                  fontFamily: element.props?.fontFamily || 'inherit',
                  fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                  fontWeight: element.props?.fontWeight || 'normal',
                  color: element.props?.textColor || 'var(--color-muted-foreground)'
                }}
              >
                {element.content}
              </span>
            </div>
          </div>
        )

      case "file-download":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-primary-foreground)',
                backgroundColor: element.props?.backgroundColor || 'var(--color-primary)',
                borderRadius: element.props?.borderRadius || '8px',
                padding: element.props?.padding || '0.75rem'
              }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    color: element.props?.iconColor || 'var(--color-primary-foreground)',
                    width: element.props?.iconSize ? `${element.props.iconSize}px` : '16px',
                    height: element.props?.iconSize ? `${element.props.iconSize}px` : '16px'
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-primary-foreground)'
                  }}
                >
                  {element.content}
                </span>
              </div>
            </div>
          </div>
        )

      case "pdf-viewer":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full flex flex-col items-center justify-center"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-foreground)',
                backgroundColor: element.props?.backgroundColor || 'var(--color-card)',
                borderColor: element.props?.borderColor || 'var(--color-border)',
                borderRadius: element.props?.borderRadius || '0.5rem',
                padding: element.props?.padding || '1rem',
                border: `1px solid ${element.props?.borderColor || 'var(--color-border)'}`
              }}
            >
              {element.props?.pdfUrl || element.props?.uploadedFile ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-medium"
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: element.props?.textColor || 'var(--color-foreground)'
                      }}
                    >
                      {element.props?.fileName || "PDF Document"}
                    </span>
                    <span
                      className="text-xs text-muted-foreground"
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: element.props?.textColor || 'var(--color-muted-foreground)'
                      }}
                    >
                      Open in New Tab
                    </span>
                  </div>
                  <iframe
                    src={element.props?.uploadedFile ? URL.createObjectURL(element.props.uploadedFile) : element.props?.pdfUrl}
                    className="w-full flex-1 border-0 rounded"
                    style={{ borderRadius: element.props?.borderRadius || '0.5rem' }}
                    title={element.props?.fileName || "PDF Document"}
                  />
                </div>
              ) : (
                <div className="text-center">
                  <svg
                    className="w-12 h-12 text-muted-foreground mb-2 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
                  >
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  {element.props?.showFileName !== false && (
                    <span
                      className="text-sm font-medium block"
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: element.props?.textColor || 'var(--color-foreground)'
                      }}
                    >
                      {element.props?.fileName || "PDF Document"}
                    </span>
                  )}
                  <span
                    className="text-xs text-muted-foreground mt-1 block"
                    style={{
                      fontFamily: element.props?.fontFamily || 'inherit',
                      fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                      fontWeight: element.props?.fontWeight || 'normal',
                      color: element.props?.textColor || 'var(--color-muted-foreground)'
                    }}
                  >
                    PDF Viewer
                  </span>
                  {element.props?.showUploadButton !== false && (
                    <div className="mt-3">
                      <span
                        className="text-xs text-muted-foreground"
                        style={{
                          fontFamily: element.props?.fontFamily || 'inherit',
                          fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                          fontWeight: element.props?.fontWeight || 'normal',
                          color: element.props?.textColor || 'var(--color-muted-foreground)'
                        }}
                      >
                        Upload PDF URL or file in properties panel
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case "document":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full flex flex-col items-center justify-center"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-foreground)',
                backgroundColor: element.props?.backgroundColor || 'var(--color-card)',
                borderColor: element.props?.borderColor || 'var(--color-border)',
                borderRadius: element.props?.borderRadius || '0.5rem',
                padding: element.props?.padding || '1rem',
                border: `1px solid ${element.props?.borderColor || 'var(--color-border)'}`
              }}
            >
              {element.props?.documentUrl || element.props?.uploadedFile ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-medium"
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: element.props?.textColor || 'var(--color-foreground)'
                      }}
                    >
                      {element.props?.fileName || "Document Viewer"}
                    </span>
                    <span
                      className="text-xs text-muted-foreground"
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: element.props?.textColor || 'var(--color-muted-foreground)'
                      }}
                    >
                      Open in New Tab
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {element.props?.documentType === 'pdf' ||
                      (element.props?.uploadedFile && element.props.uploadedFile.type === 'application/pdf') ||
                      (element.props?.documentUrl && element.props.documentUrl.toLowerCase().includes('.pdf')) ? (
                      <iframe
                        src={element.props?.uploadedFile ? URL.createObjectURL(element.props.uploadedFile) : element.props?.documentUrl}
                        className="w-full h-full border-0 rounded"
                        style={{ borderRadius: element.props?.borderRadius || '0.5rem' }}
                        title={element.props?.fileName || "Document Viewer"}
                      />
                    ) : (
                      <div className="text-center">
                        <svg
                          className="w-16 h-16 text-muted-foreground mb-2 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
                        >
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span
                          className="text-sm font-medium block"
                          style={{
                            fontFamily: element.props?.fontFamily || 'inherit',
                            fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                            fontWeight: element.props?.fontWeight || 'normal',
                            color: element.props?.textColor || 'var(--color-foreground)'
                          }}
                        >
                          {element.props?.fileName || "Document Viewer"}
                        </span>
                        <span
                          className="text-xs text-muted-foreground mt-1 block"
                          style={{
                            fontFamily: element.props?.fontFamily || 'inherit',
                            fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                            fontWeight: element.props?.fontWeight || 'normal',
                            color: element.props?.textColor || 'var(--color-muted-foreground)'
                          }}
                        >
                          Document preview not available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <svg
                    className="w-10 h-10 text-muted-foreground mb-2 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
                  >
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  {element.props?.showFileName !== false && (
                    <span
                      className="text-sm font-medium block"
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: element.props?.textColor || 'var(--color-foreground)'
                      }}
                    >
                      {element.props?.fileName || "Document Viewer"}
                    </span>
                  )}
                  <span
                    className="text-xs text-muted-foreground mt-1 block"
                    style={{
                      fontFamily: element.props?.fontFamily || 'inherit',
                      fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                      fontWeight: element.props?.fontWeight || 'normal',
                      color: element.props?.textColor || 'var(--color-muted-foreground)'
                    }}
                  >
                    Document Viewer
                  </span>
                  {element.props?.showUploadButton !== false && (
                    <div className="mt-3">
                      <span
                        className="text-xs text-muted-foreground"
                        style={{
                          fontFamily: element.props?.fontFamily || 'inherit',
                          fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                          fontWeight: element.props?.fontWeight || 'normal',
                          color: element.props?.textColor || 'var(--color-muted-foreground)'
                        }}
                      >
                        Upload document URL or file in properties panel
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case "folder":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full flex flex-col"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-foreground)',
                backgroundColor: element.props?.backgroundColor || 'var(--color-card)',
                borderColor: element.props?.borderColor || 'var(--color-border)',
                borderRadius: element.props?.borderRadius || '0.5rem',
                padding: element.props?.padding || '1rem',
                border: `1px solid ${element.props?.borderColor || 'var(--color-border)'}`
              }}
            >
              {/* Folder Header */}
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-6 h-6 text-muted-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ color: element.props?.textColor || 'var(--color-muted-foreground)' }}
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span
                  className="text-sm font-medium flex-1"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-foreground)'
                  }}
                >
                  {element.props?.folderName || "Folder Name"}
                </span>
                {element.props?.showItemCount !== false && (
                  <span
                    className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                    style={{
                      fontFamily: element.props?.fontFamily || 'inherit',
                      fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                      fontWeight: element.props?.fontWeight || 'normal',
                      color: element.props?.textColor || 'var(--color-muted-foreground)'
                    }}
                  >
                    {element.props?.items?.length || 0} items
                  </span>
                )}
              </div>

              {/* Folder Items */}
              <div className="flex-1 overflow-y-auto">
                {element.props?.items && element.props.items.length > 0 ? (
                  <div className="space-y-1">
                    {element.props.items.map((item: { id: string | number; type: string; icon?: string; name: string }) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-1 hover:bg-muted rounded text-xs"
                        style={{
                          fontFamily: element.props?.fontFamily || 'inherit',
                          fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                          fontWeight: element.props?.fontWeight || 'normal',
                          color: element.props?.textColor || 'var(--color-foreground)'
                        }}
                      >
                        {/* File/Folder Icon */}
                        {item.type === 'folder' ? (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                        ) : item.icon === 'pdf' ? (
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        ) : item.icon === 'image' ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}

                        {/* File/Folder Name */}
                        <span className="flex-1 truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-center text-muted-foreground py-4"
                    style={{
                      fontFamily: element.props?.fontFamily || 'inherit',
                      fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                      fontWeight: element.props?.fontWeight || 'normal',
                      color: element.props?.textColor || 'var(--color-muted-foreground)'
                    }}
                  >
                    Empty folder
                  </div>
                )}
              </div>

              {/* Add Item Button (shown in preview as a hint) */}
              {element.props?.allowAddItems !== false && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span
                    className="w-full text-xs text-muted-foreground block text-center"
                    style={{
                      fontFamily: element.props?.fontFamily || 'inherit',
                      fontSize: element.props?.fontSize ? `${element.props.fontSize - 2}px` : '12px',
                      color: element.props?.textColor || 'var(--color-muted-foreground)'
                    }}
                  >
                    + Add Item
                  </span>
                </div>
              )}
            </div>
          </div>
        )

      // Advanced UI Components
      case "calendar":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={contentStyles}>
              <div className="text-center">
                <h3
                  className="font-semibold text-sm mb-3"
                  style={{
                    fontFamily: element.props?.titleFontFamily || 'inherit',
                    fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : '14px',
                    fontWeight: element.props?.titleFontWeight || '600',
                    color: element.props?.titleTextColor || 'inherit'
                  }}
                >
                  {element.props?.title || "Calendar"}
                </h3>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="p-1 text-center font-medium text-muted-foreground">{day}</div>
                  ))}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div key={i} className="p-1 text-center hover:bg-muted rounded">{i + 1}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "search-bar":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="relative">
                <input
                  type="text"
                  placeholder={element.content}
                  className="w-full px-3 py-2 pl-8 text-sm border border-border rounded-lg bg-background text-foreground"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '16px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-foreground)'
                  }}
                  disabled
                />
                <svg className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )

      case "filter":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="text-card-foreground w-full h-full bg-card border border-border rounded-lg p-4" style={contentStyles}>
              <h3
                className="font-semibold text-sm mb-3"
                style={{
                  fontFamily: element.props?.titleFontFamily || 'inherit',
                  fontSize: element.props?.titleFontSize ? `${element.props.titleFontSize}px` : '14px',
                  fontWeight: element.props?.titleFontWeight || '600',
                  color: element.props?.titleTextColor || 'var(--color-foreground)'
                }}
              >
                {element.props?.title || element.content}
              </h3>
              <div className="space-y-2">
                {(element.props?.options || [
                  { id: "option1", label: "Option 1", checked: false },
                  { id: "option2", label: "Option 2", checked: false },
                  { id: "option3", label: "Option 3", checked: false }
                ]).map((option: { id: string; label: string; checked?: boolean }, index: number) => (
                  <label key={option.id || index} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-border bg-background text-primary"
                      checked={option.checked || false}
                      disabled
                    />
                    <span
                      style={{
                        fontFamily: element.props?.optionFontFamily || 'inherit',
                        fontSize: element.props?.optionFontSize ? `${element.props.optionFontSize}px` : '12px',
                        fontWeight: element.props?.optionFontWeight || 'normal',
                        color: element.props?.optionTextColor || 'var(--color-foreground)'
                      }}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case "breadcrumb":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center" style={contentStyles}>
              <nav className="flex items-center space-x-1 text-sm">
                {(element.props?.items || [
                  { id: "home", label: "Home", href: "/", isLast: false },
                  { id: "about", label: "About", href: "/about", isLast: false },
                  { id: "contact", label: "Contact", href: "/contact", isLast: true }
                ]).map((item: { id: string; label: string; href?: string; isLast?: boolean }, index: number, array: { id: string; label: string; href?: string; isLast?: boolean }[]) => (
                  <div key={item.id || index} className="flex items-center">
                    <span
                      className={item.isLast ? "" : "hover:underline cursor-pointer"}
                      style={{
                        fontFamily: element.props?.fontFamily || 'inherit',
                        fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                        fontWeight: element.props?.fontWeight || 'normal',
                        color: item.isLast
                          ? (element.props?.lastItemColor || 'var(--color-muted-foreground)')
                          : (element.props?.textColor || 'var(--color-primary)')
                      }}
                    >
                      {item.label}
                    </span>
                    {index < array.length - 1 && (
                      <span
                        className="mx-1"
                        style={{
                          fontFamily: element.props?.fontFamily || 'inherit',
                          fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                          fontWeight: element.props?.fontWeight || 'normal',
                          color: element.props?.separatorColor || 'var(--color-muted-foreground)'
                        }}
                      >
                        {element.props?.separator || "/"}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )

      case "pagination":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              <nav className="flex items-center space-x-1">
                {(element.props?.items || [
                  { id: "prev", label: "←", type: "prev", isActive: false },
                  { id: "1", label: "1", type: "page", isActive: true },
                  { id: "2", label: "2", type: "page", isActive: false },
                  { id: "3", label: "3", type: "page", isActive: false },
                  { id: "ellipsis", label: "...", type: "ellipsis", isActive: false },
                  { id: "10", label: "10", type: "page", isActive: false },
                  { id: "next", label: "→", type: "next", isActive: false }
                ]).map((item: { id: string; label: string; type?: string; isActive?: boolean }, index: number) => (
                  <div key={item.id || index}>
                    {item.type === "ellipsis" ? (
                      <span
                        className="px-2 py-1 text-xs text-muted-foreground"
                        style={{
                          fontFamily: element.props?.fontFamily || 'inherit',
                          fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '12px',
                          fontWeight: element.props?.fontWeight || 'normal',
                          color: element.props?.textColor || 'var(--color-muted-foreground)'
                        }}
                      >
                        {item.label}
                      </span>
                    ) : (
                      <button
                        className={`px-2 py-1 text-xs border rounded ${item.isActive
                          ? "bg-primary text-primary-foreground"
                          : "border-border"
                          }`}
                        style={{
                          fontFamily: element.props?.fontFamily || 'inherit',
                          fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '12px',
                          fontWeight: element.props?.fontWeight || 'normal',
                          color: item.isActive
                            ? (element.props?.activeTextColor || 'var(--color-primary-foreground)')
                            : (element.props?.textColor || 'var(--color-foreground)'),
                          backgroundColor: item.isActive
                            ? (element.props?.activeBgColor || 'var(--color-primary)')
                            : 'transparent',
                          borderColor: element.props?.borderColor || 'var(--color-border)'
                        }}
                        disabled
                      >
                        {item.label}
                      </button>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )

      case "spinner":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm">{element.content}</span>
            </div>
          </div>
        )

      case "skeleton":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          </div>
        )

      case "alert":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'medium',
                    color: element.props?.textColor || 'var(--color-destructive-foreground)'
                  }}
                >
                  {element.content}
                </span>
              </div>
            </div>
          </div>
        )

      case "toast":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{
                    color: element.props?.iconColor || 'currentColor'
                  }}
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span
                  className="text-sm"
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-foreground)'
                  }}
                >
                  {element.content}
                </span>
              </div>
            </div>
          </div>
        )

      // Content & Text Components
      case "code-block":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full relative" style={contentStyles}>
              <pre className="w-full h-full p-4 bg-muted rounded-lg border border-border overflow-auto">
                <code
                  className={`text-sm font-mono language-${element.props?.language || 'javascript'}`}
                  style={{
                    fontFamily: element.props?.fontFamily || 'inherit',
                    fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                    fontWeight: element.props?.fontWeight || 'normal',
                    color: element.props?.textColor || 'var(--color-foreground)'
                  }}
                >
                  {element.content}
                </code>
              </pre>
              <div className="absolute top-2 right-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
                {element.props?.language || 'javascript'}
              </div>
            </div>
          </div>
        )

      case "markdown":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full p-4 bg-card rounded-lg border border-border overflow-auto prose prose-sm max-w-none"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-foreground)',
                ...contentStyles
              }}
            >
              <div className="whitespace-pre-wrap">{element.content}</div>
            </div>
          </div>
        )

      case "rich-text":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div
              className="w-full h-full p-4 bg-card rounded-lg border border-border overflow-auto"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-foreground)',
                fontStyle: element.props?.italic ? 'italic' : 'normal',
                textDecoration: element.props?.underline ? 'underline' : 'none',
                ...contentStyles
              }}
            >
              {element.content}
            </div>
          </div>
        )

      case "typography":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}>
              <h2
                style={{
                  fontFamily: element.props?.headingFontFamily || 'inherit',
                  fontSize: element.props?.headingFontSize ? `${element.props.headingFontSize}px` : '24px',
                  fontWeight: element.props?.headingFontWeight || 'bold',
                  color: element.props?.headingColor || 'var(--color-foreground)'
                }}
              >
                {element.props?.heading || "Typography"}
              </h2>
              <p
                style={{
                  fontFamily: element.props?.subtitleFontFamily || 'inherit',
                  fontSize: element.props?.subtitleFontSize ? `${element.props.subtitleFontSize}px` : '14px',
                  fontWeight: element.props?.subtitleFontWeight || 'normal',
                  color: element.props?.subtitleColor || 'var(--color-muted-foreground)'
                }}
              >
                {element.props?.subtitle || "Font styles and sizes"}
              </p>
            </div>
          </div>
        )

      case "link":
        return (
          <div key={element.id} style={wrapperStyles}>
            <a
              href={element.props?.href || "#"}
              className="text-primary hover:underline"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'normal',
                color: element.props?.textColor || 'var(--color-primary)',
                ...contentStyles
              }}
              target={element.props?.openInNewTab ? "_blank" : undefined}
              rel={element.props?.openInNewTab ? "noopener noreferrer" : undefined}
            >
              {element.content || "Link"}
            </a>
          </div>
        )

      case "tag":
        return (
          <div key={element.id} style={wrapperStyles}>
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '12px',
                fontWeight: element.props?.fontWeight || 'medium',
                color: element.props?.textColor || 'var(--color-primary)',
                backgroundColor: element.props?.backgroundColor || 'var(--color-primary/10)',
                ...contentStyles
              }}
            >
              {element.content || "Tag"}
            </span>
          </div>
        )

      case "label":
        return (
          <div key={element.id} style={wrapperStyles}>
            <span
              className="text-sm font-medium"
              style={{
                fontFamily: element.props?.fontFamily || 'inherit',
                fontSize: element.props?.fontSize ? `${element.props.fontSize}px` : '14px',
                fontWeight: element.props?.fontWeight || 'medium',
                color: element.props?.textColor || 'var(--color-foreground)',
                ...contentStyles
              }}
            >
              {element.content || "Label"}
            </span>
          </div>
        )

      // Feedback & Status Components
      case "loading":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm">{element.content || "Loading..."}</span>
            </div>
          </div>
        )

      case "progress-ring":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              <div className="relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    className="text-muted"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="32"
                    cy="32"
                  />
                  <circle
                    className="text-primary"
                    strokeWidth="4"
                    strokeDasharray={`${(element.props?.progress || 75) * 1.76} 176`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="32"
                    cy="32"
                  />
                </svg>
                {element.props?.showPercentage !== false && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                    {element.props?.progress || 75}%
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case "notification":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center" style={contentStyles}>
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {element.props?.count && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {element.props.count}
                  </span>
                )}
              </div>
            </div>
          </div>
        )

      case "success-message":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-800 rounded-lg p-4" style={contentStyles}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{element.content || "Success!"}</span>
            </div>
          </div>
        )

      case "error-message":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-800 rounded-lg p-4" style={contentStyles}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{element.content || "Error!"}</span>
            </div>
          </div>
        )

      case "warning-message":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full flex items-center justify-center bg-yellow-100 text-yellow-800 rounded-lg p-4" style={contentStyles}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{element.content || "Warning!"}</span>
            </div>
          </div>
        )

      // Utility Components
      case "spacer":
        return (
          <div key={element.id} style={wrapperStyles}>
            <div className="w-full h-full" style={contentStyles}></div>
          </div>
        )

      case "container":
      case "wrapper":
      case "flexbox":
      case "center":
      case "stack":
        return (
          <div key={element.id} style={{ ...wrapperStyles, ...contentStyles }}>
            {element.content}
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
              style={{ minHeight: `${scaledCanvasHeight}px` }}
            >
              {/* Preview canvas with absolute positioning - exactly like builder canvas */}
              {/* For tablet/mobile, we scale down the entire canvas content to fit the viewport */}
              <div
                className="relative w-full overflow-hidden"
                style={{ height: `${scaledCanvasHeight}px` }}
              >
                <div
                  className="absolute top-0 left-0 origin-top-left"
                  style={{
                    width: `${CANVAS_REFERENCE_WIDTH}px`,
                    height: `${canvasHeight}px`,
                    transform: scaleFactor !== 1 ? `scale(${scaleFactor})` : undefined,
                  }}
                >
                  {currentElements.map(renderElement)}
                </div>
              </div>
            </div>
          </div>
        </div >

        <div className="p-4 border-t bg-muted/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Preview your website as it will appear to visitors</p>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close Preview
            </Button>
          </div>
        </div>
      </DialogContent >
    </Dialog >
  )
}
