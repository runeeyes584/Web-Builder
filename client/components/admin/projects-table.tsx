"use client";

import type { Project } from "@/api/admin-api";
import { adminApi } from "@/api/admin-api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Eye, FileText, Globe, Lock, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProjectDetailsModal } from "./project-details-modal";

interface ProjectsTableProps {
    projects: Project[];
    onProjectDeleted: () => void;
}

export function ProjectsTable({ projects, onProjectDeleted }: ProjectsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-newest" | "date-oldest">("date-newest");
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Filter and sort projects
    const filteredAndSortedProjects = projects
        .filter((project) => {
            const query = searchQuery.toLowerCase();
            return (
                project.name.toLowerCase().includes(query) ||
                project.user.email.toLowerCase().includes(query) ||
                project.description?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortBy === "name-asc") {
                return a.name.localeCompare(b.name, "vi");
            } else if (sortBy === "name-desc") {
                return b.name.localeCompare(a.name, "vi");
            } else if (sortBy === "date-newest") {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA;
            } else { // sortBy === "date-oldest"
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateA - dateB;
            }
        });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);

    // Reset to first page when filters change
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const paginatedProjects = filteredAndSortedProjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleViewDetails = (project: Project) => {
        setSelectedProject(project);
        setShowDetailsModal(true);
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        setIsDeleting(true);
        try {
            await adminApi.deleteProject(projectToDelete.id);
            onProjectDeleted();
            setProjectToDelete(null);
        } catch (error) {
            console.error("Failed to delete project:", error);
            alert("Không thể xóa dự án. Vui lòng thử lại.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm dự án theo tên, chủ sở hữu hoặc mô tả..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 !bg-white border-slate-200 focus:!bg-white focus-visible:!bg-white"
                    />
                </div>

                {/* Sort by */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[200px] h-12 !bg-white border-slate-200 text-slate-900 font-medium">
                        <SelectValue className="text-slate-900 font-medium" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="name-asc" className="text-slate-900 font-medium">Tên: A → Z</SelectItem>
                        <SelectItem value="name-desc" className="text-slate-900 font-medium">Tên: Z → A</SelectItem>
                        <SelectItem value="date-newest" className="text-slate-900 font-medium">Ngày: Mới nhất</SelectItem>
                        <SelectItem value="date-oldest" className="text-slate-900 font-medium">Ngày: Cũ nhất</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold text-slate-700">Tên Dự Án</TableHead>
                            <TableHead className="font-semibold text-slate-700">Chủ Sở Hữu</TableHead>
                            <TableHead className="font-semibold text-slate-700">Trang</TableHead>
                            <TableHead className="font-semibold text-slate-700">Hiển Thị</TableHead>
                            <TableHead className="font-semibold text-slate-700">Tạo Lúc</TableHead>
                            <TableHead className="font-semibold text-slate-700">Cập Nhật</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Hành Động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                    Không tìm thấy dự án nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedProjects.map((project) => (
                                <TableRow key={project.id} className="hover:bg-slate-50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="max-w-xs">
                                                <div className="font-medium text-slate-900">{project.name}</div>
                                                {project.description && (
                                                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                                        {project.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium text-slate-900">
                                                {project.user.first_name || project.user.last_name
                                                    ? `${project.user.first_name || ""} ${project.user.last_name || ""}`.trim()
                                                    : "Chưa có tên"}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">{project.user.email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                                            {project._count.pages}
                                        </span>
                                    </TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {format(new Date(project.created_at), "d MMM yyyy", { locale: vi })}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {format(new Date(project.updated_at), "d MMM yyyy", { locale: vi })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(project)}
                                                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800"
                                            >
                                                <Eye className="h-4 w-4 mr-1.5" />
                                                Xem
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setProjectToDelete(project)}
                                                className="bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" />
                                                Xóa
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-500">
                    Hiển thị {paginatedProjects.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} trong số {filteredAndSortedProjects.length} dự án
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-9 w-9 p-0 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`h-9 w-9 p-0 font-medium transition-all ${currentPage === page
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200"
                                    }`}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-9 w-9 p-0 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Xóa Dự Án</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                            Bạn có chắc chắn muốn xóa <strong>{projectToDelete?.name}</strong>?
                            <br />
                            <br />
                            Thao tác này sẽ xóa vĩnh viễn dự án và tất cả các trang ({projectToDelete?._count.pages} trang).
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProject}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Project Details Modal */}
            {selectedProject && (
                <ProjectDetailsModal
                    projectId={selectedProject.id}
                    open={showDetailsModal}
                    onOpenChange={setShowDetailsModal}
                />
            )}
        </div>
    );
}
