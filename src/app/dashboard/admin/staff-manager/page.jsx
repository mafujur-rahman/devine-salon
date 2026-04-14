"use client"
import DashboardLayout from '@/app/page';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const StaffManagement = () => {
    // State for job titles
    const [jobTitles, setJobTitles] = useState([]);
    const [showJobTitleForm, setShowJobTitleForm] = useState(false);
    const [editingJobTitle, setEditingJobTitle] = useState(null);
    const [jobTitleFormData, setJobTitleFormData] = useState({
        name: '',
        creates_manager_account: false
    });

    // State for staff members
    const [staffMembers, setStaffMembers] = useState([]);
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffFormData, setStaffFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        job_title: '',
        commission_percentage: '',
        base_salary: '',
        branch: ''
    });

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('staff');
    const API_BASE_URL = 'https://saloon.mrshakil.com/api';

    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Token 73e4c3a1fbc67f4ebdae84b0d3a7e2b03539c514'
        }
    });

    useEffect(() => {
        fetchJobTitles();
        fetchStaffMembers();
        fetchBranches();
    }, []);

    // Job Title CRUD Operations
    const fetchJobTitles = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/staff/get-all-job-titles/');
            const data = response.data;
            let jobTitlesData = data.data || data.job_titles || data.results || [];
            setJobTitles(jobTitlesData);
        } catch (error) {
            console.error('Error fetching job titles:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch job titles',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateJobTitle = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.post('/staff/create-job-title/', jobTitleFormData);
            const result = response.data;
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Job title created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowJobTitleForm(false);
                setJobTitleFormData({ name: '', creates_manager_account: false });
                fetchJobTitles();
            }
        } catch (error) {
            console.error('Error creating job title:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create job title',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateJobTitle = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.put(`/staff/update-job-title/${editingJobTitle.id}/`, jobTitleFormData);
            const result = response.data;
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Job title updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowJobTitleForm(false);
                setEditingJobTitle(null);
                setJobTitleFormData({ name: '', creates_manager_account: false });
                fetchJobTitles();
            }
        } catch (error) {
            console.error('Error updating job title:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.error || 'Failed to update job title',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJobTitle = async (jobTitleId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, delete it!'
        });
        
        if (result.isConfirmed) {
            setLoading(true);
            try {
                const response = await axiosInstance.delete(`/staff/delete-job-title/${jobTitleId}/`);
                const data = response.data;
                
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Job title has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchJobTitles();
                }
            } catch (error) {
                console.error('Error deleting job title:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to delete job title',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    // Staff CRUD Operations
    const fetchStaffMembers = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/users/staff/');
            const data = response.data;
            let staffData = data.data || data.staff || data.results || [];
            setStaffMembers(staffData);
        } catch (error) {
            console.error('Error fetching staff members:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch staff members',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await axiosInstance.get('/branches/get-all-branches/');
            const data = response.data;
            let branchesData = data.data || data.branches || data.results || [];
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: staffFormData.name,
                phone: staffFormData.phone,
                email: staffFormData.email,
                address: staffFormData.address,
                job_title: parseInt(staffFormData.job_title),
                commission_percentage: parseFloat(staffFormData.commission_percentage) || 0,
                base_salary: parseFloat(staffFormData.base_salary),
                branch: parseInt(staffFormData.branch)
            };
            
            const response = await axiosInstance.post('/staff/create-staff/', payload);
            const result = response.data;
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Staff member created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowStaffForm(false);
                resetStaffForm();
                fetchStaffMembers();
            }
        } catch (error) {
            console.error('Error creating staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create staff member',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: staffFormData.name,
                phone: staffFormData.phone,
                email: staffFormData.email,
                address: staffFormData.address,
                job_title: parseInt(staffFormData.job_title),
                commission_percentage: parseFloat(staffFormData.commission_percentage) || 0,
                base_salary: parseFloat(staffFormData.base_salary),
                branch: parseInt(staffFormData.branch)
            };
            
            const response = await axiosInstance.put(`/staff/update-staff/${editingStaff.id}/`, payload);
            const result = response.data;
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Staff member updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowStaffForm(false);
                setEditingStaff(null);
                resetStaffForm();
                fetchStaffMembers();
            }
        } catch (error) {
            console.error('Error updating staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update staff member',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStaff = async (staffId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, delete it!'
        });
        
        if (result.isConfirmed) {
            setLoading(true);
            try {
                const response = await axiosInstance.delete(`/staff/delete-staff/${staffId}/`);
                const data = response.data;
                
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Staff member has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchStaffMembers();
                }
            } catch (error) {
                console.error('Error deleting staff:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to delete staff member',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const resetStaffForm = () => {
        setStaffFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            job_title: '',
            commission_percentage: '',
            base_salary: '',
            branch: ''
        });
    };

    const handleStaffInputChange = (e) => {
        setStaffFormData({
            ...staffFormData,
            [e.target.name]: e.target.value
        });
    };

    const openEditStaff = (staff) => {
        setEditingStaff(staff);
        setStaffFormData({
            name: staff.name || '',
            phone: staff.phone || '',
            email: staff.email || '',
            address: staff.address || '',
            job_title: staff.job_title || '',
            commission_percentage: staff.commission_percentage || '',
            base_salary: staff.base_salary || '',
            branch: staff.branch || ''
        });
        setShowStaffForm(true);
    };

    const openEditJobTitle = (jobTitle) => {
        setEditingJobTitle(jobTitle);
        setJobTitleFormData({
            name: jobTitle.name,
            creates_manager_account: jobTitle.creates_manager_account
        });
        setShowJobTitleForm(true);
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-white">
                <div className="px-4">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-black tracking-tight">
                                Staff & <span className="text-[#dba627]">Manager</span> Management
                            </h1>
                            <p className="text-gray-500 mt-1">Manage staff members, job titles, and branch managers</p>
                        </div>
                    </div>

                    {/* Tabs and Add Buttons Row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-4 border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('staff')}
                                className={`pb-3 px-4 font-semibold transition-colors ${
                                    activeTab === 'staff'
                                        ? 'text-[#dba627] border-b-2 border-[#dba627]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Staff Members
                            </button>
                            <button
                                onClick={() => setActiveTab('job-titles')}
                                className={`pb-3 px-4 font-semibold transition-colors ${
                                    activeTab === 'job-titles'
                                        ? 'text-[#dba627] border-b-2 border-[#dba627]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Job Titles
                            </button>
                        </div>
                        
                        {activeTab === 'job-titles' && (
                            <button
                                onClick={() => {
                                    setEditingJobTitle(null);
                                    setJobTitleFormData({ name: '', creates_manager_account: false });
                                    setShowJobTitleForm(true);
                                }}
                                className="bg-black text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Job Title
                            </button>
                        )}
                        
                        {activeTab === 'staff' && (
                            <button
                                onClick={() => {
                                    setEditingStaff(null);
                                    resetStaffForm();
                                    setShowStaffForm(true);
                                }}
                                className="bg-black text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Staff Member
                            </button>
                        )}
                    </div>

                    {/* Job Titles Section */}
                    {activeTab === 'job-titles' && (
                        <>
                            {showJobTitleForm && (
                                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                                    <div className="w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900">
                                                    {editingJobTitle ? 'Edit Job Title' : 'Add New Job Title'}
                                                </h2>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {editingJobTitle ? 'Update job title details' : 'Fill in the details to create a new job title'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowJobTitleForm(false);
                                                    setEditingJobTitle(null);
                                                    setJobTitleFormData({ name: '', creates_manager_account: false });
                                                }}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="overflow-y-auto px-6 py-5">
                                            <form onSubmit={editingJobTitle ? handleUpdateJobTitle : handleCreateJobTitle}>
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Job Title Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={jobTitleFormData.name}
                                                            onChange={(e) => setJobTitleFormData({ ...jobTitleFormData, name: e.target.value })}
                                                            required
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] focus:border-transparent"
                                                            placeholder="e.g., Stylist, Cashier, Branch Manager"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={jobTitleFormData.creates_manager_account}
                                                                onChange={(e) => setJobTitleFormData({ ...jobTitleFormData, creates_manager_account: e.target.checked })}
                                                                className="w-4 h-4 rounded border-gray-300 text-[#dba627] focus:ring-[#dba627]"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">Creates Manager Account (Branch Manager)</span>
                                                        </label>
                                                        <p className="text-xs text-gray-500 mt-1 ml-6">
                                                            If checked, users with this job title will have manager privileges
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowJobTitleForm(false);
                                                            setEditingJobTitle(null);
                                                            setJobTitleFormData({ name: '', creates_manager_account: false });
                                                        }}
                                                        className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {loading ? 'Saving...' : (editingJobTitle ? 'Update' : 'Create')}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading && !showJobTitleForm ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                                </div>
                            ) : jobTitles.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">No job titles found. Click Add Job Title to create one.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {jobTitles.map((jobTitle, index) => (
                                                <tr key={jobTitle.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-gray-900">{jobTitle.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {jobTitle.creates_manager_account ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Branch Manager
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                Staff
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">#{jobTitle.id}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditJobTitle(jobTitle)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteJobTitle(jobTitle.id)}
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
                        </>
                    )}

                    {/* Staff Section */}
                    {activeTab === 'staff' && (
                        <>
                            {showStaffForm && (
                                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                                    <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900">
                                                    {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                                                </h2>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {editingStaff ? 'Update staff member details' : 'Fill in the details to create a new staff member'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowStaffForm(false);
                                                    setEditingStaff(null);
                                                    resetStaffForm();
                                                }}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="overflow-y-auto px-6 py-5">
                                            <form onSubmit={editingStaff ? handleUpdateStaff : handleCreateStaff}>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Full Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={staffFormData.name}
                                                            onChange={handleStaffInputChange}
                                                            required
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            placeholder="Karim"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Phone *
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={staffFormData.phone}
                                                            onChange={handleStaffInputChange}
                                                            required
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            placeholder="01888888888"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Email *
                                                        </label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={staffFormData.email}
                                                            onChange={handleStaffInputChange}
                                                            required
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            placeholder="staff@example.com"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Job Title *
                                                        </label>
                                                        <select
                                                            name="job_title"
                                                            value={staffFormData.job_title}
                                                            onChange={handleStaffInputChange}
                                                            required
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        >
                                                            <option value="">Select Job Title</option>
                                                            {jobTitles.map(title => (
                                                                <option key={title.id} value={title.id}>
                                                                    {title.name} {title.creates_manager_account && '(Manager)'}
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
                                                            name="commission_percentage"
                                                            value={staffFormData.commission_percentage}
                                                            onChange={handleStaffInputChange}
                                                            step="0.01"
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            placeholder="20"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Base Salary (BDT) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="base_salary"
                                                            value={staffFormData.base_salary}
                                                            onChange={handleStaffInputChange}
                                                            required
                                                            step="0.01"
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            placeholder="15000"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Branch *
                                                        </label>
                                                        <select
                                                            name="branch"
                                                            value={staffFormData.branch}
                                                            onChange={handleStaffInputChange}
                                                            required
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        >
                                                            <option value="">Select Branch</option>
                                                            {branches.map(branch => (
                                                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Address
                                                        </label>
                                                        <textarea
                                                            name="address"
                                                            value={staffFormData.address}
                                                            onChange={handleStaffInputChange}
                                                            rows="2"
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            placeholder="Dhaka"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowStaffForm(false);
                                                            setEditingStaff(null);
                                                            resetStaffForm();
                                                        }}
                                                        className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {loading ? 'Saving...' : (editingStaff ? 'Update' : 'Create')}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading && !showStaffForm ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                                </div>
                            ) : staffMembers.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">No staff members found. Click Add Staff Member to create one.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Name</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Salary</th>
                                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {staffMembers.map((staff, index) => {
                                                const jobTitle = jobTitles.find(jt => jt.id === staff.job_title);
                                                const branch = branches.find(b => b.id === staff.branch);
                                                const isManager = jobTitle?.creates_manager_account;
                                                
                                                return (
                                                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${isManager ? 'bg-green-500' : 'bg-[#dba627]'}`}>
                                                                    {staff.name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {staff.name}
                                                                    </p>
                                                                    {isManager && (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                            Manager
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-600">{staff.email}</div>
                                                            <div className="text-xs text-gray-400">{staff.phone}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-700">{jobTitle?.name || 'N/A'}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-700">{branch?.name || 'N/A'}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {staff.commission_percentage ? `${staff.commission_percentage}%` : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {staff.base_salary ? `₹${staff.base_salary}` : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => openEditStaff(staff)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteStaff(staff.id)}
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StaffManagement;