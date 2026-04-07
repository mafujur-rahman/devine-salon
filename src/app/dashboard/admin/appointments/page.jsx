"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";
import axios from "axios";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function AdminAppointments() {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
    const [statusUpdateData, setStatusUpdateData] = useState({ status: '' });
    const [branches, setBranches] = useState([]);
    
    // Admin-specific filters
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Axios interceptor for auth token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        }
    }, []);

    useEffect(() => {
        checkAuth();
        fetchAppointments();
        fetchBranches();
    }, []);

    // Apply filters whenever filter criteria or appointments change
    useEffect(() => {
        applyFilters();
    }, [selectedBranchFilter, selectedStatusFilter, dateFilter, searchTerm, appointments]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "superadmin") {
            router.push("/login");
        }
    };

    const applyFilters = () => {
        let filtered = [...appointments];
        
        // Filter by branch
        if (selectedBranchFilter) {
            filtered = filtered.filter(apt => apt.branch === parseInt(selectedBranchFilter));
        }
        
        // Filter by status
        if (selectedStatusFilter) {
            filtered = filtered.filter(apt => apt.status === selectedStatusFilter);
        }
        
        // Filter by date
        if (dateFilter) {
            filtered = filtered.filter(apt => apt.date === dateFilter);
        }
        
        // Search by customer name or phone
        if (searchTerm) {
            filtered = filtered.filter(apt => 
                apt.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.customer_phone?.includes(searchTerm) ||
                apt.id.toString().includes(searchTerm)
            );
        }
        
        setFilteredAppointments(filtered);
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/appointments/get-all-appointments/`);
            const appointmentsData = response.data.data || response.data.appointments || response.data.results || [];
            setAppointments(appointmentsData);
            setFilteredAppointments(appointmentsData);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch appointments',
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

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.put(`${API_BASE}/appointment/${selectedAppointment.id}/update-status/`, statusUpdateData);
            
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Appointment status updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowUpdateStatusModal(false);
                fetchAppointments();
                if (showDetailsModal) {
                    fetchAppointmentDetails(selectedAppointment.id);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update status',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
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
                const response = await axios.delete(`${API_BASE}/appointment/delete-appointment/${appointmentId}/`);
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Appointment has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchAppointments();
                }
            } catch (error) {
                console.error('Error deleting appointment:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to delete appointment',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchAppointmentDetails = async (appointmentId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/appointment/${appointmentId}/`);
            setSelectedAppointment(response.data.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching appointment details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch appointment details',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'booked': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-blue-100 text-blue-800',
            'in_progress': 'bg-purple-100 text-purple-800',
            'completed': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const openUpdateStatus = (appointment) => {
        setSelectedAppointment(appointment);
        setStatusUpdateData({ status: appointment.status });
        setShowUpdateStatusModal(true);
    };

    const handleEditNotes = async () => {
        const { value: notes } = await Swal.fire({
            title: 'Edit Notes',
            input: 'textarea',
            inputLabel: 'Appointment Notes',
            inputValue: selectedAppointment.notes || '',
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Update'
        });

        if (notes !== undefined) {
            try {
                const response = await axios.put(`${API_BASE}/appointment/update-appointment/${selectedAppointment.id}/`, { notes });
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Notes updated successfully',
                        confirmButtonColor: '#dba627'
                    });
                    fetchAppointments();
                    fetchAppointmentDetails(selectedAppointment.id);
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update notes',
                    confirmButtonColor: '#dba627'
                });
            }
        }
    };

    // Statistics for admin dashboard
    const totalAppointments = filteredAppointments.length;
    const completedCount = filteredAppointments.filter(apt => apt.status === 'completed').length;
    const pendingCount = filteredAppointments.filter(apt => apt.status === 'booked' || apt.status === 'approved').length;
    const cancelledCount = filteredAppointments.filter(apt => apt.status === 'cancelled').length;
    const totalRevenue = filteredAppointments.reduce((sum, apt) => sum + parseFloat(apt.total_amount || 0), 0);

    const clearFilters = () => {
        setSelectedBranchFilter('');
        setSelectedStatusFilter('');
        setDateFilter('');
        setSearchTerm('');
    };

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Admin <span className="text-[#dba627]">Appointments</span>
                        </h1>
                        <p className="text-gray-500 mt-1">View and manage all appointments across all branches</p>
                    </div>
                </div>

                {/* Statistics Cards - Black and White with #dba627 accent */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Appointments</p>
                        <p className="text-2xl font-bold">{totalAppointments}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Completed</p>
                        <p className="text-2xl font-bold">{completedCount}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Pending</p>
                        <p className="text-2xl font-bold">{pendingCount}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Cancelled</p>
                        <p className="text-2xl font-bold">{cancelledCount}</p>
                    </div>
                    <div className="bg-[#dba627] rounded-xl p-4 text-black shadow-lg">
                        <p className="text-sm opacity-90">Revenue</p>
                        <p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Filters Section */}
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
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Statuses</option>
                            <option value="booked">Booked</option>
                            <option value="approved">Approved</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                        
                        <input
                            type="text"
                            placeholder="Search by name, phone or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                    </div>
                </div>

                {/* Appointment Details Modal */}
                {showDetailsModal && selectedAppointment && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>
                                    <p className="text-xs text-gray-500 mt-1">View complete appointment information</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedAppointment(null);
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
                                            Appointment ID
                                        </label>
                                        <p className="text-sm font-semibold text-gray-900">#{selectedAppointment.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Status
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedAppointment.status)}`}>
                                                {selectedAppointment.status?.toUpperCase()}
                                            </span>
                                            {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => openUpdateStatus(selectedAppointment)}
                                                    className="text-[#dba627] hover:text-black text-xs font-medium"
                                                >
                                                    Update Status
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Customer
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedAppointment.customer_name || `ID: ${selectedAppointment.customer}`}</p>
                                        {selectedAppointment.customer_phone && (
                                            <p className="text-xs text-gray-500">{selectedAppointment.customer_phone}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Branch
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedAppointment.branch_name || `ID: ${selectedAppointment.branch}`}</p>
                                        {selectedAppointment.branch_city && (
                                            <p className="text-xs text-gray-500">{selectedAppointment.branch_city}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Staff
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedAppointment.staff_name || `ID: ${selectedAppointment.staff}`}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Date & Time
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedAppointment.date} at {selectedAppointment.time}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Appointment Type
                                        </label>
                                        <p className="text-sm text-gray-900 capitalize">{selectedAppointment.appointment_type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Total Amount
                                        </label>
                                        <p className="text-lg font-bold text-[#dba627]">₹{selectedAppointment.total_amount}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                Notes
                                            </label>
                                            <button
                                                onClick={handleEditNotes}
                                                className="text-[#dba627] hover:text-black text-xs font-medium"
                                            >
                                                Edit Notes
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-700">{selectedAppointment.notes || 'No notes'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                            Services
                                        </label>
                                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                            {selectedAppointment.items?.map((item, index) => (
                                                <div key={index} className="p-3 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{item.service_name}</p>
                                                        <p className="text-xs text-gray-500">Duration: {item.duration} min</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-[#dba627]">₹{item.price}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                                            <span className="text-sm font-semibold text-gray-900">Total</span>
                                            <span className="text-lg font-bold text-[#dba627]">₹{selectedAppointment.total_amount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedAppointment(null);
                                    }}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Update Status Modal */}
                {showUpdateStatusModal && selectedAppointment && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Update Status</h2>
                                    <p className="text-xs text-gray-500 mt-1">Change appointment status</p>
                                </div>
                                <button
                                    onClick={() => setShowUpdateStatusModal(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleUpdateStatus}>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Status *
                                        </label>
                                        <select
                                            value={statusUpdateData.status}
                                            onChange={(e) => setStatusUpdateData({ status: e.target.value })}
                                            required
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                        >
                                            <option value="booked">Booked</option>
                                            <option value="approved">Approved</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowUpdateStatusModal(false)}
                                            className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? 'Updating...' : 'Update Status'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appointments Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No appointments found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAppointments.map((appointment, index) => {
                                    const branch = branches.find(b => b.id === appointment.branch);

                                    return (
                                        <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-900">#{appointment.id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{appointment.customer_name || `ID: ${appointment.customer}`}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500">{appointment.customer_phone || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{appointment.date}</div>
                                                <div className="text-xs text-gray-400">{appointment.time}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className="text-sm text-gray-700">{branch?.name || `ID: ${appointment.branch}`}</span>
                                                    {branch?.city && (
                                                        <div className="text-xs text-gray-400">{branch.city}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {appointment.items?.slice(0, 2).map((item, idx) => (
                                                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                            {item.service_name}
                                                        </span>
                                                    ))}
                                                    {appointment.items?.length > 2 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{appointment.items.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-[#dba627]">₹{appointment.total_amount}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                                                    {appointment.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => fetchAppointmentDetails(appointment.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                                        <>
                                                            <button
                                                                onClick={() => openUpdateStatus(appointment)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Update Status"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAppointment(appointment.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}