"use client";

import DashboardLayout from "@/app/page";
import { MdBarChart, MdPeople, MdContentCut, MdAttachMoney } from "react-icons/md";

export default function AdminDashboard() {


    const stats = [
        { title: "Total Revenue", value: "$12,450", icon: MdAttachMoney, change: "+15%" },
        { title: "Total Customers", value: "1,234", icon: MdPeople, change: "+23%" },
        { title: "Appointments", value: "156", icon: MdContentCut, change: "+12%" },
        { title: "Services Done", value: "892", icon: MdBarChart, change: "+8%" },
    ];

    return (
        <DashboardLayout>
            <div className="px-4">
                <div className="mb-8 ">
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-offwhite/60">Welcome back, admin!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white/5 border border-[#dba627]/20 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <stat.icon className="text-[#dba627]" size={32} />
                                <span className="text-green-500 text-sm font-semibold">{stat.change}</span>
                            </div>
                            <h3 className="text-offwhite/60 text-sm mb-1">{stat.title}</h3>
                            <p className="text-white text-2xl font-bold">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Add more admin-specific content */}
            </div>
        </DashboardLayout>
    );
}