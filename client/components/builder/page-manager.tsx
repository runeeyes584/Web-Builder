"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import type { BuilderPage, PageMetadata } from "@/lib/builder-types"
import { Copy, FileText, MoreVertical, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface PageManagerProps {
  pages: BuilderPage[]
  activePageId: string
  onPageSelect: (pageId: string) => void
  onPageCreate: (name: string, metadata?: PageMetadata) => void
  onPageDelete: (pageId: string) => void
  onPageDuplicate: (pageId: string) => void
  onPageRename: (pageId: string, newName: string) => void
  onPageUpdateMetadata?: (pageId: string, metadata: PageMetadata) => void
  canEdit?: boolean
}

export function PageManager({
  pages,
  activePageId,
  onPageSelect,
  onPageCreate,
  onPageDelete,
  onPageDuplicate,
  onPageRename,
  onPageUpdateMetadata,
  canEdit = true,
}: PageManagerProps) {
  const { toast } = useToast()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newPageName, setNewPageName] = useState("")
  const [newPageTitle, setNewPageTitle] = useState("")
  const [newPageDescription, setNewPageDescription] = useState("")
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null)
  const [renamingPageName, setRenamingPageName] = useState("")

  const handleCreatePage = () => {
    if (!newPageName.trim()) return

    const metadata: PageMetadata = {
      title: newPageTitle.trim() || newPageName.trim(),
      description: newPageDescription.trim() || undefined,
    }

    onPageCreate(newPageName.trim(), metadata)
    
    // Reset form
    setNewPageName("")
    setNewPageTitle("")
    setNewPageDescription("")
    setCreateDialogOpen(false)
    
    toast({
      title: "Success",
      description: `Page "${newPageName.trim()}" created successfully`,
    })
  }

  const handleOpenRenameDialog = (pageId: string) => {
    const page = pages.find(p => p.id === pageId)
    if (!page) return
    
    setRenamingPageId(pageId)
    setRenamingPageName(page.name)
    setRenameDialogOpen(true)
  }

  const handleRename = () => {
    if (!renamingPageId || !renamingPageName.trim()) return
    
    const currentName = pages.find(p => p.id === renamingPageId)?.name
    if (renamingPageName.trim() !== currentName) {
      onPageRename(renamingPageId, renamingPageName.trim())
      
      toast({
        title: "Success",
        description: `Page renamed to "${renamingPageName.trim()}"`,
      })
    }
    
    setRenameDialogOpen(false)
    setRenamingPageId(null)
    setRenamingPageName("")
  }

  const handleDelete = (pageId: string) => {
    const page = pages.find(p => p.id === pageId)
    if (!page) return

    if (pages.length === 1) {
      toast({
        title: "Cannot delete",
        description: "Cannot delete the last page. A project must have at least one page.",
        variant: "destructive",
      })
      return
    }

    if (confirm(`Are you sure you want to delete "${page.name}"?`)) {
      onPageDelete(pageId)
      
      toast({
        title: "Success",
        description: `Page "${page.name}" deleted successfully`,
      })
    }
  }

  const activePage = pages.find(p => p.id === activePageId)

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Create Page Button and Active Page Indicator */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          {canEdit && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-2">
                  <Plus className="h-4 w-4" />
                  New Page
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Page</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="page-name">Page Name *</Label>
                    <Input
                      id="page-name"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      placeholder="e.g., Home, About, Contact"
                      className="mt-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreatePage()
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="page-title">Page Title (for SEO)</Label>
                    <Input
                      id="page-title"
                      value={newPageTitle}
                      onChange={(e) => setNewPageTitle(e.target.value)}
                      placeholder="e.g., Welcome to Our Website"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="page-description">Description (for SEO)</Label>
                    <Input
                      id="page-description"
                      value={newPageDescription}
                      onChange={(e) => setNewPageDescription(e.target.value)}
                      placeholder="e.g., Learn about our services..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePage} disabled={!newPageName.trim()}>
                      Create Page
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Active page indicator */}
        {activePage && (
          <div className="text-xs text-muted-foreground truncate">
            <FileText className="h-3 w-3 inline mr-1" />
            {activePage.name}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename-page-name">Page Name *</Label>
              <Input
                id="rename-page-name"
                value={renamingPageName}
                onChange={(e) => setRenamingPageName(e.target.value)}
                placeholder="Enter new page name"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename} disabled={!renamingPageName.trim()}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pages List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {pages
            .sort((a, b) => a.order - b.order)
            .map((page) => (
              <Card
                key={page.id}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                  page.id === activePageId ? "bg-accent border-primary" : ""
                }`}
                onClick={() => onPageSelect(page.id)}
              >
                <CardContent className="p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm font-medium truncate">
                                {page.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <div><strong>Name:</strong> {page.name}</div>
                                {page.metadata?.title && (
                                  <div><strong>Title:</strong> {page.metadata.title}</div>
                                )}
                                {page.metadata?.description && (
                                  <div><strong>Description:</strong> {page.metadata.description}</div>
                                )}
                                <div><strong>Elements:</strong> {page.elements.length}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenRenameDialog(page.id)
                            }}
                          >
                            <FileText className="h-3.5 w-3.5 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onPageDuplicate(page.id)
                              
                              toast({
                                title: "Success",
                                description: `Page "${page.name}" duplicated successfully`,
                              })
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(page.id)
                            }}
                            className="text-destructive"
                            disabled={pages.length === 1}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {/* Page info */}
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{page.elements.length} elements</span>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </ScrollArea>

      {/* Footer info */}
      <div className="p-2 border-t border-border text-xs text-muted-foreground text-center">
        {pages.length} {pages.length === 1 ? "page" : "pages"}
      </div>
    </div>
  )
}
