"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProjectManager, type ProjectData } from "@/lib/project-manager"
import { Save, FolderOpen, Download, Upload, Trash2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProjectManagerProps {
  elements: any[]
  onLoadProject: (elements: any[]) => void
  currentProjectName?: string
}

export function ProjectManagerComponent({ elements, onLoadProject, currentProjectName }: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState(currentProjectName || "")
  const { toast } = useToast()

  useEffect(() => {
    setProjects(ProjectManager.getAllProjects())
  }, [])

  const handleSave = () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      })
      return
    }

    try {
      const savedProject = ProjectManager.saveProject(projectName.trim(), elements)
      setProjects(ProjectManager.getAllProjects())
      setSaveDialogOpen(false)
      toast({
        title: "Success",
        description: `Project "${savedProject.name}" saved successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      })
    }
  }

  const handleLoad = (project: ProjectData) => {
    onLoadProject(project.elements)
    setLoadDialogOpen(false)
    toast({
      title: "Success",
      description: `Project "${project.name}" loaded successfully`,
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      ProjectManager.deleteProject(id)
      setProjects(ProjectManager.getAllProjects())
      toast({
        title: "Success",
        description: `Project "${name}" deleted successfully`,
      })
    }
  }

  const handleExport = (project: ProjectData) => {
    ProjectManager.exportProject(project)
    toast({
      title: "Success",
      description: `Project "${project.name}" exported successfully`,
    })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    ProjectManager.importProject(file)
      .then((project) => {
        const savedProject = ProjectManager.saveProject(project.name, project.elements)
        setProjects(ProjectManager.getAllProjects())
        onLoadProject(project.elements)
        toast({
          title: "Success",
          description: `Project "${project.name}" imported successfully`,
        })
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      })

    // Reset input
    event.target.value = ""
  }

  return (
    <div className="flex items-center gap-2">
      {/* Save Project */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Project</Button>
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
            {projects.length === 0 ? (
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
                            {project.elements.length} elements
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
                          {new Date(project.updatedAt).toLocaleDateString()}
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
