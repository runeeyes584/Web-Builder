// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export interface Project {
  id: string;
  clerk_id: string;
  name: string;
  description?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
  pages?: {
    id: string;
    name: string;
    json_structure: {
      elements: any[];
      version: string;
      layout?: {
        headerHeight: number;
        footerHeight: number;
        sections: { id: string; height: number }[];
      };
      metadata?: {
        title?: string;
        description?: string;
        keywords?: string[];
      };
    };
    updated_at: string;
  }[];
}

export interface CreateProjectRequest {
  clerk_id: string;
  name: string;
  description?: string;
  elements?: any[];
  layout?: {
    headerHeight: number;
    footerHeight: number;
    sections: { id: string; height: number }[];
  };
  pages?: {
    name: string;
    elements: any[];
    layout?: {
      headerHeight: number;
      footerHeight: number;
      sections: { id: string; height: number }[];
    };
    metadata?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    order: number;
  }[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  elements?: any[];
  layout?: {
    headerHeight: number;
    footerHeight: number;
    sections: { id: string; height: number }[];
  };
  pages?: {
    id?: string;
    name: string;
    elements: any[];
    layout?: {
      headerHeight: number;
      footerHeight: number;
      sections: { id: string; height: number }[];
    };
    metadata?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    order: number;
  }[];
}

// API Client Helper
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Projects API
export const projectsApi = {
  /**
   * Get all projects
   */
  getAll: async (): Promise<ApiResponse<Project[]>> => {
    return apiRequest<Project[]>('/api/projects', { method: 'GET' });
  },

  /**
   * Get projects by user (LOAD PROJECTS)
   */
  getByUser: async (clerkId: string): Promise<ApiResponse<Project[]>> => {
    return apiRequest<Project[]>(`/api/projects/user/${clerkId}`, { method: 'GET' });
  },

  /**
   * Get single project by ID (LOAD PROJECT)
   */
  getById: async (projectId: string): Promise<ApiResponse<Project>> => {
    return apiRequest<Project>(`/api/projects/${projectId}`, { method: 'GET' });
  },

  /**
   * Create new project (SAVE PROJECT)
   */
  create: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    return apiRequest<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update project
   */
  update: async (
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> => {
    return apiRequest<Project>(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete project
   */
  delete: async (projectId: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/api/projects/${projectId}`, { method: 'DELETE' });
  },
};
