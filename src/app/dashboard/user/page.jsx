"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import DashboardLayout from "@/app/page";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function UserDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customerStats, setCustomerStats] = useState(null);

    // Axios interceptor for auth token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        } else {
            router.push("/login");
        }
    }, []);

    useEffect(() => {
        checkAuth();
        fetchCustomerStats();
    }, []);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        router.push("/login");
    };

    const fetchCustomerStats = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/user/customer-stats/`);
            if (response.data.success) {
                setCustomerStats(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching customer stats:", error);
            if (error.response?.status === 401) {
                router.push("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return "N/A";
        const date = new Date(dateTimeString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Calculate completion rate from available data
    const getCompletionRate = () => {
        if (!customerStats) return 0;
        const total = customerStats.appointment_count || 0;
        const completed = customerStats.completed_appointments || 0;
        if (total === 0) return 0;
        return ((completed / total) * 100).toFixed(0);
    };

    // Calculate active appointments (booked + approved + in_progress)
    const getActiveAppointments = () => {
        if (!customerStats) return 0;
        return (customerStats.booked_appointments || 0) + 
               (customerStats.approved_appointments || 0) + 
               (customerStats.in_progress_appointments || 0);
    };

    return (
        <DashboardLayout>
            <div className="bg-gray-50 min-h-screen">
                <div className="px-3 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Welcome back, {customerStats?.customer_name || "Valued Customer"}
                        </h2>
                        <p className="text-gray-500 mt-2">Here's an overview of your salon activity</p>
                        {customerStats && (
                            <div className="mt-2 text-sm text-gray-500">
                                <span className="font-medium">Phone:</span> {customerStats.customer_phone}
                            </div>
                        )}
                    </div>

                    {/* Stats Cards */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                        </div>
                    ) : customerStats ? (
                        <>
                            {/* Primary Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                {/* Total Appointments Card */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-[#dba627]/10 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{customerStats.appointment_count || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Appointments</p>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-400">Lifetime bookings</p>
                                    </div>
                                </div>

                                {/* Visits Card */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{customerStats.visit_count || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Visits</p>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-400">Actual salon visits</p>
                                    </div>
                                </div>

                                {/* Financial Stats Card */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">₹{parseFloat(customerStats.total_paid || 0).toLocaleString()}</p>
                                    <p className="text-sm text-gray-500 mt-1">Total Spent</p>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-400">Discount saved: ₹{parseFloat(customerStats.total_discount || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Branches Visited Card */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{customerStats.branches_visited || 0}</p>
                                    <p className="text-sm text-gray-500 mt-1">Branches Visited</p>
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-400">Out of {customerStats.branch_names?.length || 0} total</p>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Status Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-sm">
                                    <p className="text-sm font-medium text-blue-600 mb-2">Booked</p>
                                    <p className="text-3xl font-bold text-gray-900">{customerStats.booked_appointments || 0}</p>
                                    <p className="text-xs text-blue-600 mt-1">Pending confirmation</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-sm">
                                    <p className="text-sm font-medium text-yellow-600 mb-2">Approved</p>
                                    <p className="text-3xl font-bold text-gray-900">{customerStats.approved_appointments || 0}</p>
                                    <p className="text-xs text-yellow-600 mt-1">Ready for service</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-sm">
                                    <p className="text-sm font-medium text-purple-600 mb-2">In Progress</p>
                                    <p className="text-3xl font-bold text-gray-900">{customerStats.in_progress_appointments || 0}</p>
                                    <p className="text-xs text-purple-600 mt-1">Currently being served</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-sm">
                                    <p className="text-sm font-medium text-green-600 mb-2">Completed</p>
                                    <p className="text-3xl font-bold text-gray-900">{customerStats.completed_appointments || 0}</p>
                                    <p className="text-xs text-green-600 mt-1">Successfully finished</p>
                                </div>
                            </div>

                            {/* Recent Activity & Additional Info */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Branches Visited */}
                                {customerStats.branch_names && customerStats.branch_names.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Branches Visited</h3>
                                        <div className="space-y-2">
                                            {customerStats.branch_names.map((branch, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-gray-700">{branch}</span>
                                                    <span className="text-xs text-gray-400">Branch ID: {customerStats.branch_ids[index]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Activity */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                                    <div className="space-y-4">
                                        {customerStats.last_appointment_date && (
                                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Last Appointment</p>
                                                        <p className="text-xs text-gray-500">{formatDate(customerStats.last_appointment_date)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {customerStats.last_invoice_at && (
                                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Last Invoice</p>
                                                        <p className="text-xs text-gray-500">{formatDateTime(customerStats.last_invoice_at)}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-medium text-green-600">Invoice #{customerStats.invoice_count || 0}</span>
                                            </div>
                                        )}

                                        {customerStats.invoice_count > 0 && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Total Invoices</p>
                                                        <p className="text-xs text-gray-500">Lifetime purchase records</p>
                                                    </div>
                                                </div>
                                                <span className="text-lg font-semibold text-gray-900">{customerStats.invoice_count}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats Summary */}
                            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Analytics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm text-gray-500">Completion Rate</p>
                                            <p className="text-2xl font-bold text-gray-900">{getCompletionRate()}%</p>
                                        </div>
                                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm text-gray-500">Active Appointments</p>
                                            <p className="text-2xl font-bold text-gray-900">{getActiveAppointments()}</p>
                                        </div>
                                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm text-gray-500">Avg. Value per Visit</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                ₹{customerStats.visit_count > 0 
                                                    ? parseFloat(customerStats.total_paid / customerStats.visit_count).toFixed(0)
                                                    : 0}
                                            </p>
                                        </div>
                                        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                            <p className="text-gray-500">Unable to load dashboard data. Please try again later.</p>
                            <button 
                                onClick={fetchCustomerStats}
                                className="mt-4 px-4 py-2 bg-[#dba627] text-white rounded-lg hover:bg-[#c49520] transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}