"use client";

import type { AdminStats } from "@/api/admin-api";
import { BarChart3, FolderOpen, TrendingUp, Users } from "lucide-react";

interface AdminStatsProps {
    stats: AdminStats;
}

export function AdminStatsComponent({ stats }: AdminStatsProps) {
    const statCards = [
        {
            title: "Tổng Người Dùng",
            value: stats.totalUsers,
            icon: Users,
            description: `${stats.newUsers} mới trong tháng`,
            gradient: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
        },
        {
            title: "Tổng Dự Án",
            value: stats.totalProjects,
            icon: FolderOpen,
            description: `${stats.publicProjects} công khai`,
            gradient: "from-purple-500 to-pink-500",
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
        },
        {
            title: "Dự Án Hoạt Động",
            value: stats.activeProjects,
            icon: TrendingUp,
            description: "Cập nhật trong 7 ngày",
            gradient: "from-green-500 to-emerald-500",
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
        },
        {
            title: "Dự Án Công Khai",
            value: stats.publicProjects,
            icon: BarChart3,
            description: `${Math.round((stats.publicProjects / stats.totalProjects) * 100)}% tổng số`,
            gradient: "from-orange-500 to-red-500",
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.title}
                        className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                            <p className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</p>
                            <p className="text-sm text-slate-500">{stat.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
