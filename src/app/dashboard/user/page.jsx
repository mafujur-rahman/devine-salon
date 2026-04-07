"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import DashboardLayout from "@/app/page";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function UserDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dashboardStats, setDashboardStats] = useState({
        totalAppointments: 0,
        completedAppointments: 0,
        upcomingAppointments: 0,
        cancelledAppointments: 0
    });

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
        fetchUserData();
        fetchDashboardData();
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

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${API_BASE}/users/profile/`);
            setUser(response.data.data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/appointments/my-appointments/`);
            const appointmentsData = response.data.data || response.data.appointments || response.data.results || [];

            const stats = {
                totalAppointments: appointmentsData.length,
                completedAppointments: appointmentsData.filter(a => a.status === "completed").length,
                upcomingAppointments: appointmentsData.filter(a => a.status === "confirmed" || a.status === "pending").length,
                cancelledAppointments: appointmentsData.filter(a => a.status === "cancelled").length
            };
            setDashboardStats(stats);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    return (
        <DashboardLayout>
            <div className=" bg-gray-50">

                <div className=" px-4  py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Welcome back
                        </h2>
                        <p className="text-gray-500 mt-2">Here's an overview of your salon activity</p>
                    </div>

                    {/* Stats Cards */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Appointments Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-[#dba627]/10 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-gray-400">All Time</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalAppointments}</p>
                                <p className="text-sm text-gray-500 mt-1">Total Appointments</p>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">Lifetime bookings</p>
                                </div>
                            </div>

                            {/* Upcoming Appointments Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Upcoming</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{dashboardStats.upcomingAppointments}</p>
                                <p className="text-sm text-gray-500 mt-1">Upcoming Appointments</p>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">Confirmed & Pending</p>
                                </div>
                            </div>

                            {/* Completed Appointments Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Completed</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{dashboardStats.completedAppointments}</p>
                                <p className="text-sm text-gray-500 mt-1">Completed Services</p>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">Successfully finished</p>
                                </div>
                            </div>

                            {/* Cancelled Appointments Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Cancelled</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{dashboardStats.cancelledAppointments}</p>
                                <p className="text-sm text-gray-500 mt-1">Cancelled Appointments</p>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">Not completed</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Activity Section */}
                    {!loading && dashboardStats.totalAppointments > 0 && (
                        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-sm text-gray-500">Completion Rate</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {dashboardStats.totalAppointments > 0
                                                ? ((dashboardStats.completedAppointments / dashboardStats.totalAppointments) * 100).toFixed(0)
                                                : 0}%
                                        </p>
                                    </div>
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-sm text-gray-500">Active Appointments</p>
                                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.upcomingAppointments}</p>
                                    </div>
                                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-sm text-gray-500">Cancellation Rate</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {dashboardStats.totalAppointments > 0
                                                ? ((dashboardStats.cancelledAppointments / dashboardStats.totalAppointments) * 100).toFixed(0)
                                                : 0}%
                                        </p>
                                    </div>
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}