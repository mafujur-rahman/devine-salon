"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/page";
import {
    MdBarChart,
    MdPeople,
    MdContentCut,
    MdEvent,
    MdPendingActions,
    MdTaskAlt,
    MdStore,
    MdTrendingUp,
    MdLocationCity,
    MdPerson,
    MdWork
} from "react-icons/md";
import { PiCurrencyInrBold } from "react-icons/pi";

const API_BASE = "https://saloon.mrshakil.com/api";

// Helper for authenticated requests
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`,
                ...options.headers,
            },
        });

        // Check if response is OK
        if (!response.ok) {
            // Try to parse error as JSON, but handle HTML responses
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const error = await response.json();
                throw new Error(error.message || "API request failed");
            } else {
                // If response is HTML, it's likely an authentication error
                if (response.status === 401 || response.status === 403) {
                    throw new Error("Authentication failed. Please login again.");
                } else {
                    throw new Error(`API request failed with status ${response.status}`);
                }
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
}

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for dashboard data with default values
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCustomers: 0,
        totalAppointments: 0,
        totalServicesDone: 0,
    });
    
    const [branchStats, setBranchStats] = useState([]);
    const [weeklyRevenue, setWeeklyRevenue] = useState([]);
    const [monthlyGrowth, setMonthlyGrowth] = useState([]);
    const [todayBookings, setTodayBookings] = useState(0);
    const [pendingServices, setPendingServices] = useState(0);
    const [completedJobs, setCompletedJobs] = useState(0);
    const [totalBranches, setTotalBranches] = useState(0);
    const [totalStaff, setTotalStaff] = useState(0);
    const [serviceDistribution, setServiceDistribution] = useState([]);

    useEffect(() => {
        checkAuth();
        fetchDashboardData();
    }, []);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token) {
            router.push("/login");
            return false;
        }

        if (role !== "superadmin") {
            router.push("/login");
            return false;
        }
        
        return true;
    };

    async function fetchDashboardData() {
        setLoading(true);
        setError(null);

        try {
            const today = new Date().toISOString().split('T')[0];
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

            // Try to fetch data with individual error handling
            let branches = [];
            let staff = [];
            let customers = [];
            let appointments = [];
            let invoices = [];
            let pending = [];
            let todayApts = [];
            let completedAppointments = [];
            let services = [];

            // Fetch branches
            try {
                const branchesData = await apiFetch("/branches/get-all-branches/");
                branches = branchesData.data || branchesData.branches || branchesData.results || [];
                setTotalBranches(branches.length);
            } catch (err) {
                console.error("Error fetching branches:", err);
                setTotalBranches(0);
            }

            // Fetch staff
            try {
                const staffData = await apiFetch("/users/staff/");
                staff = staffData.data || staffData.staff || staffData.results || [];
                setTotalStaff(staff.length);
            } catch (err) {
                console.error("Error fetching staff:", err);
                setTotalStaff(0);
            }

            // Fetch customers
            try {
                const customersData = await apiFetch("/customers/get-all-customers/");
                customers = customersData.data || customersData.customers || customersData.results || [];
                setStats(prev => ({ ...prev, totalCustomers: customers.length }));
            } catch (err) {
                console.error("Error fetching customers:", err);
                setStats(prev => ({ ...prev, totalCustomers: 0 }));
            }

            // Fetch appointments
            try {
                const appointmentsData = await apiFetch("/appointments/get-all-appointments/");
                appointments = appointmentsData.data || appointmentsData.appointments || appointmentsData.results || [];
                setStats(prev => ({ ...prev, totalAppointments: appointments.length }));
            } catch (err) {
                console.error("Error fetching appointments:", err);
                setStats(prev => ({ ...prev, totalAppointments: 0 }));
                appointments = [];
            }

            // Fetch invoices
            try {
                const invoicesData = await apiFetch("/invoices/get-all-invoices/");
                invoices = invoicesData.data || invoicesData.invoices || invoicesData.results || [];
                
                const monthlyInvoices = invoices.filter((inv) => {
                    const invDate = inv.created_at?.split('T')[0];
                    return invDate >= firstDayOfMonth && invDate <= lastDayOfMonth;
                });
                const totalRevenue = monthlyInvoices.reduce(
                    (sum, inv) => sum + parseFloat(inv.total_amount || 0),
                    0
                );
                setStats(prev => ({ ...prev, totalRevenue }));
            } catch (err) {
                console.error("Error fetching invoices:", err);
                setStats(prev => ({ ...prev, totalRevenue: 0 }));
                invoices = [];
            }

            // Fetch pending appointments
            try {
                const pendingData = await apiFetch("/appointments/get-all-appointments/?status=booked");
                pending = pendingData.data || pendingData.appointments || pendingData.results || [];
                setPendingServices(pending.length);
            } catch (err) {
                console.error("Error fetching pending appointments:", err);
                setPendingServices(0);
                pending = [];
            }

            // Fetch today's appointments
            try {
                const todayAppointmentsData = await apiFetch(`/appointments/get-all-appointments/?date=${today}`);
                todayApts = todayAppointmentsData.data || todayAppointmentsData.appointments || todayAppointmentsData.results || [];
                setTodayBookings(todayApts.length);
            } catch (err) {
                console.error("Error fetching today's appointments:", err);
                setTodayBookings(0);
                todayApts = [];
            }

            // Fetch completed appointments
            try {
                const completedAppointmentsData = await apiFetch("/appointments/get-all-appointments/?status=completed");
                completedAppointments = completedAppointmentsData.data || completedAppointmentsData.appointments || completedAppointmentsData.results || [];
                setStats(prev => ({ ...prev, totalServicesDone: completedAppointments.length }));
                setCompletedJobs(completedAppointments.length);
            } catch (err) {
                console.error("Error fetching completed appointments:", err);
                setStats(prev => ({ ...prev, totalServicesDone: 0 }));
                setCompletedJobs(0);
                completedAppointments = [];
            }

            // Calculate branch-wise stats
            if (branches.length > 0 && appointments.length > 0) {
                const branchStatsData = branches.map(branch => {
                    const branchAppointments = appointments.filter(apt => apt.branch === branch.id);
                    const branchRevenue = invoices
                        .filter(inv => branchAppointments.some(apt => apt.id === inv.appointment))
                        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
                    
                    return {
                        name: branch.name,
                        appointments: branchAppointments.length,
                        revenue: branchRevenue,
                        city: branch.city
                    };
                });
                setBranchStats(branchStatsData);
            } else {
                setBranchStats([]);
            }

            // Get weekly revenue
            const weeklyData = await getWeeklyRevenue();
            setWeeklyRevenue(weeklyData);

            // Get monthly growth data
            const growthData = await getMonthlyGrowth();
            setMonthlyGrowth(growthData);

            // Get service distribution
            try {
                const servicesData = await apiFetch("/services/");
                services = servicesData.data || servicesData.services || servicesData.results || [];
                const serviceStats = services.map(service => {
                    const serviceAppointments = appointments.filter(apt => apt.service === service.id);
                    return {
                        name: service.name,
                        count: serviceAppointments.length,
                        percentage: appointments.length > 0 ? (serviceAppointments.length / appointments.length) * 100 : 0
                    };
                }).sort((a, b) => b.count - a.count).slice(0, 5);
                setServiceDistribution(serviceStats);
            } catch (err) {
                console.error("Error fetching services:", err);
                setServiceDistribution([]);
            }

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
                const dailyTotal = (invoicesData.data || invoicesData.invoices || invoicesData.results || []).reduce(
                    (sum, inv) => sum + parseFloat(inv.total_amount || 0),
                    0
                );
                revenue.push({ day: dayName, revenue: dailyTotal });
            } catch (err) {
                console.error(`Error fetching revenue for ${dateStr}:`, err);
                revenue.push({ day: dayName, revenue: 0 });
            }
        }

        return revenue;
    }

    async function getMonthlyGrowth() {
        const months = [];
        const currentDate = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            
            try {
                const invoicesData = await apiFetch(`/invoices/get-all-invoices/`);
                const monthlyTotal = (invoicesData.data || invoicesData.invoices || invoicesData.results || []).filter(inv => {
                    const invDate = inv.created_at?.split('T')[0];
                    return invDate >= firstDay && invDate <= lastDay;
                }).reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
                
                months.push({ month: monthName, revenue: monthlyTotal });
            } catch (err) {
                console.error(`Error fetching revenue for ${monthName}:`, err);
                months.push({ month: monthName, revenue: 0 });
            }
        }
        
        return months;
    }

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627] mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading dashboard data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="text-red-500 text-xl mb-4">⚠️</div>
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={fetchDashboardData}
                            className="px-4 py-2 bg-[#dba627] text-white rounded-lg hover:bg-[#c49520] transition"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const topStats = [
        { 
            title: "Total Revenue", 
            value: formatCurrency(stats.totalRevenue), 
            icon: PiCurrencyInrBold, 
            change: "+15%", 
            progress: Math.min(100, Math.round((stats.totalRevenue / 50000) * 100)) 
        },
        { 
            title: "Total Customers", 
            value: stats.totalCustomers.toString(), 
            icon: MdPeople, 
            change: "+23%", 
            progress: Math.min(100, Math.round((stats.totalCustomers / 1000) * 100)) 
        },
        { 
            title: "Total Appointments", 
            value: stats.totalAppointments.toString(), 
            icon: MdContentCut, 
            change: "+12%", 
            progress: Math.min(100, Math.round((stats.totalAppointments / 500) * 100)) 
        },
        { 
            title: "Services Completed", 
            value: stats.totalServicesDone.toString(), 
            icon: MdBarChart, 
            change: "+8%", 
            progress: Math.min(100, Math.round((stats.totalServicesDone / 400) * 100)) 
        },
    ];

    const summaryCards = [
        { title: "Total Branches", value: totalBranches, icon: MdStore, color: "blue", route: "/dashboard/admin/branches" },
        { title: "Total Staff", value: totalStaff, icon: MdPerson, color: "green", route: "/dashboard/admin/staff" },
        { title: "Today's Bookings", value: todayBookings, icon: MdEvent, color: "purple" },
        { title: "Pending Services", value: pendingServices, icon: MdPendingActions, color: "orange" },
    ];

    // Calculate max values for charts
    const maxWeeklyRevenue = Math.max(...weeklyRevenue.map(d => d.revenue), 1);
    const maxMonthlyRevenue = Math.max(...monthlyGrowth.map(d => d.revenue), 1);

    return (
        <DashboardLayout>
            <div className="px-3">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-500">Welcome back, admin! Here's your business overview.</p>
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {summaryCards.map((card, index) => {
                        const Icon = card.icon;
                        const colorClasses = {
                            blue: "bg-blue-50 text-blue-600",
                            green: "bg-green-50 text-green-600",
                            purple: "bg-purple-50 text-purple-600",
                            orange: "bg-orange-50 text-orange-600"
                        };
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                                onClick={() => {
                                    if (card.route) {
                                        router.push(card.route);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 rounded-lg ${colorClasses[card.color]}`}>
                                        <Icon size={20} />
                                    </div>
                                    {card.route && <span className="text-xs text-gray-400">Click to view →</span>}
                                </div>
                                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                                <h2 className="text-2xl font-bold text-gray-800">{card.value}</h2>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Branch Performance */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MdLocationCity className="text-[#dba627]" />
                            Branch Performance
                        </h3>
                        {branchStats.length > 0 ? (
                            <div className="space-y-4">
                                {branchStats.map((branch, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{branch.name}</span>
                                            <div className="flex gap-4">
                                                <span className="text-gray-500">{branch.appointments} apts</span>
                                                <span className="text-[#dba627] font-semibold">{formatCurrency(branch.revenue)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full">
                                            <div
                                                className="h-2 rounded-full bg-[#dba627]"
                                                style={{ width: `${Math.min(100, (branch.revenue / 50000) * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{branch.city}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                No branch data available
                            </div>
                        )}
                    </div>

                    {/* Weekly Revenue Trend - Fixed Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MdTrendingUp className="text-[#dba627]" />
                            Weekly Revenue Trend
                        </h3>
                        {weeklyRevenue.length > 0 && maxWeeklyRevenue > 0 ? (
                            <>
                                <div className="relative h-64 mb-4">
                                    <div className="absolute inset-0 flex items-end justify-between gap-2">
                                        {weeklyRevenue.map((data, i) => {
                                            const height = (data.revenue / maxWeeklyRevenue) * 100;
                                            return (
                                                <div key={i} className="flex flex-col items-center flex-1 h-full">
                                                    <div className="relative flex-1 w-full flex items-end">
                                                        <div
                                                            className="w-full bg-gradient-to-t from-[#dba627] to-[#dba627]/70 rounded-t-lg transition-all duration-500 hover:from-[#c49520] cursor-pointer"
                                                            style={{ height: `${height}%`, minHeight: "4px" }}
                                                        >
                                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                                {formatCurrency(data.revenue)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-2 font-medium">{data.day}</span>
                                                    <span className="text-xs font-semibold text-gray-700 mt-1">{formatCurrency(data.revenue)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 text-center">
                                        📊 Weekly revenue trend for last 7 days
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <MdBarChart className="mx-auto text-4xl mb-2 opacity-50" />
                                <p>No revenue data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Service Distribution & Monthly Growth */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Service Distribution */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MdWork className="text-[#dba627]" />
                            Popular Services
                        </h3>
                        {serviceDistribution.length > 0 ? (
                            <div className="space-y-4">
                                {serviceDistribution.map((service, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{service.name}</span>
                                            <div className="flex gap-4">
                                                <span className="text-gray-500">{service.count} bookings</span>
                                                <span className="text-[#dba627] font-semibold">{Math.round(service.percentage)}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-2 rounded-full bg-[#dba627] transition-all duration-500"
                                                style={{ width: `${service.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <MdWork className="mx-auto text-4xl mb-2 opacity-50" />
                                <p>No service data available</p>
                            </div>
                        )}
                    </div>

                    {/* Monthly Growth - Fixed Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MdBarChart className="text-[#dba627]" />
                            Monthly Revenue Growth
                        </h3>
                        {monthlyGrowth.length > 0 && maxMonthlyRevenue > 0 ? (
                            <>
                                <div className="relative h-64 mb-4">
                                    <div className="absolute inset-0 flex items-end justify-between gap-3">
                                        {monthlyGrowth.map((data, i) => {
                                            const height = (data.revenue / maxMonthlyRevenue) * 100;
                                            return (
                                                <div key={i} className="flex flex-col items-center flex-1 h-full">
                                                    <div className="relative flex-1 w-full flex items-end">
                                                        <div
                                                            className="w-full bg-gradient-to-t from-[#dba627] to-[#dba627]/60 rounded-t-lg transition-all duration-500 hover:from-[#c49520] cursor-pointer"
                                                            style={{ height: `${height}%`, minHeight: "4px" }}
                                                        >
                                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                                {formatCurrency(data.revenue)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-2 font-medium">{data.month}</span>
                                                    <span className="text-xs font-semibold text-gray-700 mt-1">{formatCurrency(data.revenue)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 text-center">
                                        📈 Monthly revenue trend for the last 6 months
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <MdBarChart className="mx-auto text-4xl mb-2 opacity-50" />
                                <p>No monthly growth data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 shadow-sm border border-blue-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MdEvent className="text-blue-600" size={20} />
                            </div>
                            <span className="text-xs text-gray-400">Today's Schedule</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{todayBookings}</p>
                        <p className="text-sm text-gray-500 mt-2">Appointments scheduled for today</p>
                        <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-1 bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (todayBookings / 50) * 100)}%` }} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 shadow-sm border border-orange-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <MdPendingActions className="text-orange-600" size={20} />
                            </div>
                            <span className="text-xs text-gray-400">Pending Actions</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{pendingServices}</p>
                        <p className="text-sm text-gray-500 mt-2">Services awaiting completion</p>
                        <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-1 bg-orange-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (pendingServices / 100) * 100)}%` }} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 shadow-sm border border-green-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <MdTaskAlt className="text-green-600" size={20} />
                            </div>
                            <span className="text-xs text-gray-400">Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{completedJobs}</p>
                        <p className="text-sm text-gray-500 mt-2">Total services completed</p>
                        <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-1 bg-green-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (completedJobs / 1000) * 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}