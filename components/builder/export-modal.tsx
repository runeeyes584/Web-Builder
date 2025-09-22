"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Copy, Check, Code, FileText } from "lucide-react"
import { generateHTML, generateCSS, downloadFile, type ExportOptions } from "@/lib/export-utils"
import type { BuilderElement } from "@/lib/builder-types"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  elements: BuilderElement[]
}

export function ExportModal({ isOpen, onClose, elements }: ExportModalProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeResponsive: true,
    minifyCode: false,
    includeComments: true,
  })
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  const htmlCode = generateHTML(elements, exportOptions)
  const cssCode = generateCSS(elements, exportOptions)

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
    // Create a zip-like structure by downloading multiple files
    handleDownload(htmlCode, "index.html", "text/html")
    setTimeout(() => {
      handleDownload(cssCode, "styles.css", "text/css")
    }, 100)
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
              <div className="grid grid-cols-3 gap-4">
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
              </div>
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
            <p className="text-sm text-muted-foreground">Export your website as clean HTML and CSS code</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleDownloadAll} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download All Files
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
