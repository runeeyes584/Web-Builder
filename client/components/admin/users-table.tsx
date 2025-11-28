"use client";

import type { User } from "@/api/admin-api";
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
import { Eye, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { UserDetailsModal } from "./user-details-modal";

interface UsersTableProps {
    users: User[];
    onUserDeleted: () => void;
}

export function UsersTable({ users, onUserDeleted }: UsersTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-newest" | "date-oldest">("date-newest");

    // Filter and sort users
    const filteredAndSortedUsers = users
        .filter((user) => {
            const query = searchQuery.toLowerCase();
            return (
                user.email.toLowerCase().includes(query) ||
                user.username?.toLowerCase().includes(query) ||
                user.first_name?.toLowerCase().includes(query) ||
                user.last_name?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortBy === "name-asc") {
                const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.email;
                const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim() || b.email;
                return nameA.localeCompare(nameB, "vi");
            } else if (sortBy === "name-desc") {
                const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.email;
                const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim() || b.email;
                return nameB.localeCompare(nameA, "vi");
            } else if (sortBy === "date-newest") {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA;
            } else {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateA - dateB;
            }
        });

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await adminApi.deleteUser(userToDelete.id);
            onUserDeleted();
            setUserToDelete(null);
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("Không thể xóa người dùng. Vui lòng thử lại.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleViewDetails = (user: User) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
    };

    const [userToRestore, setUserToRestore] = useState<User | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const handleRestoreUser = async () => {
        if (!userToRestore) return;

        setIsRestoring(true);
        try {
            await adminApi.restoreUser(userToRestore.id);
            onUserDeleted(); // Refresh list
            setUserToRestore(null);
        } catch (error) {
            console.error("Failed to restore user:", error);
            alert("Không thể khôi phục người dùng. Vui lòng thử lại.");
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm người dùng theo tên, email hoặc username..."
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

            {/* Results count */}
            <div className="text-sm text-slate-600">
                Hiển thị <span className="font-semibold text-slate-900">{filteredAndSortedUsers.length}</span> / {users.length} người dùng
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold text-slate-900">Người Dùng</TableHead>
                            <TableHead className="font-semibold text-slate-900">Vai Trò</TableHead>
                            <TableHead className="font-semibold text-slate-900 text-center">Dự Án</TableHead>
                            <TableHead className="font-semibold text-slate-900">Trạng Thái</TableHead>
                            <TableHead className="font-semibold text-slate-900">Ngày Tạo</TableHead>
                            <TableHead className="font-semibold text-slate-900 text-right">Hành Động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    Không tìm thấy người dùng nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedUsers.map((user) => (
                                <TableRow key={user.id} className={`hover:bg-slate-50 ${user.is_deleted ? "bg-slate-50/50" : ""}`}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${user.is_deleted ? "bg-slate-400" : "bg-gradient-to-br from-indigo-500 to-purple-500"
                                                }`}>
                                                {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className={`font-medium ${user.is_deleted ? "text-slate-500 line-through" : "text-slate-900"}`}>
                                                    {user.first_name || user.last_name
                                                        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                                        : user.username || "Chưa đặt tên"}
                                                </div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === "admin"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-blue-100 text-blue-800"
                                            }`}>
                                            {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">
                                            {user.projectsCount || 0}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {user.is_deleted ? (
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                                                Đã xóa
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                                Hoạt động
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: vi })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(user)}
                                                className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {user.is_deleted ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setUserToRestore(user)}
                                                    className="h-8 px-2 text-xs bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                                                >
                                                    Khôi phục
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setUserToDelete(user)}
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedUser && (
                <UserDetailsModal
                    userId={selectedUser.id}
                    open={showDetailsModal}
                    onOpenChange={setShowDetailsModal}
                />
            )}

            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-700">
                            Hành động này sẽ vô hiệu hóa tài khoản của người dùng <b className="text-slate-900">{userToDelete?.email}</b>.
                            Dữ liệu sẽ được bảo lưu và có thể khôi phục sau này.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="text-slate-700">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa người dùng"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!userToRestore} onOpenChange={() => setUserToRestore(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Khôi phục tài khoản?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-700">
                            Bạn có chắc chắn muốn khôi phục tài khoản của người dùng <b className="text-slate-900">{userToRestore?.email}</b>?
                            Họ sẽ có thể đăng nhập và truy cập lại dữ liệu của mình.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRestoring} className="text-slate-700">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRestoreUser}
                            disabled={isRestoring}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isRestoring ? "Đang khôi phục..." : "Khôi phục"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
