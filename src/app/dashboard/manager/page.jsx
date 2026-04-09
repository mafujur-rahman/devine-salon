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
    MdShowChart,
    MdTrendingUp,
    MdCalendarToday,
    MdWork,
    MdStar,
    MdNavigateBefore,
    MdNavigateNext
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
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [monthlyReport, setMonthlyReport] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

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

    // Reset to first page when data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [staffPerformance]);

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

    async function generateMonthlyReport() {
        if (!selectedStaff) {
            return;
        }

        setGeneratingReport(true);
        try {
            const response = await apiFetch("/staff/generate-monthly-report/", {
                method: "POST",
                body: JSON.stringify({
                    staff_id: selectedStaff,
                    month: selectedMonth,
                    year: selectedYear
                })
            });
            
            if (response.success) {
                setMonthlyReport(response.data);
            }
        } catch (err) {
            console.error("Failed to generate monthly report:", err);
        } finally {
            setGeneratingReport(false);
        }
    }

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getTopPerformers = () => {
        return staffPerformance
            .filter(staff => staff.completed_work > 0)
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5);
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = staffPerformance.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(staffPerformance.length / itemsPerPage);

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    if (error) {
        return (
            <DashboardLayout>
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
            </DashboardLayout>
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

    const topPerformingStaff = getTopPerformers();

    return (
        <DashboardLayout>
            {loading ? (
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#dba627] mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading dashboard data...</p>
                        <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your data</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Dashboard Overview
                        </h1>
                        <p className="text-gray-500">Welcome back! Here's your team's performance overview.</p>
                    </div>

                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                    {/* Staff Performance Report Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#dba627]/10 to-transparent px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <MdShowChart className="text-[#dba627]" />
                                        Staff Performance Report
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Detailed performance metrics for all staff members</p>
                                </div>
                                <div className="flex gap-3">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#dba627]"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <option key={month} value={month}>
                                                {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#dba627]"
                                    >
                                        {[2024, 2025, 2026].map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Staff Selection and Report Generation */}
                            <div className="mb-6 flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Select Staff Member
                                    </label>
                                    <select
                                        value={selectedStaff || ""}
                                        onChange={(e) => setSelectedStaff(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dba627]"
                                    >
                                        <option value="">Choose a staff member...</option>
                                        {staffPerformance.map(staff => (
                                            <option key={staff.staff_id} value={staff.staff_id}>
                                                {staff.staff_name} - {staff.job_title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={generateMonthlyReport}
                                    disabled={!selectedStaff || generatingReport}
                                    className="px-6 py-2 bg-[#dba627] text-white rounded-lg font-semibold hover:bg-[#c49520] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generatingReport ? 'Generating...' : 'Generate Report'}
                                </button>
                            </div>

                            {/* Monthly Report Display */}
                            {monthlyReport && (
                                <div className="mt-6 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <MdCalendarToday className="text-[#dba627]" />
                                        Report for {monthlyReport.staff_name} - {new Date(2000, monthlyReport.month - 1, 1).toLocaleString('default', { month: 'long' })} {monthlyReport.year}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Completed Work</p>
                                            <p className="text-2xl font-bold text-gray-800">{monthlyReport.completed_work}</p>
                                            <p className="text-xs text-green-600 mt-1">↑ 12% vs last month</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                                            <p className="text-2xl font-bold text-[#dba627]">{formatCurrency(monthlyReport.total_revenue)}</p>
                                            <p className="text-xs text-green-600 mt-1">↑ 8% vs last month</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Estimated Commission</p>
                                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(monthlyReport.estimated_commission)}</p>
                                            <p className="text-xs text-gray-500 mt-1">@{monthlyReport.commission_percentage}% rate</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Estimated Salary</p>
                                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(monthlyReport.estimated_salary)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Base: {formatCurrency(monthlyReport.base_salary)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Service Revenue</p>
                                            <p className="text-lg font-semibold text-gray-800">{formatCurrency(monthlyReport.service_revenue)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Package Revenue</p>
                                            <p className="text-lg font-semibold text-gray-800">{formatCurrency(monthlyReport.package_revenue)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-xs text-gray-500 mb-1">Product Revenue</p>
                                            <p className="text-lg font-semibold text-gray-800">{formatCurrency(monthlyReport.product_revenue)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Staff Performance Table with Pagination */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#dba627]/5 to-transparent">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <MdWork className="text-[#dba627]" />
                                All Staff Performance Overview
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Job Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Completed Work</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Revenue</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Commission</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentItems.map((staff, idx) => {
                                        const performancePercent = staff.completed_work > 0 
                                            ? Math.min(100, Math.round((staff.completed_work / 50) * 100))
                                            : 0;
                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-[#dba627]/10 rounded-full flex items-center justify-center">
                                                            <MdStar className="text-[#dba627]" size={14} />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{staff.staff_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{staff.job_title}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-gray-900">{staff.completed_work}</span>
                                                        <span className="text-xs text-gray-500">({staff.completed_appointments} apts)</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-[#dba627]">{formatCurrency(staff.total_revenue)}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-700">{formatCurrency(staff.estimated_commission)}</span>
                                                    <span className="text-xs text-gray-500 ml-1">({staff.commission_percentage}%)</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 max-w-[100px]">
                                                            <div className="w-full bg-gray-100 h-2 rounded-full">
                                                                <div 
                                                                    className="h-2 rounded-full bg-[#dba627] transition-all"
                                                                    style={{ width: `${performancePercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-600">{performancePercent}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {staffPerformance.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-400">No staff performance data available</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {staffPerformance.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, staffPerformance.length)} of {staffPerformance.length} entries
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded-lg flex items-center gap-1 transition ${
                                            currentPage === 1
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-white text-gray-700 hover:bg-[#dba627] hover:text-white border border-gray-300'
                                        }`}
                                    >
                                        <MdNavigateBefore size={18} />
                                        Previous
                                    </button>
                                    
                                    {/* Page Numbers */}
                                    <div className="flex gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                            // Show limited page numbers with ellipsis for many pages
                                            if (
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => paginate(pageNum)}
                                                        className={`w-8 h-8 rounded-lg transition ${
                                                            currentPage === pageNum
                                                                ? 'bg-[#dba627] text-white'
                                                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                (pageNum === currentPage - 2 && currentPage > 3) ||
                                                (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                                            ) {
                                                return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded-lg flex items-center gap-1 transition ${
                                            currentPage === totalPages
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-white text-gray-700 hover:bg-[#dba627] hover:text-white border border-gray-300'
                                        }`}
                                    >
                                        Next
                                        <MdNavigateNext size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performers Chart */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <MdTrendingUp className="text-[#dba627]" />
                                Top Performing Staff
                            </h3>
                            <div className="space-y-4">
                                {topPerformingStaff.map((staff, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{staff.staff_name}</span>
                                            <div className="flex gap-4">
                                                <span className="text-gray-500">{staff.completed_work} services</span>
                                                <span className="text-[#dba627] font-semibold">{formatCurrency(staff.total_revenue)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full">
                                            <div
                                                className="h-2 rounded-full bg-[#dba627]"
                                                style={{ width: `${Math.min(100, (staff.total_revenue / 50000) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {topPerformingStaff.length === 0 && (
                                    <p className="text-gray-400 text-sm text-center">No performance data available yet</p>
                                )}
                            </div>
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
                                                className="w-full rounded-md bg-[#dba627]/80 transition-all hover:bg-[#dba627] cursor-pointer"
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
            )}
        </DashboardLayout>
    );
}