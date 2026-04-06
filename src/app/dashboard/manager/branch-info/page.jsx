"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";

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

export default function BranchInfo() {
    const router = useRouter();

    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        opening_time: '',
        closing_time: '',
        tax_rate: '',
        gst_number: ''
    });

    useEffect(() => {
        checkAuth();
        fetchBranchInfo();
    }, []);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token) {
            router.push("/login");
        }

        if (role !== "manager") {
            router.push("/login");
        }
    };

    const fetchBranchInfo = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/branches/get-all-branches/');
            // Manager gets only their branch
            let branchData = data.data || data.branches || data.results || [];
            if (branchData.length > 0) {
                setBranch(branchData[0]);
                setFormData({
                    name: branchData[0].name || '',
                    address: branchData[0].address || '',
                    city: branchData[0].city || '',
                    phone: branchData[0].phone || '',
                    email: branchData[0].email || '',
                    opening_time: branchData[0].opening_time || '',
                    closing_time: branchData[0].closing_time || '',
                    tax_rate: branchData[0].tax_rate || '',
                    gst_number: branchData[0].gst_number || ''
                });
            }
        } catch (error) {
            console.error('Error fetching branch info:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch branch information',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBranch = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            phone: formData.phone,
            email: formData.email,
            opening_time: formData.opening_time,
            closing_time: formData.closing_time,
            tax_rate: parseFloat(formData.tax_rate),
            gst_number: formData.gst_number
        };

        try {
            const result = await apiFetch(`/branch/update-branch/${branch.id}/`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Branch information updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowEditForm(false);
                fetchBranchInfo();
            }
        } catch (error) {
            console.error('Error updating branch:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update branch information',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOpen = async () => {
        setLoading(true);
        try {
            const result = await apiFetch(`/branch/${branch.id}/toggle-open/`, {
                method: 'POST'
            });

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `Branch is now ${result.data.currently_open ? 'OPEN' : 'CLOSED'}`,
                    confirmButtonColor: '#dba627'
                });
                fetchBranchInfo();
            }
        } catch (error) {
            console.error('Error toggling branch status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update branch status',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString.substring(0, 5);
    };

    const getStatusBadge = () => {
        if (!branch) return null;
        if (branch.currently_open) {
            return { text: 'OPEN', color: 'bg-green-100 text-green-800' };
        }
        return { text: 'CLOSED', color: 'bg-red-100 text-red-800' };
    };

    const getActiveBadge = () => {
        if (!branch) return null;
        if (branch.active) {
            return { text: 'ACTIVE', color: 'bg-green-100 text-green-800' };
        }
        return { text: 'INACTIVE', color: 'bg-red-100 text-red-800' };
    };

    if (loading && !branch) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500">No branch information found.</p>
            </div>
        );
    }

    const status = getStatusBadge();
    const activeStatus = getActiveBadge();

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Branch <span className="text-[#dba627]">Information</span>
                        </h1>
                        <p className="text-gray-500 mt-1">View and manage your branch details</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleToggleOpen}
                            disabled={loading}
                            className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer ${branch.currently_open
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {branch.currently_open ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Close Branch
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Open Branch
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowEditForm(true)}
                            className="bg-black text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Branch
                        </button>
                    </div>
                </div>

                {/* Branch Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Main Info Card */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#dba627]/10 to-transparent px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">{branch.name}</h2>
                            <p className="text-sm text-gray-500">Branch ID: #{branch.id}</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Manager
                                    </label>
                                    <p className="text-sm font-medium text-gray-900">{branch.manager_name || 'Not assigned'}</p>
                                    {branch.manager_phone && (
                                        <p className="text-xs text-gray-500 mt-0.5">{branch.manager_phone}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Status
                                    </label>
                                    <div className="flex gap-2">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${status?.color}`}>
                                            {status?.text}
                                        </span>
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${activeStatus?.color}`}>
                                            {activeStatus?.text}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Phone
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <p className="text-sm text-gray-900">{branch.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Email
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-sm text-gray-900">{branch.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                                        Address
                                    </label>
                                    <div className="flex items-start gap-2">
                                        <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-sm text-gray-700">{branch.address}, {branch.city}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Business Hours & Tax Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Business Hours
                        </h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Opening Time</span>
                                <span className="text-sm font-semibold text-gray-900">{formatTime(branch.opening_time)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Closing Time</span>
                                <span className="text-sm font-semibold text-gray-900">{formatTime(branch.closing_time)}</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                            </svg>
                            Tax Information
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Tax Rate</span>
                                <span className="text-sm font-semibold text-[#dba627]">{branch.tax_rate}%</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">GST Number</span>
                                <span className="text-sm font-semibold text-gray-900">{branch.gst_number || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Created At</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(branch.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 shadow-sm border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-gray-800">-</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Total Staff</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">Loading...</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 shadow-sm border border-green-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-gray-800">-</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Total Services</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">Loading...</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 shadow-sm border border-purple-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-gray-800">-</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Total Customers</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">Loading...</p>
                    </div>
                </div>

                {/* Edit Branch Form Modal */}
                {showEditForm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Edit Branch Information
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Update your branch details
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowEditForm(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleUpdateBranch}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Branch Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Branch Name"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Address *
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows="2"
                                                required
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Street address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                City *
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="City"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Phone *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Phone number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Email address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                GST Number
                                            </label>
                                            <input
                                                type="text"
                                                name="gst_number"
                                                value={formData.gst_number}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="GST Number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Opening Time *
                                            </label>
                                            <input
                                                type="time"
                                                name="opening_time"
                                                value={formData.opening_time}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Closing Time *
                                            </label>
                                            <input
                                                type="time"
                                                name="closing_time"
                                                value={formData.closing_time}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Tax Rate (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="tax_rate"
                                                value={formData.tax_rate}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* FOOTER */}
                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditForm(false)}
                                            className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}