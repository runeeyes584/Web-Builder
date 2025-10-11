export interface ProjectData {
  id: string
  name: string
  elements: any[]
  createdAt: string
  updatedAt: string
  version: string
}

export class ProjectManager {
  private static STORAGE_KEY = "website-builder-projects"
  private static CURRENT_PROJECT_KEY = "website-builder-current-project"

  static saveProject(name: string, elements: any[]): ProjectData {
    const projects = this.getAllProjects()
    const existingProject = projects.find((p) => p.name === name)

    const projectData: ProjectData = {
      id: existingProject?.id || `project-${Date.now()}`,
      name,
      elements,
      createdAt: existingProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: "1.0.0",
    }

    const updatedProjects = existingProject
      ? projects.map((p) => (p.id === existingProject.id ? projectData : p))
      : [...projects, projectData]

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProjects))
    localStorage.setItem(this.CURRENT_PROJECT_KEY, JSON.stringify(projectData))

    return projectData
  }

  static loadProject(id: string): ProjectData | null {
    const projects = this.getAllProjects()
    const project = projects.find((p) => p.id === id)

    if (project) {
      localStorage.setItem(this.CURRENT_PROJECT_KEY, JSON.stringify(project))
    }

    return project || null
  }

  static getAllProjects(): ProjectData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static deleteProject(id: string): void {
    const projects = this.getAllProjects()
    const updatedProjects = projects.filter((p) => p.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProjects))
  }

  static getCurrentProject(): ProjectData | null {
    try {
      const stored = localStorage.getItem(this.CURRENT_PROJECT_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  static exportProject(project: ProjectData): void {
    const dataStr = JSON.stringify(project, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  static importProject(file: File): Promise<ProjectData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target?.result as string)

          // Validate project structure
          if (!projectData.name || !projectData.elements || !Array.isArray(projectData.elements)) {
            throw new Error("Invalid project file format")
          }

          // Generate new ID to avoid conflicts
          projectData.id = `project-${Date.now()}`
          projectData.updatedAt = new Date().toISOString()

          resolve(projectData)
        } catch (error) {
          reject(new Error("Failed to parse project file"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }
}
