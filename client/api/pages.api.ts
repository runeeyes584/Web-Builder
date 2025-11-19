const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export interface PageUpdateData {
  name?: string
  json_structure?: any
  order?: number
}

export const pagesApi = {
  // Update page (name, json_structure, order)
  update: async (pageId: string, data: PageUpdateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pages/${pageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error updating page:", error)
      return {
        success: false,
        message: "Failed to update page",
      }
    }
  },

  // Delete page
  delete: async (pageId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pages/${pageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error deleting page:", error)
      return {
        success: false,
        message: "Failed to delete page",
      }
    }
  },
}
