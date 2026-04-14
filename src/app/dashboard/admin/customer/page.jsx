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

export default function AdminCustomers() {
    const router = useRouter();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerStats, setCustomerStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [formData, setFormData] = useState({
        phone: '',
        first_name: '',
        last_name: '',
        email: '',
        whatsapp: '',
        gender: 'male',
        address: ''
    });

    useEffect(() => {
        checkAuth();
        fetchCustomers();
    }, []);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token) {
            router.push("/login");
        }

        if (role !== "superadmin") {
            router.push("/login");
        }
    };

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/users/customers/');
            let customersData = data.data || data.customers || data.results || [];
            setCustomers(customersData);
            setCurrentPage(1); // Reset to first page when data loads
        } catch (error) {
            console.error('Error fetching customers:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch customers',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerDetails = async (customerId) => {
        setLoadingStats(true);
        setShowDetailsModal(true);

        try {
            // Fetch both customer details and stats in parallel
            const [detailsData, statsData] = await Promise.all([
                apiFetch(`/users/${customerId}/`),
                apiFetch(`/user/customers/${customerId}/stats/`)
            ]);

            setSelectedCustomer(detailsData.data);
            setCustomerStats(statsData.data);
        } catch (error) {
            console.error('Error fetching customer details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch customer details',
                confirmButtonColor: '#dba627'
            });
            setShowDetailsModal(false);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await apiFetch('/user/create-customer/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Customer created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowCreateForm(false);
                resetForm();
                fetchCustomers();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to create customer',
                    confirmButtonColor: '#dba627'
                });
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create customer',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => setFormData({
        phone: '',
        first_name: '',
        last_name: '',
        email: '',
        whatsapp: '',
        gender: 'male',
        address: ''
    });

    const handleInputChange = (e) => setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            'booked': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-blue-100 text-blue-800',
            'in_progress': 'bg-purple-100 text-purple-800',
            'completed': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatStatusLabel = (status) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Pagination helper functions
    const getPaginatedData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return customers.slice(startIndex, endIndex);
    };

    const getTotalPages = () => {
        return Math.ceil(customers.length / itemsPerPage);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const renderPagination = () => {
        const totalPages = getTotalPages();
        if (totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, customers.length)}</span> of{' '}
                    <span className="font-medium">{customers.length}</span> customers
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                            }`}
                    >
                        Previous
                    </button>
                    {pageNumbers.map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer ${currentPage === page
                                    ? 'bg-[#dba627] text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    const paginatedCustomers = getPaginatedData();

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Customer <span className="text-[#dba627]">Management</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Manage all customers and view their statistics</p>
                    </div>

                    {/* Add Customer Button */}
                    <button
                        onClick={() => {
                            setShowCreateForm(true);
                            resetForm();
                        }}
                        className="bg-black text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Customer
                    </button>
                </div>

                {/* Create Form Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Add New Customer
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Fill in the details to create a new customer
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleCreateCustomer}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Phone *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <span className="text-gray-500 text-sm flex items-center gap-1">
                                                        <span className="text-base">🇮🇳</span>
                                                        <span>+91</span>
                                                    </span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 pl-16 pr-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="98765 43210"
                                                />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    First Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={formData.first_name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="Rahul"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={formData.last_name}
                                                    onChange={handleInputChange}
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="Sharma"
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
                                                    placeholder="rahul.sharma@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    WhatsApp
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="whatsapp"
                                                    value={formData.whatsapp}
                                                    onChange={handleInputChange}
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Gender
                                                </label>
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                >
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Address
                                                </label>
                                                <textarea
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    rows="2"
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="Flat 12, MG Road, Mumbai, Maharashtra"
                                                />
                                            </div>
                                        </div>

                                        {/* FOOTER */}
                                        <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateForm(false)}
                                                className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                            >
                                                {loading ? 'Creating...' : 'Create Customer'}
                                            </button>
                                        </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer Details Modal with Stats */}
                {showDetailsModal && selectedCustomer && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Customer Details & Statistics
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Complete customer information and activity stats
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedCustomer(null);
                                        setCustomerStats(null);
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="overflow-y-auto px-6 py-5">
                                {loadingStats ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Basic Information Section */}
                                        <div className="mb-8">
                                            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Basic Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50 p-5 rounded-xl">

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                        Role
                                                    </label>
                                                    <p className="text-sm text-gray-900 capitalize">{selectedCustomer.role}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                        Full Name
                                                    </label>
                                                    <p className="text-base font-bold text-gray-900">
                                                        {selectedCustomer.first_name} {selectedCustomer.last_name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                        Phone
                                                    </label>
                                                    <p className="text-sm text-gray-900">{selectedCustomer.phone}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                        Email
                                                    </label>
                                                    <p className="text-sm text-gray-900">{selectedCustomer.email || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                        Address
                                                    </label>
                                                    <p className="text-sm text-gray-900">{selectedCustomer.address || 'Not provided'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Statistics Section */}
                                        {customerStats && (
                                            <>
                                                {/* Key Metrics */}
                                                <div className="mb-8">
                                                    <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                        Key Statistics
                                                    </h3>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                                                            <p className="text-xs text-blue-600 font-semibold mb-1">Total Appointments</p>
                                                            <p className="text-2xl font-bold text-blue-900">{customerStats.appointment_count || 0}</p>
                                                        </div>
                                                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                                                            <p className="text-xs text-green-600 font-semibold mb-1">Branches Visited</p>
                                                            <p className="text-2xl font-bold text-green-900">{customerStats.branches_visited || 0}</p>
                                                        </div>
                                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                                                            <p className="text-xs text-purple-600 font-semibold mb-1">Total Paid</p>
                                                            <p className="text-2xl font-bold text-purple-900">₹{customerStats.total_paid || '0'}</p>
                                                        </div>
                                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                                                            <p className="text-xs text-orange-600 font-semibold mb-1">Total Discount</p>
                                                            <p className="text-2xl font-bold text-orange-900">₹{customerStats.total_discount || '0'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Appointment Status Breakdown */}
                                                <div className="mb-8">
                                                    <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        Appointment Status
                                                    </h3>
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                                            <p className="text-xs text-yellow-600 font-semibold">Booked</p>
                                                            <p className="text-xl font-bold text-yellow-700">{customerStats.booked_appointments || 0}</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                            <p className="text-xs text-blue-600 font-semibold">Approved</p>
                                                            <p className="text-xl font-bold text-blue-700">{customerStats.approved_appointments || 0}</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                            <p className="text-xs text-purple-600 font-semibold">In Progress</p>
                                                            <p className="text-xl font-bold text-purple-700">{customerStats.in_progress_appointments || 0}</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                                            <p className="text-xs text-green-600 font-semibold">Completed</p>
                                                            <p className="text-xl font-bold text-green-700">{customerStats.completed_appointments || 0}</p>
                                                        </div>
                                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                            <p className="text-xs text-gray-600 font-semibold">Invoices</p>
                                                            <p className="text-xl font-bold text-gray-700">{customerStats.invoice_count || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Branches and Recent Activity */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            Associated Branches
                                                        </h3>
                                                        <div className="bg-gray-50 p-4 rounded-xl">
                                                            <div className="flex flex-wrap gap-2">
                                                                {customerStats.branch_names && customerStats.branch_names.length > 0 ? (
                                                                    customerStats.branch_names.map((branch, index) => (
                                                                        <span key={index} className="px-3 py-1.5 bg-[#dba627]/10 text-[#dba627] rounded-lg text-xs font-medium">
                                                                            {branch}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-sm text-gray-500">No branches associated</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Recent Activity
                                                        </h3>
                                                        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                                            {customerStats.last_appointment_date && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Last Appointment</p>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {new Date(customerStats.last_appointment_date).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {customerStats.last_invoice_at && (
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Last Invoice</p>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {new Date(customerStats.last_invoice_at).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {!customerStats.last_appointment_date && !customerStats.last_invoice_at && (
                                                                <p className="text-sm text-gray-500">No recent activity</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* FOOTER */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedCustomer(null);
                                        setCustomerStats(null);
                                    }}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customers Table */}
                {loading && !showCreateForm ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No customers found. Click Add Customer to add one.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Appointments</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Spendings</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branches</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedCustomers.map((customer, index) => (
                                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#dba627]/20 flex items-center justify-center text-[#dba627] text-sm font-bold">
                                                        {getInitials(customer.first_name, customer.last_name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {customer.first_name} {customer.last_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span className="text-sm text-gray-700">+91{customer.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {customer.email ? (
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="text-sm text-gray-600 truncate max-w-[150px]">{customer.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Not provided</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {customer.address ? (
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="text-sm text-gray-600 truncate max-w-[150px]">{customer.address}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Not provided</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {customer.appointment_count || 0} visits
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-[#dba627]">
                                                    ₹{customer.total_spendings || '0.00'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {customer.branch_names && customer.branch_names.length > 0 ? (
                                                        <>
                                                            {customer.branch_names.slice(0, 2).map((branch, idx) => (
                                                                <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                    {branch.length > 15 ? branch.substring(0, 12) + '...' : branch}
                                                                </span>
                                                            ))}
                                                            {customer.branch_names.length > 2 && (
                                                                <span className="text-xs text-gray-500">
                                                                    +{customer.branch_names.length - 2}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => fetchCustomerDetails(customer.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                        title="View Details & Stats"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}