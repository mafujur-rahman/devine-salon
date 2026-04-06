"use client";

import DashboardLayout from "@/app/page";
import {
    MdBarChart,
    MdPeople,
    MdContentCut,
    MdAttachMoney,
} from "react-icons/md";

export default function AdminDashboard() {
    const stats = [
        { title: "Total Revenue", value: "$12,450", icon: MdAttachMoney, change: "+15%", progress: 90 },
        { title: "Total Customers", value: "1,234", icon: MdPeople, change: "+23%", progress: 70 },
        { title: "Appointments", value: "156", icon: MdContentCut, change: "+12%", progress: 50 },
        { title: "Services Done", value: "892", icon: MdBarChart, change: "+8%", progress: 80 },
    ];

    return (
        <DashboardLayout>
            <div className="px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-offwhite/60">Welcome back, admin!</p>
                </div>

                {/* ==== TOP STATS ==== */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
                            >
                                {/* Top */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-[#dba627]/10">
                                        <Icon className="text-[#dba627]" size={22} />
                                    </div>

                                    <span className="text-green-500 text-sm font-semibold">
                                        {stat.change}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">
                                            {stat.title}
                                        </p>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {stat.value}
                                        </h2>
                                    </div>

                                    {/* Progress Circle */}
                                    <div className="relative w-14 h-14">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle
                                                cx="28"
                                                cy="28"
                                                r="24"
                                                stroke="#f3f4f6"
                                                strokeWidth="5"
                                                fill="none"
                                            />
                                            <circle
                                                cx="28"
                                                cy="28"
                                                r="24"
                                                stroke="#dba627"
                                                strokeWidth="5"
                                                fill="none"
                                                strokeDasharray={150}
                                                strokeDashoffset={
                                                    150 - (150 * stat.progress) / 100
                                                }
                                                strokeLinecap="round"
                                            />
                                        </svg>

                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                                            {stat.progress}%
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 mt-4">
                                    Compared to last period
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* ==== BOTTOM SECTION ==== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                    {/* Assigned Controls (Bar Style) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Assigned Services
                        </h3>

                        <div className="space-y-4">
                            {[70, 50, 90, 60, 80].map((val, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                                        <span>Service {i + 1}</span>
                                        <span>{val}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full">
                                        <div
                                            className="h-2 rounded-full bg-[#dba627]"
                                            style={{ width: `${val}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Framework Progress (Line Style fake) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Monthly Growth
                        </h3>

                        <div className="flex items-end justify-between h-40">
                            {[20, 40, 35, 60, 75, 65, 85, 70].map((h, i) => (
                                <div
                                    key={i}
                                    className="w-3 rounded-md bg-[#dba627]/80"
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>

                        <p className="text-xs text-gray-400 mt-4">
                            Performance increasing steadily
                        </p>
                    </div>
                </div>

                {/* ==== EXTRA SMALL CARDS ==== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {["Today Bookings", "Pending Services", "Completed Jobs"].map(
                        (title, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                            >
                                <p className="text-sm text-gray-500 mb-2">{title}</p>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {Math.floor(Math.random() * 200)}
                                </h2>

                                <div className="mt-3 h-1 w-full bg-gray-100 rounded-full">
                                    <div className="h-1 bg-[#dba627] w-2/3 rounded-full" />
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}