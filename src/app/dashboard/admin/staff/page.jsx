"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";
import axios from "axios";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function AdminStaff() {
    const router = useRouter();
    const [staff, setStaff] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [bookableStaff, setBookableStaff] = useState([]);
    const [showBookableModal, setShowBookableModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [branches, setBranches] = useState([]);
    const [jobTitles, setJobTitles] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [showJobTitleForm, setShowJobTitleForm] = useState(false);
    const [showJobTitlesModal, setShowJobTitlesModal] = useState(false);
    const [editingJobTitle, setEditingJobTitle] = useState(null);
    const [jobTitleFormData, setJobTitleFormData] = useState({
        name: '',
        creates_manager_account: false,
        can_take_appointments: true
    });

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

    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
    const [selectedJobTitleFilter, setSelectedJobTitleFilter] = useState('');
    const [selectedActiveFilter, setSelectedActiveFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        }
    }, []);

    useEffect(() => {
        checkAuth();
        fetchStaff();
        fetchBranches();
        fetchJobTitles();
    }, []);

    useEffect(() => {
        applyFilters();
        setCurrentPage(1); // Reset to first page when filters change
    }, [selectedBranchFilter, selectedJobTitleFilter, selectedActiveFilter, searchTerm, staff]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "superadmin") {
            router.push("/login");
        }
    };

    const applyFilters = () => {
        let filtered = [...staff];

        if (selectedBranchFilter) {
            filtered = filtered.filter(member => member.branch === parseInt(selectedBranchFilter));
        }

        if (selectedJobTitleFilter) {
            filtered = filtered.filter(member => member.job_title === parseInt(selectedJobTitleFilter));
        }

        if (selectedActiveFilter !== '') {
            filtered = filtered.filter(member => member.is_active === (selectedActiveFilter === 'active'));
        }

        if (searchTerm) {
            filtered = filtered.filter(member =>
                member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.phone?.includes(searchTerm) ||
                member.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredStaff(filtered);
    };

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/staff/get-all-staff/`;
            if (selectedBranchFilter) {
                url += `?branch=${selectedBranchFilter}`;
            }
            const response = await axios.get(url);
            const staffData = response.data.data || response.data.staff || response.data.results || [];
            setStaff(staffData);
            setFilteredStaff(staffData);
        } catch (error) {
            console.error('Error fetching staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch staff',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchBookableStaff = async (branchId) => {
        setLoading(true);
        try {
            const url = `${API_BASE}/staff/bookable/?branch_id=${branchId}`;
            const response = await axios.get(url);
            const staffData = response.data.data || response.data.staff || response.data.results || [];
            setBookableStaff(staffData);
            setShowBookableModal(true);
        } catch (error) {
            console.error('Error fetching bookable staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch bookable staff',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await axios.get(`${API_BASE}/branches/get-all-branches/`);
            const branchesData = response.data.data || response.data.branches || response.data.results || [];
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchJobTitles = async () => {
        try {
            const response = await axios.get(`${API_BASE}/staff/get-all-job-titles/`);
            const jobTitlesData = response.data.data || response.data.job_titles || response.data.results || [];
            const filteredJobTitles = jobTitlesData.filter(job =>
                job.name.toLowerCase() !== 'manager'
            );
            setJobTitles(filteredJobTitles);
        } catch (error) {
            console.error('Error fetching job titles:', error);
        }
    };

    const handleCreateJobTitle = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/staff/create-job-title/`, jobTitleFormData);
            const result = response.data;

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Job title created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowJobTitleForm(false);
                setJobTitleFormData({ name: '', creates_manager_account: false, can_take_appointments: true });
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
            const response = await axios.put(`${API_BASE}/staff/update-job-title/${editingJobTitle.id}/`, {
                name: jobTitleFormData.name,
                creates_manager_account: jobTitleFormData.creates_manager_account
            });
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
                setJobTitleFormData({ name: '', creates_manager_account: false, can_take_appointments: true });
                fetchJobTitles();
            } else if (result.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.error,
                    confirmButtonColor: '#dba627'
                });
            }
        } catch (error) {
            console.error('Error updating job title:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.error || error.response?.data?.message || 'Failed to update job title',
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
                const response = await axios.delete(`${API_BASE}/staff/delete-job-title/${jobTitleId}/`);
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

            const response = await axios.post(`${API_BASE}/staff/create-staff/`, payload);
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
                fetchStaff();
            }
        } catch (error) {
            console.error('Error creating staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Manager already exist, Choose another branch.',
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

            const response = await axios.put(`${API_BASE}/staff/update-staff/${editingStaff.id}/`, payload);
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
                fetchStaff();
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
                const response = await axios.delete(`${API_BASE}/staff/delete-staff/${staffId}/`);

                if (response.data.success) {
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
                    text: error.response?.data?.message || 'Failed to delete staff member',
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
            title: `${newStatus ? 'Activate' : 'Deactivate'} Staff Member?`,
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
                const response = await axios.put(`${API_BASE}/staff/update-staff/${staffMember.id}/`, {
                    is_active: newStatus
                });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: `Staff member ${action}d successfully`,
                        confirmButtonColor: '#dba627'
                    });
                    fetchStaff();
                    if (showDetailsModal && selectedStaff?.id === staffMember.id) {
                        fetchStaffDetails(staffMember.id);
                    }
                }
            } catch (error) {
                console.error('Error toggling staff status:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || `Failed to ${action} staff member`,
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchStaffDetails = async (staffId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/staff/staff/${staffId}/`);
            setSelectedStaff(response.data.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching staff details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch staff details',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditStaff = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Edit Staff Member',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Full Name" value="${selectedStaff.name || ''}">
                <input id="swal-phone" class="swal2-input" placeholder="Phone Number" value="${selectedStaff.phone || ''}">
                <input id="swal-email" class="swal2-input" placeholder="Email Address" value="${selectedStaff.email || ''}">
                <input id="swal-address" class="swal2-input" placeholder="Complete Address" value="${selectedStaff.address || ''}">
                <input id="swal-base-salary" class="swal2-input" placeholder="Base Salary (₹)" value="${selectedStaff.base_salary || ''}">
                <input id="swal-commission" class="swal2-input" placeholder="Commission Percentage (%)" value="${selectedStaff.commission_percentage || ''}">
                <select id="swal-job-title" class="swal2-select">
                    ${jobTitles.map(job => `
                        <option value="${job.id}" ${selectedStaff.job_title === job.id ? 'selected' : ''}>
                            ${job.name}
                        </option>
                    `).join('')}
                </select>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Update',
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value,
                    phone: document.getElementById('swal-phone').value,
                    email: document.getElementById('swal-email').value,
                    address: document.getElementById('swal-address').value,
                    base_salary: document.getElementById('swal-base-salary').value,
                    commission_percentage: document.getElementById('swal-commission').value,
                    job_title: document.getElementById('swal-job-title').value
                };
            }
        });

        if (formValues) {
            setLoading(true);
            try {
                const response = await axios.put(`${API_BASE}/staff/update-staff/${selectedStaff.id}/`, formValues);

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Staff member updated successfully',
                        confirmButtonColor: '#dba627'
                    });
                    fetchStaff();
                    fetchStaffDetails(selectedStaff.id);
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
            creates_manager_account: jobTitle.creates_manager_account,
            can_take_appointments: jobTitle.can_take_appointments
        });
        setShowJobTitleForm(true);
    };

    const openJobTitlesModal = () => {
        setShowJobTitlesModal(true);
    };

    const totalStaff = filteredStaff.length;
    const activeStaff = filteredStaff.filter(member => member.is_active).length;
    const inactiveStaff = filteredStaff.filter(member => !member.is_active).length;
    const totalMonthlySalary = filteredStaff.reduce((sum, member) => sum + parseFloat(member.base_salary || 0), 0);
    const uniqueBranches = new Set(filteredStaff.map(s => s.branch)).size;

    const clearFilters = () => {
        setSelectedBranchFilter('');
        setSelectedJobTitleFilter('');
        setSelectedActiveFilter('');
        setSearchTerm('');
    };

    return (
        <DashboardLayout>
            <div>
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Staff <span className="text-[#dba627]">Management</span>
                        </h1>
                        <p className="text-gray-500 mt-1">View and manage all staff members across all branches</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={openJobTitlesModal}
                            className="bg-black text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Job Titles
                        </button>
                        <button
                            onClick={() => {
                                setEditingStaff(null);
                                resetStaffForm();
                                setShowStaffForm(true);
                            }}
                            className="bg-[#dba627] text-black font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Staff Member
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Staff</p>
                        <p className="text-2xl font-bold">{totalStaff}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Active Staff</p>
                        <p className="text-2xl font-bold">{activeStaff}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Inactive Staff</p>
                        <p className="text-2xl font-bold">{inactiveStaff}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Unique Branches</p>
                        <p className="text-2xl font-bold">{uniqueBranches}</p>
                    </div>
                    <div className="bg-[#dba627] rounded-xl p-4 text-black shadow-lg">
                        <p className="text-sm opacity-90">Monthly Salary Pool</p>
                        <p className="text-2xl font-bold">₹{totalMonthlySalary.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
                        <button
                            onClick={clearFilters}
                            className="text-xs text-[#dba627] hover:text-black"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <select
                            value={selectedBranchFilter}
                            onChange={(e) => setSelectedBranchFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name} - {branch.city}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedJobTitleFilter}
                            onChange={(e) => setSelectedJobTitleFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Job Titles</option>
                            {jobTitles.map(job => (
                                <option key={job.id} value={job.id}>
                                    {job.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedActiveFilter}
                            onChange={(e) => setSelectedActiveFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Search by name, phone or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                    </div>
                </div>

                {showJobTitlesModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Manage Job Titles</h2>
                                    <p className="text-xs text-gray-500 mt-1">View, edit, and delete job titles</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowJobTitlesModal(false);
                                        setEditingJobTitle(null);
                                        setJobTitleFormData({ name: '', creates_manager_account: false, can_take_appointments: true });
                                        setShowJobTitleForm(false);
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto p-6">
                                <div className="mb-6 flex justify-end">
                                    <button
                                        onClick={() => {
                                            setEditingJobTitle(null);
                                            setJobTitleFormData({ name: '', creates_manager_account: false, can_take_appointments: true });
                                            setShowJobTitleForm(true);
                                        }}
                                        className="bg-black text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add New Job Title
                                    </button>
                                </div>

                                {jobTitles.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-500">No job titles found.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager Account</th>
                                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Can Take Appointments</th>
                                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {jobTitles.map((jobTitle, index) => (
                                                    <tr key={jobTitle.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-medium text-gray-900">{jobTitle.name}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${jobTitle.creates_manager_account ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                                                {jobTitle.creates_manager_account ? 'YES' : 'NO'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${jobTitle.can_take_appointments ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                                {jobTitle.can_take_appointments ? 'YES' : 'NO'}
                                                            </span>
                                                        </td>
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
                            </div>

                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowJobTitlesModal(false);
                                        setEditingJobTitle(null);
                                        setJobTitleFormData({ name: '', creates_manager_account: false, can_take_appointments: true });
                                        setShowJobTitleForm(false);
                                    }}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                        setJobTitleFormData({ name: '', creates_manager_account: false, can_take_appointments: true });
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
                                                placeholder="e.g., Hair Stylist, Beautician, Branch Manager"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer mb-3">
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

                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={jobTitleFormData.can_take_appointments}
                                                    onChange={(e) => setJobTitleFormData({ ...jobTitleFormData, can_take_appointments: e.target.checked })}
                                                    className="w-4 h-4 rounded border-gray-300 text-[#dba627] focus:ring-[#dba627]"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Can Take Appointments</span>
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1 ml-6">
                                                If checked, staff with this job title can be booked for appointments
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowJobTitleForm(false);
                                                setEditingJobTitle(null);
                                                setJobTitleFormData({ name: '', creates_manager_account: false, can_take_appointments: true });
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
                                                onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Phone Number *
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
                                                value={staffFormData.phone}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                                                required
                                                className="w-full h-10 pl-16 pr-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="98765 43210"
                                            />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={staffFormData.email}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="name@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Job Title *
                                            </label>
                                            <select
                                                name="job_title"
                                                value={staffFormData.job_title}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, job_title: e.target.value })}
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
                                                Commission Percentage
                                            </label>
                                            <input
                                                type="number"
                                                name="commission_percentage"
                                                value={staffFormData.commission_percentage}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, commission_percentage: e.target.value })}
                                                step="0.01"
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., 10%"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Base Salary (₹) *
                                            </label>
                                            <input
                                                type="number"
                                                name="base_salary"
                                                value={staffFormData.base_salary}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, base_salary: e.target.value })}
                                                required
                                                step="0.01"
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Enter monthly salary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Branch *
                                            </label>
                                            <select
                                                name="branch"
                                                value={staffFormData.branch}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, branch: e.target.value })}
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
                                                Complete Address
                                            </label>
                                            <textarea
                                                name="address"
                                                value={staffFormData.address}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, address: e.target.value })}
                                                rows="2"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Enter complete address with city, state, pincode"
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

                {showBookableModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Bookable Staff</h2>
                                    <p className="text-xs text-gray-500 mt-1">Staff available for booking</p>
                                </div>
                                <button
                                    onClick={() => setShowBookableModal(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-5">
                                {bookableStaff.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No bookable staff found for this branch</p>
                                ) : (
                                    <div className="space-y-3">
                                        {bookableStaff.map(staff => (
                                            <div key={staff.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                                                        <p className="text-sm text-gray-600">{staff.job_title_name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{staff.phone}</p>
                                                    </div>
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                        Bookable
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowBookableModal(false)}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showDetailsModal && selectedStaff && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Staff Details</h2>
                                    <p className="text-xs text-gray-500 mt-1">View complete staff information</p>
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
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedStaff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {selectedStaff.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                            <button
                                                onClick={() => handleToggleActive(selectedStaff)}
                                                className="text-[#dba627] hover:text-black text-xs font-medium"
                                            >
                                                {selectedStaff.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Full Name
                                        </label>
                                        <p className="text-lg font-bold text-gray-900">{selectedStaff.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Phone Number
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.phone}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Email Address
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Complete Address
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Branch
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.branch_name || `ID: ${selectedStaff.branch}`}</p>
                                        {selectedStaff.branch_city && (
                                            <p className="text-xs text-gray-500">{selectedStaff.branch_city}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Job Title
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.job_title_name || `ID: ${selectedStaff.job_title}`}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Base Salary
                                        </label>
                                        <p className="text-sm font-semibold text-[#dba627]">₹{selectedStaff.base_salary}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Commission
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedStaff.commission_percentage}%</p>
                                    </div>
                                    {selectedStaff.login_role && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                Login Role
                                            </label>
                                            <p className="text-sm text-gray-900 capitalize">{selectedStaff.login_role}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={handleEditStaff}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Edit Staff
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedStaff(null);
                                    }}
                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No staff members found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SL</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.map((member, index) => {
                                        const branch = branches.find(b => b.id === member.branch);
                                        const serialNumber = indexOfFirstItem + index + 1;

                                        return (
                                            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{serialNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-gray-900">{member.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">+91{member.phone}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="text-sm text-gray-700">{branch?.name || `ID: ${member.branch}`}</span>
                                                        {branch?.city && (
                                                            <div className="text-xs text-gray-400">{branch.city}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{member.job_title_name || `ID: ${member.job_title}`}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-[#dba627]">₹{member.base_salary}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{member.commission_percentage}%</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {member.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => fetchBookableStaff(member.branch)}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="View Bookable Staff"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => openEditStaff(member)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStaff(member.id)}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-lg">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredStaff.length)}</span> of{' '}
                                            <span className="font-medium">{filteredStaff.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            <button
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Previous</span>
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            {[...Array(totalPages).keys()].map(number => {
                                                const pageNumber = number + 1;
                                                // Show first page, last page, current page, and pages around current page
                                                if (
                                                    pageNumber === 1 ||
                                                    pageNumber === totalPages ||
                                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNumber}
                                                            onClick={() => paginate(pageNumber)}
                                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNumber
                                                                    ? 'z-10 bg-[#dba627] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dba627]'
                                                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                                }`}
                                                        >
                                                            {pageNumber}
                                                        </button>
                                                    );
                                                } else if (
                                                    (pageNumber === currentPage - 2 && currentPage > 3) ||
                                                    (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                                                ) {
                                                    return (
                                                        <span
                                                            key={pageNumber}
                                                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                                                        >
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })}
                                            <button
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Next</span>
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}