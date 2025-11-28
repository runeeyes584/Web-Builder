const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface User {
    id: string;
    clerk_id: string;
    email: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    role: string;
    is_deleted?: boolean;
    created_at: Date;
    updated_at: Date;
    projectsCount: number;
}

export interface Project {
    id: string;
    clerk_id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    created_at: Date;
    updated_at: Date;
    user: {
        id: string;
        email: string;
        username: string | null;
        first_name: string | null;
        last_name: string | null;
    };
    pages: Array<{
        id: string;
        name: string;
        updated_at: Date;
    }>;
    _count: {
        pages: number;
    };
}

export interface AdminStats {
    totalUsers: number;
    totalProjects: number;
    activeProjects: number;
    newUsers: number;
    publicProjects: number;
}

export const adminApi = {
    // Users
    getAllUsers: async (): Promise<{ success: boolean; data: User[]; count: number }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`);
        if (!response.ok) throw new Error("Failed to fetch users");
        return response.json();
    },

    getUserById: async (id: string): Promise<{ success: boolean; data: any }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        return response.json();
    },

    deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete user");
        return response.json();
    },

    restoreUser: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/restore`, {
            method: "POST",
        });
        if (!response.ok) throw new Error("Failed to restore user");
        return response.json();
    },

    // Projects
    getAllProjects: async (): Promise<{ success: boolean; data: Project[]; count: number }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/projects`);
        if (!response.ok) throw new Error("Failed to fetch projects");
        return response.json();
    },

    getProjectById: async (id: string): Promise<{ success: boolean; data: any }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/projects/${id}`);
        if (!response.ok) throw new Error("Failed to fetch project");
        return response.json();
    },

    deleteProject: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete project");
        return response.json();
    },

    // Stats
    getStats: async (): Promise<{ success: boolean; data: AdminStats }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
        if (!response.ok) throw new Error("Failed to fetch stats");
        return response.json();
    },
};
