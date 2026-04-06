// app/dashboard/manager/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    MdBarChart,
    MdPeople,
    MdContentCut,
    MdAttachMoney,
    MdEvent,
    MdPendingActions,
    MdTaskAlt,
} from "react-icons/md";
import DashboardLayout from "@/app/page";

// API base URL
const API_BASE = "https://saloon.mrshakil.com/api";

// Helper for authenticated requests
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
    }

    return response.json();
}

export default function ManagerDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for dashboard data
    const [stats, setStats] = useState({
        monthlyRevenue: 0,
        activeCustomers: 0,
        pendingAppointments: 0,
        teamPerformance: 0,
    });

    const [staffList, setStaffList] = useState([]);
    const [staffPerformance, setStaffPerformance] = useState([]);
    const [weeklyRevenue, setWeeklyRevenue] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [monthlyCompletedCount, setMonthlyCompletedCount] = useState(0);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        setLoading(true);
        setError(null);

        try {
            const today = new Date().toISOString().split('T')[0];
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

            const [
                staffData,
                staffPerfData,
                appointmentsData,
                invoicesData,
                pendingData,
                todayAppointmentsData
            ] = await Promise.all([
                apiFetch("/users/staff/"),
                apiFetch("/staff/get-staff-performance/"),
                apiFetch("/appointments/get-all-appointments/?status=completed"),
                apiFetch("/invoices/get-all-invoices/"),
                apiFetch("/appointments/get-all-appointments/?status=booked"),
                apiFetch(`/appointments/get-all-appointments/?date=${today}`),
            ]);

            const staff = staffData.data || [];
            setStaffList(staff);

            const performance = staffPerfData.data || [];
            setStaffPerformance(performance);

            const invoices = invoicesData.data || [];
            const monthlyInvoices = invoices.filter((inv) => {
                const invDate = inv.created_at.split('T')[0];
                return invDate >= firstDayOfMonth;
            });
            const monthlyRevenue = monthlyInvoices.reduce(
                (sum, inv) => sum + parseFloat(inv.total_amount),
                0
            );

            const appointments = appointmentsData.data || [];
            const uniqueCustomers = new Set(appointments.map((apt) => apt.customer_name));
            const activeCustomers = uniqueCustomers.size;

            const avgPerformance = performance.length > 0
                ? performance.reduce((sum, p) => sum + (p.completed_appointments || 0), 0) / performance.length
                : 0;
            const teamPerformance = Math.min(100, Math.round((avgPerformance / 50) * 100));

            const weeklyData = await getWeeklyRevenue();
            setWeeklyRevenue(weeklyData);

            const pending = pendingData.data || [];
            setPendingCount(pending.length);

            const todayApts = todayAppointmentsData.data || [];
            setTodayAppointments(todayApts);

            const monthlyCompleted = appointments.filter((apt) => {
                const aptDate = apt.date;
                return aptDate >= firstDayOfMonth;
            });
            setMonthlyCompletedCount(monthlyCompleted.length);

            setStats({
                monthlyRevenue,
                activeCustomers,
                pendingAppointments: pending.length,
                teamPerformance,
            });

        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            setError(err instanceof Error ? err.message : "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }

    async function getWeeklyRevenue() {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const revenue = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];

            try {
                const invoicesData = await apiFetch(`/invoices/get-all-invoices/?created_at=${dateStr}`);
                const dailyTotal = (invoicesData.data || []).reduce(
                    (sum, inv) => sum + parseFloat(inv.total_amount),
                    0
                );
                revenue.push({ day: dayName, revenue: dailyTotal });
            } catch {
                revenue.push({ day: dayName, revenue: 0 });
            }
        }

        return revenue;
    }

    const formatCurrency = (amount) => {
        return `$${amount.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627] mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-[#dba627] text-white rounded-lg hover:bg-[#c49520]"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const topStats = [
        {
            title: "Monthly Revenue",
            value: formatCurrency(stats.monthlyRevenue),
            icon: MdAttachMoney,
            change: "+12%",
            progress: Math.min(100, Math.round((stats.monthlyRevenue / 10000) * 100))
        },
        {
            title: "Active Customers",
            value: stats.activeCustomers.toString(),
            icon: MdPeople,
            change: "+18%",
            progress: Math.min(100, Math.round((stats.activeCustomers / 500) * 100))
        },
        {
            title: "Pending Appointments",
            value: stats.pendingAppointments.toString(),
            icon: MdContentCut,
            change: stats.pendingAppointments > 30 ? "+5%" : "-5%",
            progress: Math.min(100, Math.round((stats.pendingAppointments / 50) * 100))
        },
        {
            title: "Team Performance",
            value: `${stats.teamPerformance}%`,
            icon: MdBarChart,
            change: "+7%",
            progress: stats.teamPerformance
        },
    ];

    const topPerformingStaff = staffPerformance
        .sort((a, b) => b.completed_appointments - a.completed_appointments)
        .slice(0, 5)
        .map((staff) => ({
            name: staff.staff_name,
            performance: Math.min(100, Math.round((staff.completed_appointments / 50) * 100)),
            tasks: staff.completed_appointments,
        }));

    const displayStaffPerformance = topPerformingStaff.length > 0
        ? topPerformingStaff
        : staffList.slice(0, 5).map((staff) => ({
            name: staff.name,
            performance: 50,
            tasks: 0,
        }));

    return (
        <DashboardLayout>
            <div>
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Dashboard Overview
                    </h1>
                    <p className="text-gray-500">Welcome back! Here's your team's performance overview.</p>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {topStats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-[#dba627]/10">
                                        <Icon className="text-[#dba627]" size={22} />
                                    </div>
                                    <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                                        <h2 className="text-2xl font-bold text-gray-800">{stat.value}</h2>
                                    </div>
                                    <div className="relative w-14 h-14">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="28" cy="28" r="24" stroke="#f3f4f6" strokeWidth="5" fill="none" />
                                            <circle
                                                cx="28"
                                                cy="28"
                                                r="24"
                                                stroke="#dba627"
                                                strokeWidth="5"
                                                fill="none"
                                                strokeDasharray={150}
                                                strokeDashoffset={150 - (150 * stat.progress) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                                            {stat.progress}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-4">vs last month</p>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Staff Performance */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Staff Performance</h3>
                        <div className="space-y-4">
                            {displayStaffPerformance.map((staff, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{staff.name}</span>
                                        <div className="flex gap-4">
                                            <span className="text-gray-500">{staff.tasks} services</span>
                                            <span className="text-[#dba627] font-semibold">{staff.performance}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full">
                                        <div
                                            className="h-2 rounded-full bg-[#dba627]"
                                            style={{ width: `${staff.performance}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {staffPerformance.length === 0 && (
                            <p className="text-gray-400 text-sm text-center mt-4">No performance data available yet</p>
                        )}
                    </div>

                    {/* Weekly Revenue Trend */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Revenue Trend</h3>
                        <div className="flex items-end justify-between h-40 gap-2">
                            {weeklyRevenue.map((data, i) => {
                                const maxRevenue = Math.max(...weeklyRevenue.map(d => d.revenue), 1);
                                const height = (data.revenue / maxRevenue) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center flex-1">
                                        <div
                                            className="w-full rounded-md bg-[#dba627]/80 transition-all hover:bg-[#dba627]"
                                            style={{ height: `${height}%`, minHeight: "4px" }}
                                        />
                                        <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                                        <span className="text-xs font-semibold text-gray-700">${data.revenue}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                            📈 {weeklyRevenue.reduce((sum, d) => sum + d.revenue, 0) > 0 ? "Revenue trend for last 7 days" : "No revenue data available yet"}
                        </p>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => router.push("/dashboard/manager/appointments?status=booked")}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-[#dba627]/10">
                                <MdPendingActions className="text-[#dba627]" size={20} />
                            </div>
                            <span className="text-xs text-gray-400">Quick action →</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Pending Approvals</p>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">{pendingCount}</h2>
                        <p className="text-xs text-gray-400">Appointments waiting for approval</p>
                        <div className="mt-3 h-1 w-full bg-gray-100 rounded-full">
                            <div className="h-1 bg-[#dba627] rounded-full" style={{ width: `${Math.min(100, (pendingCount / 50) * 100)}%` }} />
                        </div>
                    </div>

                    <div
                        onClick={() => router.push("/dashboard/manager/appointments?date=today")}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-[#dba627]/10">
                                <MdEvent className="text-[#dba627]" size={20} />
                            </div>
                            <span className="text-xs text-gray-400">Quick action →</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Today's Schedule</p>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">{todayAppointments.length}</h2>
                        <p className="text-xs text-gray-400">Appointments today</p>
                        <div className="mt-3 h-1 w-full bg-gray-100 rounded-full">
                            <div className="h-1 bg-[#dba627] rounded-full" style={{ width: `${Math.min(100, (todayAppointments.length / 30) * 100)}%` }} />
                        </div>
                    </div>

                    <div
                        onClick={() => router.push("/dashboard/manager/reports")}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-[#dba627]/10">
                                <MdTaskAlt className="text-[#dba627]" size={20} />
                            </div>
                            <span className="text-xs text-gray-400">Quick action →</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Completed Services</p>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">{monthlyCompletedCount}</h2>
                        <p className="text-xs text-gray-400">This month</p>
                        <div className="mt-3 h-1 w-full bg-gray-100 rounded-full">
                            <div className="h-1 bg-[#dba627] rounded-full" style={{ width: `${Math.min(100, (monthlyCompletedCount / 200) * 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}