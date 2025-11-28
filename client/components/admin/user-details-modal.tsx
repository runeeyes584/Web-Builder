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
import { Calendar, FileText, Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";

export interface UserDetailsModalProps {
    userId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserDetailsModal({ userId, open, onOpenChange }: UserDetailsModalProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && userId) {
            loadUserDetails();
        }
    }, [open, userId]);

    const loadUserDetails = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getUserById(userId);
            setUser(response.data);
        } catch (error) {
            console.error("Failed to load user details:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-slate-900">Chi Tiết Người Dùng</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Xem thông tin chi tiết về người dùng này
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                            <p className="text-slate-600">Đang tải thông tin...</p>
                        </div>
                    </div>
                ) : user ? (
                    <div className="space-y-6">
                        {/* User Info Card */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <User className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                                        {user.first_name || user.last_name
                                            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                            : "Chưa có tên"}
                                    </h3>
                                    <p className="text-slate-600 mb-3">{user.email}</p>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${user.role === "admin"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-blue-100 text-blue-700"
                                                }`}
                                        >
                                            {user.role === "admin" ? "Quản trị" : "Người dùng"}
                                        </span>
                                        {user.username && (
                                            <span className="text-sm text-slate-600">@{user.username}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-600">Ngày tham gia</div>
                                        <div className="text-base font-semibold text-slate-900">
                                            {format(new Date(user.created_at), "d MMMM yyyy", { locale: vi })}
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
                                            {format(new Date(user.updated_at), "d MMMM yyyy", { locale: vi })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Projects */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Dự án ({user.projects?.length || 0})
                                </h3>
                            </div>
                            {user.projects && user.projects.length > 0 ? (
                                <div className="space-y-3">
                                    {user.projects.map((project: any) => (
                                        <div
                                            key={project.id}
                                            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0">
                                                        <FileText className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-slate-900 truncate">
                                                            {project.name}
                                                        </div>
                                                        <div className="text-sm text-slate-500 mt-0.5">
                                                            {project.pages?.length || 0} trang • Cập nhật{" "}
                                                            {format(new Date(project.updated_at), "d MMM yyyy", { locale: vi })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span
                                                        className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${project.is_public
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {project.is_public ? "Công khai" : "Riêng tư"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
                                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Chưa có dự án nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-500">Không thể tải thông tin người dùng</p>
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
