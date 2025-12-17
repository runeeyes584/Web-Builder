"use client"

import type React from "react"

import { projectsApi, type Project } from "@/api/projects.api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { Calendar, Download, FolderOpen, Save, Trash2, Upload } from "lucide-react"
import { useEffect, useState } from "react"

import type { BuilderPage } from "@/lib/builder-types"

interface ProjectManagerProps {
  pages: BuilderPage[]
  onLoadProject: (pages: BuilderPage[]) => void
  currentProjectName: string
  onProjectChange?: (projectId: string, projectName: string, isPublic?: boolean) => void
  hasUnsavedChanges?: boolean
}

export function ProjectManagerComponent({ pages, onLoadProject, currentProjectName, onProjectChange, hasUnsavedChanges = false }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState(currentProjectName || "")
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null) // Track current project
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()

  // Load projects from database
  useEffect(() => {
    if (user?.id) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await projectsApi.getByUser(user.id)
      if (response.success && response.data) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects from server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      })
      return
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save projects",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Check if updating existing project or creating new one
      if (currentProjectId) {
        // UPDATE existing project - save all pages
        // Important: Send current pages state with correct IDs
        const pagesToSave = (pages || []).map((page, index) => ({
          id: page.id,
          name: page.name,
          elements: page.elements,
          layout: page.layout,
          metadata: page.metadata,
          order: index, // Use index to ensure correct order
        }))

        console.log('Saving pages:', pagesToSave.map(p => ({ id: p.id, name: p.name, elementsCount: p.elements?.length })))

        const response = await projectsApi.update(currentProjectId, {
          name: projectName.trim(),
          description: "",
          pages: pagesToSave,
        })

        if (response.success) {
          // Update pages with real database IDs if returned
          if (response.data?.pages && response.data.pages.length > 0) {
            // Create a map of page IDs to their database counterparts for proper matching
            const dbPagesMap = new Map<string, any>()
            response.data.pages.forEach((dbPage: any) => {
              dbPagesMap.set(dbPage.id, dbPage)
            })

            // Map pages maintaining the same order as the current state
            const updatedPages: BuilderPage[] = response.data.pages.map((dbPage: any, index: number) => {
              const jsonStructure = dbPage.json_structure as any
              return {
                id: dbPage.id,  // Use real database ID
                name: dbPage.name,
                elements: jsonStructure?.elements || [],
                layout: jsonStructure?.layout,
                metadata: jsonStructure?.metadata,
                order: index,
              }
            })

            console.log('Updated pages from server:', updatedPages.map(p => ({ id: p.id, name: p.name, elementsCount: p.elements?.length })))

            onLoadProject(updatedPages) // Reload with database IDs and fresh data
          }

          setSaveDialogOpen(false)
          toast({
            title: "Success",
            description: `Project "${projectName}" updated successfully`,
          })
          await loadProjects()
        }
      } else {
        // CREATE new project with all pages
        const pagesToCreate = (pages || []).map((page, index) => ({
          name: page.name,
          elements: page.elements,
          layout: page.layout,
          metadata: page.metadata,
          order: index,
        }))

        const response = await projectsApi.create({
          clerk_id: user.id,
          name: projectName.trim(),
          description: "",
          pages: pagesToCreate,
        })

        if (response.success && response.data) {
          setCurrentProjectId(response.data.id) // Save project ID for future updates

          // Update pages with real database IDs
          if (response.data.pages && response.data.pages.length > 0) {
            const updatedPages: BuilderPage[] = response.data.pages.map((dbPage: any, index: number) => {
              const jsonStructure = dbPage.json_structure as any
              return {
                id: dbPage.id,  // Use real database ID
                name: dbPage.name,
                elements: jsonStructure?.elements || [],
                layout: jsonStructure?.layout,
                metadata: jsonStructure?.metadata,
                order: index,
              }
            })
            onLoadProject(updatedPages) // Reload with database IDs
          }

          setSaveDialogOpen(false)

          // Notify parent component about project change
          onProjectChange?.(response.data.id, projectName.trim(), response.data.is_public)

          toast({
            title: "Success",
            description: `Project "${projectName}" created successfully`,
          })
          await loadProjects()
        }
      }
    } catch (error) {
      console.error("Failed to save project:", error)
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = (project: Project) => {
    // Convert project pages to BuilderPage format
    const loadedPages: BuilderPage[] = (project.pages || []).map((page, index) => ({
      id: page.id,
      name: page.name,
      elements: page.json_structure?.elements || [],
      layout: page.json_structure?.layout,
      metadata: page.json_structure?.metadata || { title: page.name },
      order: index,
    }))

    // Ensure at least one page exists
    if (loadedPages.length === 0) {
      loadedPages.push({
        id: `page-${Date.now()}`,
        name: "Main Page",
        elements: [],
        order: 0,
        metadata: { title: "Main Page" },
      })
    }

    onLoadProject(loadedPages)
    setCurrentProjectId(project.id) // Set current project ID
    setProjectName(project.name)    // Set project name

    // Notify parent component about project change
    onProjectChange?.(project.id, project.name, project.is_public)

    setLoadDialogOpen(false)
    toast({
      title: "Success",
      description: `Project "${project.name}" loaded successfully`,
    })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      setLoading(true)
      const response = await projectsApi.delete(id)

      if (response.success) {
        // Check if we're deleting the currently open project
        if (currentProjectId === id) {
          // Reset to a new project with default template
          setCurrentProjectId(null)
          setProjectName("Untitled Project")

          // Create default page with sample elements
          const defaultPage: BuilderPage = {
            id: `page-${Date.now()}`,
            name: "Main Page",
            elements: [
              {
                id: "1",
                type: "heading",
                content: "Welcome to Your Website",
                styles: { fontSize: "2rem", marginBottom: "1rem" },
                responsiveStyles: {
                  desktop: { fontSize: "2rem" },
                  tablet: { fontSize: "1.75rem" },
                  mobile: { fontSize: "1.5rem" },
                },
                position: { x: 50, y: 50, width: 400, height: 60 },
              },
              {
                id: "2",
                type: "paragraph",
                content: "This is a sample paragraph. Click to edit or drag new elements from the sidebar.",
                styles: { marginBottom: "1rem", color: "var(--color-muted-foreground)" },
                responsiveStyles: {
                  desktop: { fontSize: "1rem", lineHeight: "1.6" },
                  tablet: { fontSize: "0.95rem", lineHeight: "1.5" },
                  mobile: { fontSize: "0.9rem", lineHeight: "1.4" },
                },
                position: { x: 50, y: 130, width: 500, height: 80 },
              },
            ],
            order: 0,
            metadata: { title: "Main Page" },
          }

          // Load the default project
          onLoadProject([defaultPage])

          // Notify parent component to reset project state
          onProjectChange?.("", "Untitled Project", false)
        }

        toast({
          title: "Success",
          description: `Project "${name}" deleted successfully`,
        })
        await loadProjects() // Reload projects list
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (project: Project) => {
    const pages = (project.pages || []).map((page, index) => ({
      id: page.id,
      name: page.name,
      elements: page.json_structure?.elements || [],
      layout: page.json_structure?.layout,
      metadata: page.json_structure?.metadata || { title: page.name },
      order: index,
    }))

    const exportData = {
      id: project.id,
      name: project.name,
      pages: pages,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      version: "2.0.0", // Multi-page version
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: `Project "${project.name}" exported successfully`,
    })
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    try {
      const text = await file.text()
      const importedData = JSON.parse(text)

      // Support both old format (single page) and new format (multi-page)
      let importedPages: BuilderPage[] = []

      if (importedData.pages && Array.isArray(importedData.pages)) {
        // New multi-page format
        importedPages = importedData.pages
      } else if (importedData.elements && Array.isArray(importedData.elements)) {
        // Old single-page format - convert to multi-page
        importedPages = [{
          id: `page-${Date.now()}`,
          name: "Main Page",
          elements: importedData.elements,
          layout: importedData.layout,
          metadata: { title: importedData.name || "Main Page" },
          order: 0,
        }]
      } else {
        throw new Error("Invalid project file format")
      }

      if (!importedData.name || importedPages.length === 0) {
        throw new Error("Invalid project file format")
      }

      setLoading(true)
      const response = await projectsApi.create({
        clerk_id: user.id,
        name: importedData.name,
        description: "",
        pages: importedPages.map(page => ({
          name: page.name,
          elements: page.elements,
          layout: page.layout,
          metadata: page.metadata,
          order: page.order,
        })),
      })

      if (response.success) {
        onLoadProject(importedPages)
        toast({
          title: "Success",
          description: `Project "${importedData.name}" imported successfully`,
        })
        await loadProjects()
      }
    } catch (error) {
      console.error("Failed to import project:", error)
      toast({
        title: "Error",
        description: "Failed to import project file",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      event.target.value = ""
    }
  }

  const handleNewProject = () => {
    if (currentProjectId && hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to start a new project?")) {
        return
      }
    }

    // Reset to a new project with default template
    setCurrentProjectId(null)
    setProjectName("Untitled Project")

    // Create default page with sample elements
    const defaultPage: BuilderPage = {
      id: `page-${Date.now()}`,
      name: "Main Page",
      elements: [
        {
          id: "1",
          type: "heading",
          content: "Welcome to Your Website",
          styles: { fontSize: "2rem", marginBottom: "1rem" },
          responsiveStyles: {
            desktop: { fontSize: "2rem" },
            tablet: { fontSize: "1.75rem" },
            mobile: { fontSize: "1.5rem" },
          },
          position: { x: 50, y: 50, width: 400, height: 60 },
        },
        {
          id: "2",
          type: "paragraph",
          content: "This is a sample paragraph. Click to edit or drag new elements from the sidebar.",
          styles: { marginBottom: "1rem", color: "var(--color-muted-foreground)" },
          responsiveStyles: {
            desktop: { fontSize: "1rem", lineHeight: "1.6" },
            tablet: { fontSize: "0.95rem", lineHeight: "1.5" },
            mobile: { fontSize: "0.9rem", lineHeight: "1.4" },
          },
          position: { x: 50, y: 130, width: 500, height: 80 },
        },
      ],
      order: 0,
      metadata: { title: "Main Page" },
    }

    // Load the default project
    onLoadProject([defaultPage])

    // Notify parent component to reset project state
    onProjectChange?.("", "Untitled Project", false)

    toast({
      title: "Success",
      description: "New project created",
    })
  }

  return (
    <div className="flex items-center gap-2">
      {/* New Project */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNewProject}
        title="Start a new project"
      >
        <FolderOpen className="h-4 w-4 mr-2" />
        New
      </Button>

      {/* Save Project */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={(!currentProjectId || hasUnsavedChanges) ? "" : "opacity-50"}
            title={!currentProjectId ? "Save new project" : hasUnsavedChanges ? "Save changes" : "No changes to save"}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="mt-1"
              />
            </div>
            {currentProjectId && (
              <div className="text-sm text-muted-foreground">
                Updating existing project
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              {currentProjectId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentProjectId(null)
                    handleSave()
                  }}
                  disabled={loading}
                >
                  Save As New
                </Button>
              )}
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : currentProjectId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Project */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No saved projects found</div>
            ) : (
              <div className="grid gap-3">
                {projects.map((project) => (
                  <Card key={project.id} className="cursor-pointer hover:bg-accent/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {project.pages?.length || 0} pages
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.pages?.reduce((sum, p) => sum + (p.json_structure?.elements?.length || 0), 0) || 0} elements
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExport(project)
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(project.id, project.name)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                        <Button size="sm" onClick={() => handleLoad(project)}>
                          Load Project
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Project */}
      <div>
        <input type="file" accept=".json" onChange={handleImport} className="hidden" id="import-project" />
        <Button variant="outline" size="sm" asChild>
          <label htmlFor="import-project" className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </label>
        </Button>
      </div>
    </div>
  )
}
