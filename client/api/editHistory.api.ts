// Types
export type EditAction = 'ADD' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'MOVE';

export interface EditHistory {
  id: string;
  page_id: string;
  clerk_id: string;
  action: EditAction;
  component_snapshot: any;
  created_at: string;
  user?: {
    id: string;
    username: string | null;
    email: string;
  };
  page?: {
    id: string;
    name: string;
    project?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateEditHistoryRequest {
  page_id: string;
  clerk_id: string;
  action: EditAction;
  component_snapshot: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  deleted?: number;
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const url = `${baseUrl}${endpoint}`;

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
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// API client
export const editHistoryApi = {
  // GET - Lấy history của 1 page (cho Undo/Redo)
  getHistoryByPage: async (
    pageId: string,
    limit: number = 50
  ): Promise<ApiResponse<EditHistory[]>> => {
    return apiRequest<EditHistory[]>(
      `/api/history/page/${pageId}?limit=${limit}`
    );
  },

  // GET - Lấy history của 1 user
  getHistoryByUser: async (
    clerkId: string,
    limit: number = 50
  ): Promise<ApiResponse<EditHistory[]>> => {
    return apiRequest<EditHistory[]>(
      `/api/history/user/${clerkId}?limit=${limit}`
    );
  },

  // GET - Lấy 1 history record cụ thể
  getHistoryById: async (id: string): Promise<ApiResponse<EditHistory>> => {
    return apiRequest<EditHistory>(`/api/history/${id}`);
  },

  // POST - Tạo history record mới
  createHistory: async (
    data: CreateEditHistoryRequest
  ): Promise<ApiResponse<EditHistory>> => {
    return apiRequest<EditHistory>('/api/history', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // POST - Cleanup history cũ (giữ X records gần nhất)
  cleanupOldHistory: async (
    pageId: string,
    keepLast: number = 100
  ): Promise<ApiResponse<{ deleted: number }>> => {
    return apiRequest<{ deleted: number }>(
      `/api/history/page/${pageId}/cleanup`,
      {
        method: 'POST',
        body: JSON.stringify({ keepLast }),
      }
    );
  },

  // DELETE - Xóa 1 history record
  deleteHistory: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/history/${id}`, {
      method: 'DELETE',
    });
  },

  // DELETE - Xóa tất cả history của 1 page
  deleteAllHistoryByPage: async (pageId: string): Promise<ApiResponse> => {
    return apiRequest(`/api/history/page/${pageId}`, {
      method: 'DELETE',
    });
  },
};
