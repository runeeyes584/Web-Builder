"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { BuilderElement, BuilderPage } from "@/lib/builder-types"
import { downloadFile, downloadMultiPageProject, generateCSS, generateHTML, type ExportOptions } from "@/lib/export-utils"
import { Check, Code, Copy, Download, FileCode, FileText } from "lucide-react"
import { useState } from "react"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  elements?: BuilderElement[] // For backward compatibility
  pages?: BuilderPage[] // For multi-page export
}

export function ExportModal({ isOpen, onClose, elements, pages }: ExportModalProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeResponsive: true,
    minifyCode: false,
    includeComments: true,
    generateRouting: true,
  })
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  
  // Determine if multi-page or single-page export
  const isMultiPage = pages && pages.length > 0
  const currentElements = isMultiPage ? pages[0]?.elements || [] : (elements || [])

  const htmlCode = generateHTML(currentElements, exportOptions)
  const cssCode = generateCSS(currentElements, exportOptions)

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedStates({ ...copiedStates, [type]: true })
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [type]: false })
      }, 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleDownload = (content: string, filename: string, contentType: string) => {
    downloadFile(content, filename, contentType)
  }

  const handleDownloadAll = () => {
    if (isMultiPage && pages) {
      // Multi-page export
      downloadMultiPageProject(pages, "website", exportOptions)
    } else {
      // Single-page export (backward compatibility)
      handleDownload(htmlCode, "index.html", "text/html")
      setTimeout(() => {
        handleDownload(cssCode, "styles.css", "text/css")
      }, 100)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Export Website
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Export Options */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Options</CardTitle>
              <CardDescription>Customize how your code is generated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="responsive"
                    checked={exportOptions.includeResponsive}
                    onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeResponsive: checked })}
                  />
                  <Label htmlFor="responsive" className="text-sm">
                    Include Responsive CSS
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="minify"
                    checked={exportOptions.minifyCode}
                    onCheckedChange={(checked) => setExportOptions({ ...exportOptions, minifyCode: checked })}
                  />
                  <Label htmlFor="minify" className="text-sm">
                    Minify Code
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="comments"
                    checked={exportOptions.includeComments}
                    onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeComments: checked })}
                  />
                  <Label htmlFor="comments" className="text-sm">
                    Include Comments
                  </Label>
                </div>
                {isMultiPage && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="routing"
                      checked={exportOptions.generateRouting}
                      onCheckedChange={(checked) => setExportOptions({ ...exportOptions, generateRouting: checked })}
                    />
                    <Label htmlFor="routing" className="text-sm">
                      Generate Navigation
                    </Label>
                  </div>
                )}
              </div>
              {isMultiPage && pages && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2 text-sm">
                    <FileCode className="w-4 h-4" />
                    <span className="font-medium">Multi-page Export:</span>
                    <span className="text-muted-foreground">{pages.length} pages will be exported</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Tabs */}
          <Tabs defaultValue="html" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="css" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                CSS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">HTML Code</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(htmlCode, "html")}
                    className="flex items-center gap-2"
                  >
                    {copiedStates.html ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedStates.html ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(htmlCode, "index.html", "text/html")}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={htmlCode}
                readOnly
                className="flex-1 font-mono text-xs resize-none bg-muted"
                placeholder="Generated HTML will appear here..."
              />
            </TabsContent>

            <TabsContent value="css" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">CSS Code</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(cssCode, "css")}
                    className="flex items-center gap-2"
                  >
                    {copiedStates.css ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedStates.css ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(cssCode, "styles.css", "text/css")}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={cssCode}
                readOnly
                className="flex-1 font-mono text-xs resize-none bg-muted"
                placeholder="Generated CSS will appear here..."
              />
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {isMultiPage 
                ? `Export ${pages?.length} pages as clean HTML and CSS code` 
                : "Export your website as clean HTML and CSS code"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleDownloadAll} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                {isMultiPage ? `Download ${pages?.length} Pages` : "Download All Files"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
