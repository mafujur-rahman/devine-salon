"use client"
import DashboardLayout from '@/app/page';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
    const [statusUpdateData, setStatusUpdateData] = useState({ status: '' });
    const [customerType, setCustomerType] = useState('existing'); // 'existing' or 'new'
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        // For existing customer
        customer: '',
        // For new customer
        phone: '',
        first_name: '',
        last_name: '',
        email: '',
        whatsapp: '',
        address: '',
        gender: 'male',
        // Common fields
        branch: '',
        staff: '',
        date: '',
        time: '',
        appointment_type: 'walkin',
        notes: '',
        items: []
    });
    const [selectedServices, setSelectedServices] = useState([]);
    const [serviceInput, setServiceInput] = useState({ service: '' });

    const API_BASE_URL = 'https://saloon.mrshakil.com/api';
    const TOKEN = '73e4c3a1fbc67f4ebdae84b0d3a7e2b03539c514';

    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${TOKEN}`
        }
    });

    // Helper function to safely extract minutes from duration
    const getDurationMinutes = (duration) => {
        if (!duration) return 0;
        
        // If duration is already a number (minutes)
        if (typeof duration === 'number') return duration;
        
        // If duration is a string
        if (typeof duration === 'string') {
            // Check if it's in HH:MM:SS format
            if (duration.includes(':')) {
                const parts = duration.split(':');
                // If it has hours and minutes (HH:MM:SS or HH:MM)
                if (parts.length >= 2) {
                    return parseInt(parts[1]); // Get minutes part
                }
            }
            // Try to parse as integer
            const parsed = parseInt(duration);
            if (!isNaN(parsed)) return parsed;
        }
        
        return 0;
    };

    useEffect(() => {
        fetchAppointments();
        fetchServices();
        fetchStaff();
        fetchBranches();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/appointments/get-all-appointments/');
            const data = response.data;
            let appointmentsData = data.data || data.appointments || data.results || [];
            setAppointments(appointmentsData);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch appointments',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await axiosInstance.get('/service/services/');
            const data = response.data;
            setServices(data.data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await axiosInstance.get('/users/staff/');
            const data = response.data;
            setStaff(data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
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

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        let payload;
        if (customerType === 'existing') {
            payload = {
                customer: parseInt(formData.customer),
                branch: parseInt(formData.branch),
                staff: parseInt(formData.staff),
                date: formData.date,
                time: formData.time,
                appointment_type: formData.appointment_type,
                notes: formData.notes,
                items: selectedServices.map(item => ({ service: parseInt(item.service) }))
            };
        } else {
            payload = {
                branch: parseInt(formData.branch),
                staff: parseInt(formData.staff),
                date: formData.date,
                time: formData.time,
                appointment_type: formData.appointment_type,
                notes: formData.notes,
                phone: formData.phone,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                whatsapp: formData.whatsapp,
                address: formData.address,
                gender: formData.gender,
                items: selectedServices.map(item => ({ service: parseInt(item.service) }))
            };
        }

        try {
            const response = await axiosInstance.post('/appointment/create-appointment/', payload);
            const result = response.data;
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Appointment created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowCreateForm(false);
                resetForm();
                fetchAppointments();
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create appointment',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.put(`/appointment/${selectedAppointment.id}/update-status/`, statusUpdateData);
            const result = response.data;
            
            if (result.success) {
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
                text: error.response?.data?.error || 'Failed to update status',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAppointment = async (updateData) => {
        setLoading(true);
        try {
            const response = await axiosInstance.put(`/appointment/update-appointment/${selectedAppointment.id}/`, updateData);
            const result = response.data;
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Appointment updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                fetchAppointments();
                fetchAppointmentDetails(selectedAppointment.id);
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.error || 'Failed to update appointment',
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
                const response = await axiosInstance.delete(`/appointment/delete-appointment/${appointmentId}/`);
                const data = response.data;
                
                if (data.success) {
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
                    text: error.response?.data?.error || 'Failed to delete appointment',
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
            const response = await axiosInstance.get(`/appointment/${appointmentId}/`);
            const data = response.data;
            setSelectedAppointment(data.data);
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

    const addService = () => {
        if (serviceInput.service) {
            const service = services.find(s => s.id === parseInt(serviceInput.service));
            if (service) {
                setSelectedServices([...selectedServices, {
                    service: service.id,
                    service_name: service.name,
                    duration: getDurationMinutes(service.duration),
                    price: service.price
                }]);
                setServiceInput({ service: '' });
            }
        }
    };

    const removeService = (index) => {
        const newServices = [...selectedServices];
        newServices.splice(index, 1);
        setSelectedServices(newServices);
    };

    const resetForm = () => {
        setFormData({
            customer: '',
            phone: '',
            first_name: '',
            last_name: '',
            email: '',
            whatsapp: '',
            address: '',
            gender: 'male',
            branch: '',
            staff: '',
            date: '',
            time: '',
            appointment_type: 'walkin',
            notes: '',
            items: []
        });
        setSelectedServices([]);
        setCustomerType('existing');
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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
            confirmButtonText: 'Update',
            inputAttributes: {
                'aria-label': 'Type your notes here'
            }
        });
        
        if (notes !== undefined) {
            await handleUpdateAppointment({ notes });
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-white">
                <div className="px-4">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-black tracking-tight">
                                Appointment <span className="text-[#dba627]">Management</span>
                            </h1>
                            <p className="text-gray-500 mt-1">Manage all appointments</p>
                        </div>
                    </div>

                    {/* Create Appointment Button - Aligned with header */}
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
                            Create Appointment
                        </button>
                    </div>

                    {/* Create Appointment Form Modal - Matching Branch Form Design */}
                    {showCreateForm && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                {/* HEADER */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Create New Appointment
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Fill in the details to create a new appointment
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            resetForm();
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* BODY */}
                                <div className="overflow-y-auto px-6 py-5">
                                    <form onSubmit={handleCreateAppointment}>
                                        {/* Customer Type Selection */}
                                        <div className="mb-6">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Customer Type *
                                            </label>
                                            <div className="flex gap-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        value="existing"
                                                        checked={customerType === 'existing'}
                                                        onChange={() => setCustomerType('existing')}
                                                        className="w-4 h-4 text-[#dba627] focus:ring-[#dba627]"
                                                    />
                                                    <span className="text-sm text-gray-700">Existing Customer</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        value="new"
                                                        checked={customerType === 'new'}
                                                        onChange={() => setCustomerType('new')}
                                                        className="w-4 h-4 text-[#dba627] focus:ring-[#dba627]"
                                                    />
                                                    <span className="text-sm text-gray-700">New Customer</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Customer Information */}
                                            {customerType === 'existing' ? (
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Customer ID *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="customer"
                                                        value={formData.customer}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="Enter customer ID"
                                                    />
                                                </div>
                                            ) : (
                                                <>
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
                                                            placeholder="017XXXXXXXX"
                                                        />
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
                                                            placeholder="John"
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
                                                            placeholder="Doe"
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
                                                            placeholder="customer@example.com"
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
                                                            placeholder="017XXXXXXXX"
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
                                                            placeholder="Customer address"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* Appointment Details */}
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
                                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Staff *
                                                </label>
                                                <select
                                                    name="staff"
                                                    value={formData.staff}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                >
                                                    <option value="">Select Staff</option>
                                                    {staff.map(staffMember => (
                                                        <option key={staffMember.id} value={staffMember.id}>
                                                            {staffMember.first_name} {staffMember.last_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Time *
                                                </label>
                                                <input
                                                    type="time"
                                                    name="time"
                                                    value={formData.time}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Appointment Type *
                                                </label>
                                                <select
                                                    name="appointment_type"
                                                    value={formData.appointment_type}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                >
                                                    <option value="walkin">Walk-in</option>
                                                    <option value="online">Online</option>
                                                    <option value="phone">Phone</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Notes
                                                </label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    rows="2"
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="Additional notes..."
                                                />
                                            </div>

                                            {/* Services Selection */}
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Services *
                                                </label>
                                                <div className="flex gap-2 mb-3">
                                                    <select
                                                        value={serviceInput.service}
                                                        onChange={(e) => setServiceInput({ service: e.target.value })}
                                                        className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Service</option>
                                                        {services.map(service => (
                                                            <option key={service.id} value={service.id}>
                                                                {service.name} - ৳{service.price} ({getDurationMinutes(service.duration)} min)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={addService}
                                                        className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                {selectedServices.length > 0 && (
                                                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                                        {selectedServices.map((service, index) => (
                                                            <div key={index} className="p-3 flex justify-between items-center">
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-900">{service.service_name}</span>
                                                                    <span className="text-xs text-gray-500 ml-2">
                                                                        ৳{service.price} - {service.duration} min
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeService(index)}
                                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
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
                                                className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || selectedServices.length === 0}
                                                className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                            >
                                                {loading ? 'Creating...' : 'Create Appointment'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appointment Details Modal */}
                    {showDetailsModal && selectedAppointment && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                {/* HEADER */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Appointment Details
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            View complete appointment information
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setSelectedAppointment(null);
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* BODY */}
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
                                                Customer ID
                                            </label>
                                            <p className="text-sm text-gray-900">{selectedAppointment.customer}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                Branch ID
                                            </label>
                                            <p className="text-sm text-gray-900">{selectedAppointment.branch}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                Staff ID
                                            </label>
                                            <p className="text-sm text-gray-900">{selectedAppointment.staff}</p>
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
                                            <p className="text-lg font-bold text-[#dba627]">৳{selectedAppointment.total_amount}</p>
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
                                                        <p className="text-sm font-bold text-[#dba627]">৳{item.price}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                                                <span className="text-sm font-semibold text-gray-900">Total</span>
                                                <span className="text-lg font-bold text-[#dba627]">৳{selectedAppointment.total_amount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
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

                    {/* Update Status Modal - Matching Branch Form Design */}
                    {showUpdateStatusModal && selectedAppointment && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                {/* HEADER */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Update Status
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Change appointment status
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowUpdateStatusModal(false)}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* BODY */}
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

                                        {/* FOOTER */}
                                        <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setShowUpdateStatusModal(false)}
                                                className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer"
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
                    {loading && !showCreateForm ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No appointments found. Click Create Appointment to add one.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Appointment ID</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer ID</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {appointments.map((appointment, index) => {
                                        const branch = branches.find(b => b.id === appointment.branch);
                                        
                                        return (
                                            <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-gray-900">#{appointment.id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">ID: {appointment.customer}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{appointment.date}</div>
                                                    <div className="text-xs text-gray-400">{appointment.time}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{branch?.name || `ID: ${appointment.branch}`}</span>
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
                                                    <span className="text-sm font-semibold text-[#dba627]">৳{appointment.total_amount}</span>
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
            </div>
        </DashboardLayout>
    );
};

export default Appointments;