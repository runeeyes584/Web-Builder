"use client";

import { adminApi } from "@/api/admin-api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, FileText, Globe, Loader2, Lock, User } from "lucide-react";
import { useEffect, useState } from "react";

export interface ProjectDetailsModalProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProjectDetailsModal({ projectId, open, onOpenChange }: ProjectDetailsModalProps) {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && projectId) {
            loadProjectDetails();
        }
    }, [open, projectId]);

    const loadProjectDetails = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getProjectById(projectId);
            setProject(response.data);
        } catch (error) {
            console.error("Failed to load project details:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-slate-900">Chi Tiết Dự Án</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Xem thông tin chi tiết về dự án này
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                            <p className="text-slate-600">Đang tải thông tin...</p>
                        </div>
                    </div>
                ) : project ? (
                    <div className="space-y-6">
                        {/* Project Info Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{project.name}</h3>
                                    {project.description && (
                                        <p className="text-slate-600 mb-3">{project.description}</p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        {project.is_public ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700">
                                                <Globe className="h-3.5 w-3.5" />
                                                Công khai
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600">
                                                <Lock className="h-3.5 w-3.5" />
                                                Riêng tư
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Owner Info */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-600">Chủ sở hữu</div>
                                    <div className="text-base font-semibold text-slate-900">
                                        {project.user.first_name || project.user.last_name
                                            ? `${project.user.first_name || ""} ${project.user.last_name || ""}`.trim()
                                            : "Chưa có tên"}
                                    </div>
                                    <div className="text-sm text-slate-500">{project.user.email}</div>
                                </div>
                            </div>
                        </div>

                        {/* Date Info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Ngày tạo</div>
                                        <div className="text-base font-semibold text-slate-900">
                                            {format(new Date(project.created_at), "d MMMM yyyy", { locale: vi })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Cập nhật lần cuối</div>
                                        <div className="text-base font-semibold text-slate-900">
                                            {format(new Date(project.updated_at), "d MMMM yyyy", { locale: vi })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Collaborators */}
                        {project.collaborators && project.collaborators.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Cộng tác viên ({project.collaborators.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {project.collaborators.map((collab: any) => (
                                        <div
                                            key={collab.id}
                                            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">
                                                            {collab.user?.first_name || collab.user?.last_name
                                                                ? `${collab.user.first_name || ""} ${collab.user.last_name || ""}`.trim()
                                                                : "Chưa có tên"}
                                                        </div>
                                                        <div className="text-sm text-slate-500">{collab.user?.email}</div>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${collab.role === "owner"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : collab.role === "editor"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {collab.role === "owner"
                                                        ? "Chủ sở hữu"
                                                        : collab.role === "editor"
                                                            ? "Biên tập"
                                                            : "Xem"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pages */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Trang ({project.pages?.length || 0})
                                </h3>
                            </div>
                            {project.pages && project.pages.length > 0 ? (
                                <div className="space-y-3">
                                    {project.pages.map((page: any) => (
                                        <div
                                            key={page.id}
                                            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                                                        <FileText className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-slate-900 truncate">
                                                            {page.name}
                                                        </div>
                                                        <div className="text-sm text-slate-500 mt-0.5">
                                                            Cập nhật {format(new Date(page.updated_at), "d MMM yyyy", { locale: vi })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
                                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Chưa có trang nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-500">Không thể tải thông tin dự án</p>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-200">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
