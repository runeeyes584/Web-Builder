"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function DeletedAccountCheck() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { signOut } = useClerk();
    const [isDeleted, setIsDeleted] = useState(false);

    useEffect(() => {
        const checkUserStatus = async () => {
            if (!isLoaded || !isSignedIn || !user) return;

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/status/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.is_deleted) {
                        setIsDeleted(true);
                    }
                }
            } catch (error) {
                console.error("Failed to check user status:", error);
            }
        };

        checkUserStatus();
    }, [isLoaded, isSignedIn, user]);

    const handleSignOut = async () => {
        await signOut();
        window.location.href = "/";
    };

    if (!isDeleted) return null;

    return (
        <AlertDialog open={true}>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">Tài khoản đã bị vô hiệu hóa</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tài khoản của bạn đã bị xóa hoặc vô hiệu hóa bởi quản trị viên.
                        <br />
                        Vui lòng liên hệ với quản trị viên để biết thêm chi tiết hoặc khôi phục tài khoản.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button onClick={handleSignOut} variant="destructive">
                        Đăng xuất
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
