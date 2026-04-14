"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";

const API_BASE = "https://saloon.mrshakil.com/api";

// Helper for authenticated requests with better error handling
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

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error("Server returned an error page. Please check if the endpoint exists.");
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || "API request failed");
        }

        return data;
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
}

export default function Customers() {
    const router = useRouter();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [customerStats, setCustomerStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [itemsPerPage] = useState(10);

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
    }, [currentPage]);

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

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/users/customers/?page=${currentPage}&page_size=${itemsPerPage}`);

            // Handle different API response structures
            let customersData = data.data || data.customers || data.results || [];
            let paginationInfo = data.pagination || data;

            setCustomers(customersData);

            // Set pagination info based on response structure
            if (paginationInfo.total_pages) {
                setTotalPages(paginationInfo.total_pages);
                setTotalCustomers(paginationInfo.total_count || paginationInfo.total);
            } else if (data.count) {
                setTotalPages(Math.ceil(data.count / itemsPerPage));
                setTotalCustomers(data.count);
            } else if (Array.isArray(customersData)) {
                setTotalPages(Math.ceil(customersData.length / itemsPerPage));
                setTotalCustomers(customersData.length);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to fetch customers',
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

            setSelectedCustomer(detailsData.data || detailsData);
            setCustomerStats(statsData.data || statsData);
        } catch (error) {
            console.error('Error fetching customer details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to fetch customer details',
                confirmButtonColor: '#dba627'
            });
            setShowDetailsModal(false);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleEditCustomer = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            phone: customer.phone || '',
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            email: customer.email || '',
            whatsapp: customer.whatsapp || '',
            gender: customer.gender || 'male',
            address: customer.address || ''
        });
        setShowEditForm(true);
    };

    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Try different possible endpoints for update
            let result;
            try {
                result = await apiFetch(`/users/${editingCustomer.id}/`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } catch (error) {
                // Try alternative endpoint
                result = await apiFetch(`/user/update-customer/${editingCustomer.id}/`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            }

            if (result.success || result.id) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Customer updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowEditForm(false);
                resetForm();
                setEditingCustomer(null);
                fetchCustomers();
            } else {
                throw new Error(result.message || 'Failed to update customer');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update customer. Please check if the endpoint exists.',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCustomer = async (customerId, customerName) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete customer "${customerName}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                // Try different possible endpoints for delete
                let response;
                try {
                    response = await apiFetch(`/users/${customerId}/`, {
                        method: 'DELETE'
                    });
                } catch (error) {
                    // Try alternative endpoint
                    response = await apiFetch(`/user/delete-customer/${customerId}/`, {
                        method: 'DELETE'
                    });
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Customer has been deleted successfully.',
                    confirmButtonColor: '#dba627'
                });
                
                // Refresh the customer list
                fetchCustomers();
            } catch (error) {
                console.error('Error deleting customer:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to delete customer. Please check if the endpoint exists.',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Try different possible endpoints for create
            let result;
            try {
                result = await apiFetch('/users/', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            } catch (error) {
                // Try alternative endpoint
                result = await apiFetch('/user/create-customer/', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            if (result.success || result.id) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Customer created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowCreateForm(false);
                resetForm();
                setCurrentPage(1);
                fetchCustomers();
            } else {
                throw new Error(result.message || 'Failed to create customer');
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

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }
        }

        return pageNumbers;
    };

    return (
        <DashboardLayout>
            <div className="px-3">
                {/* Header - Same as before */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Customer <span className="text-[#dba627]">Management</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Manage all customers and view their statistics</p>
                        {totalCustomers > 0 && (
                            <p className="text-sm text-gray-400 mt-1">Total: {totalCustomers} customers</p>
                        )}
                    </div>

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

                {/* Create Form Modal - Same as before */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Add New Customer</h2>
                                    <p className="text-xs text-gray-500 mt-1">Fill in the details to create a new customer</p>
                                </div>
                                <button onClick={() => setShowCreateForm(false)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">✕</button>
                            </div>
                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleCreateCustomer}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Form fields - Same as before */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <span className="text-gray-500 text-sm flex items-center gap-1">
                                                        <span className="text-base">🇮🇳</span>
                                                        <span>+91</span>
                                                    </span>
                                                </div>
                                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full h-10 pl-16 pr-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="98765 43210" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">First Name *</label>
                                            <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="Rahul" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Last Name</label>
                                            <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="Sharma" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="rahul.sharma@example.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">WhatsApp</label>
                                            <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="+91 98765 43210" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]">
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Address</label>
                                            <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="Flat 12, MG Road, Mumbai, Maharashtra" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={loading} className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer">{loading ? 'Creating...' : 'Create Customer'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Form Modal */}
                {showEditForm && editingCustomer && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Edit Customer</h2>
                                    <p className="text-xs text-gray-500 mt-1">Update customer information</p>
                                </div>
                                <button onClick={() => { setShowEditForm(false); setEditingCustomer(null); resetForm(); }} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">✕</button>
                            </div>
                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleUpdateCustomer}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Same form fields as create form */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <span className="text-gray-500 text-sm flex items-center gap-1">
                                                        <span className="text-base">🇮🇳</span>
                                                        <span>+91</span>
                                                    </span>
                                                </div>
                                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full h-10 pl-16 pr-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="98765 43210" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">First Name *</label>
                                            <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="Rahul" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Last Name</label>
                                            <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="Sharma" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="rahul.sharma@example.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">WhatsApp</label>
                                            <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="+91 98765 43210" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]">
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Address</label>
                                            <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]" placeholder="Flat 12, MG Road, Mumbai, Maharashtra" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button type="button" onClick={() => { setShowEditForm(false); setEditingCustomer(null); resetForm(); }} className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={loading} className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer">{loading ? 'Updating...' : 'Update Customer'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer Details Modal - Keep your existing implementation */}
                {/* ... (same as your original details modal) ... */}

                {/* Customers Table */}
                {loading && !showCreateForm && !showEditForm ? (
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
                                    {customers.map((customer, index) => (
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
                                                    <button
                                                        onClick={() => handleEditCustomer(customer)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Customer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCustomer(customer.id, `${customer.first_name} ${customer.last_name}`)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Customer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - Same as before */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                        {Math.min(currentPage * itemsPerPage, totalCustomers)} of{" "}
                                        {totalCustomers} customers
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={goToPreviousPage} disabled={currentPage === 1} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer"}`}>Previous</button>
                                    <div className="flex items-center gap-1">
                                        {getPageNumbers().map((pageNum) => (
                                            <button key={pageNum} onClick={() => goToPage(pageNum)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentPage === pageNum ? "bg-[#dba627] text-white cursor-pointer" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer"}`}>{pageNum}</button>
                                        ))}
                                    </div>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer"}`}>Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}