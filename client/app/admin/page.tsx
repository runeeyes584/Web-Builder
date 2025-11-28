"use client";

import { adminApi, type AdminStats, type Project, type User } from "@/api/admin-api";
import { AdminStatsComponent } from "@/components/admin/admin-stats";
import { ProjectsTable } from "@/components/admin/projects-table";
import { UsersTable } from "@/components/admin/users-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, useClerk } from "@clerk/nextjs";
import { BarChart3, FolderOpen, Loader2, LogOut, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
    const { userId, isLoaded } = useAuth();
    const { signOut } = useClerk();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [activeTab, setActiveTab] = useState("stats");

    useEffect(() => {
        if (isLoaded && !userId) {
            router.push("/");
        } else if (isLoaded && userId) {
            loadData();
        }
    }, [isLoaded, userId, router]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Check if user is admin first
            if (userId) {
                const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/users/status/${userId}`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.role !== "admin") {
                        router.push("/"); // Redirect non-admins to home
                        return;
                    }
                }
            }

            const [usersRes, projectsRes, statsRes] = await Promise.all([
                adminApi.getAllUsers(),
                adminApi.getAllProjects(),
                adminApi.getStats(),
            ]);

            setUsers(usersRes.data);
            setProjects(projectsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to load admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="light min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Đang tải bảng điều khiển...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="light min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <BarChart3 className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900">Bảng Điều Khiển Admin</h1>
                                        <p className="text-slate-600 mt-1">Quản lý người dùng và dự án</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={loadData}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    size="lg"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Làm mới
                                </Button>
                                <Button
                                    onClick={() => signOut(() => router.push("/"))}
                                    variant="outline"
                                    className="border-slate-300 hover:bg-slate-100 text-slate-700"
                                    size="lg"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Đăng xuất
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white border border-slate-200 p-1.5 h-auto">
                        <TabsTrigger
                            value="stats"
                            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-6 py-3 rounded-lg font-medium"
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Thống Kê
                        </TabsTrigger>
                        <TabsTrigger
                            value="users"
                            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-6 py-3 rounded-lg font-medium"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Người Dùng ({users.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="projects"
                            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-6 py-3 rounded-lg font-medium"
                        >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Dự Án ({projects.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats" className="space-y-6 mt-6">
                        {stats && <AdminStatsComponent stats={stats} />}
                    </TabsContent>

                    <TabsContent value="users" className="space-y-6 mt-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                            <UsersTable users={users} onUserDeleted={loadData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-6 mt-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                            <ProjectsTable projects={projects} onProjectDeleted={loadData} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
