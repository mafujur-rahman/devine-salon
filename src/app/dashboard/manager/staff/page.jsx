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

export default function StaffManagement() {
    const router = useRouter();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [jobTitles, setJobTitles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        job_title: "",
        commission_percentage: "",
        base_salary: "",
        branch: ""
    });

    useEffect(() => {
        checkAuth();
        fetchStaff();
        fetchJobTitles();
        fetchBranches();
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

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/users/staff/');
            setStaff(data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch staff list',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchJobTitles = async () => {
        try {
            const data = await apiFetch('/staff/get-all-job-titles/');
            setJobTitles(data.data || []);
        } catch (error) {
            console.error('Error fetching job titles:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const data = await apiFetch('/branches/get-all-branches/');
            setBranches(data.data || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            job_title: parseInt(formData.job_title),
            commission_percentage: parseFloat(formData.commission_percentage),
            base_salary: parseFloat(formData.base_salary),
            branch: parseInt(formData.branch)
        };

        try {
            const result = await apiFetch('/staff/create-staff/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Staff member created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowCreateForm(false);
                resetForm();
                fetchStaff();
            }
        } catch (error) {
            console.error('Error creating staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create staff member',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            job_title: parseInt(formData.job_title),
            commission_percentage: parseFloat(formData.commission_percentage),
            base_salary: parseFloat(formData.base_salary),
            branch: parseInt(formData.branch)
        };

        try {
            const result = await apiFetch(`/staff/update-staff/${selectedStaff.id}/`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Staff member updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowEditForm(false);
                resetForm();
                fetchStaff();
            }
        } catch (error) {
            console.error('Error updating staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update staff member',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStaff = async (staffMember) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete ${staffMember.name}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const data = await apiFetch(`/staff/delete-staff/${staffMember.id}/`, {
                    method: 'DELETE'
                });

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Staff member has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchStaff();
                }
            } catch (error) {
                console.error('Error deleting staff:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to delete staff member',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleActive = async (staffMember) => {
        const newStatus = !staffMember.is_active;
        const action = newStatus ? 'activate' : 'deactivate';

        const result = await Swal.fire({
            title: `${newStatus ? 'Activate' : 'Deactivate'} Staff?`,
            text: `Are you sure you want to ${action} ${staffMember.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: `Yes, ${action}`
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const data = await apiFetch(`/staff/update-staff/${staffMember.id}/`, {
                    method: 'PUT',
                    body: JSON.stringify({ is_active: newStatus })
                });

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: `Staff member ${action}d successfully!`,
                        confirmButtonColor: '#dba627'
                    });
                    fetchStaff();
                }
            } catch (error) {
                console.error('Error toggling staff status:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to update staff status',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const openEditForm = (staffMember) => {
        setSelectedStaff(staffMember);
        setFormData({
            name: staffMember.name || "",
            phone: staffMember.phone || "",
            email: staffMember.email || "",
            address: staffMember.address || "",
            job_title: staffMember.job_title || "",
            commission_percentage: staffMember.commission_percentage || "",
            base_salary: staffMember.base_salary || "",
            branch: staffMember.branch || ""
        });
        setShowEditForm(true);
    };

    const openDetailsModal = (staffMember) => {
        setSelectedStaff(staffMember);
        setShowDetailsModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            email: "",
            address: "",
            job_title: "",
            commission_percentage: "",
            base_salary: "",
            branch: ""
        });
        setSelectedStaff(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getJobTitleName = (jobTitleId) => {
        const jobTitle = jobTitles.find(jt => jt.id === jobTitleId);
        return jobTitle ? jobTitle.name : "Unknown";
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : "Unknown";
    };

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Staff <span className="text-[#dba627]">Management</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Manage your branch staff members</p>
                    </div>
                </div>

                {/* Create Staff Button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateForm(true);
                        }}
                        className="bg-black text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Staff Member
                    </button>
                </div>

                {/* Create Staff Form Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Add New Staff Member
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Fill in the details to add a new staff member
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        resetForm();
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleCreateStaff}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="017XXXXXXXX"
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
                                                placeholder="staff@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Enter address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Job Title *
                                            </label>
                                            <select
                                                name="job_title"
                                                value={formData.job_title}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            >
                                                <option value="">Select Job Title</option>
                                                {jobTitles.map(title => (
                                                    <option key={title.id} value={title.id}>
                                                        {title.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Branch *
                                            </label>
                                            <select
                                                name="branch"
                                                value={formData.branch}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            >
                                                <option value="">Select Branch</option>
                                                {branches.map(branch => (
                                                    <option key={branch.id} value={branch.id}>
                                                        {branch.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Commission Percentage
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="commission_percentage"
                                                value={formData.commission_percentage}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Base Salary
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="base_salary"
                                                value={formData.base_salary}
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
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                resetForm();
                                            }}
                                            className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? 'Creating...' : 'Add Staff Member'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Staff Form Modal */}
                {showEditForm && selectedStaff && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Edit Staff Member
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Update staff member information
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEditForm(false);
                                        resetForm();
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleUpdateStaff}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
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
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Job Title *
                                            </label>
                                            <select
                                                name="job_title"
                                                value={formData.job_title}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            >
                                                <option value="">Select Job Title</option>
                                                {jobTitles.map(title => (
                                                    <option key={title.id} value={title.id}>
                                                        {title.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Branch *
                                            </label>
                                            <select
                                                name="branch"
                                                value={formData.branch}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            >
                                                <option value="">Select Branch</option>
                                                {branches.map(branch => (
                                                    <option key={branch.id} value={branch.id}>
                                                        {branch.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Commission Percentage
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="commission_percentage"
                                                value={formData.commission_percentage}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Base Salary
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="base_salary"
                                                value={formData.base_salary}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEditForm(false);
                                                resetForm();
                                            }}
                                            className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? 'Updating...' : 'Update Staff Member'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Details Modal */}
                {showDetailsModal && selectedStaff && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Staff Details
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Complete staff member information
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedStaff(null);
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Staff ID
                                        </label>
                                        <p className="text-sm font-semibold text-gray-900">#{selectedStaff.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Status
                                        </label>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedStaff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {selectedStaff.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Full Name
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Phone Number
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.phone}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Email
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Address
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Job Title
                                        </label>
                                        <p className="text-sm text-gray-900">{getJobTitleName(selectedStaff.job_title)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Branch
                                        </label>
                                        <p className="text-sm text-gray-900">{getBranchName(selectedStaff.branch)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Commission Percentage
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.commission_percentage}%</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Base Salary
                                        </label>
                                        <p className="text-sm font-semibold text-[#dba627]">৳{selectedStaff.base_salary}</p>
                                    </div>
                                    {selectedStaff.user_id && (
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                Login Role
                                            </label>
                                            <p className="text-sm text-gray-900 capitalize">{selectedStaff.login_role || 'No login access'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedStaff(null);
                                    }}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Table */}
                {loading && !showCreateForm && !showEditForm ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No staff members found. Click Add Staff Member to add one.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {staff.map((staffMember, index) => (
                                    <tr key={staffMember.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-gray-900">#{staffMember.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{staffMember.name}</p>
                                                {staffMember.email && (
                                                    <p className="text-xs text-gray-400">{staffMember.email}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-700">{staffMember.phone}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-700">{getJobTitleName(staffMember.job_title)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-700">{getBranchName(staffMember.branch)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-[#dba627]">৳{staffMember.base_salary}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${staffMember.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {staffMember.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openDetailsModal(staffMember)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openEditForm(staffMember)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(staffMember)}
                                                    className={`p-2 ${staffMember.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition-colors`}
                                                    title={staffMember.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {staffMember.is_active ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStaff(staffMember)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
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
                )}
            </div>
        </DashboardLayout>
    );
}