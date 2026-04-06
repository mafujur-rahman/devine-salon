"use client"
import DashboardLayout from '@/app/page';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({
        phone: '',
        first_name: '',
        last_name: '',
        email: '',
        whatsapp: '',
        gender: 'male',
        address: ''
    });
    const API_BASE_URL = 'https://saloon.mrshakil.com/api';
    const TOKEN = '73e4c3a1fbc67f4ebdae84b0d3a7e2b03539c514';

    // Create axios instance with token
    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${TOKEN}`
        }
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/users/customers/');
            const data = response.data;
            let customersData = data.data || data.customers || data.results || [];
            setCustomers(customersData);
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
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/users/${customerId}/`);
            const data = response.data;
            setSelectedCustomer(data.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching customer details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch customer details',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.post('/user/create-customer/', formData);
            const result = response.data;

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Customer created successfully!',
                    background: '#fff',
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
                text: error.response?.data?.message || 'Failed to create customer',
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

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-white">
                <div className="px-4">
                    {/* Header with decorative gold accent */}
                    <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-black tracking-tight">
                                Customer <span className="text-[#dba627]">Management</span>
                            </h1>
                            <p className="text-gray-500 mt-1">Manage all customers</p>
                        </div>
                    </div>

                    {/* Add Customer Button - Aligned with header */}
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => {
                                setShowCreateForm(true);
                                resetForm();
                            }}
                            className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Customer
                        </button>
                    </div>

                    {/* Create Form Modal - Matching Branch Form Design */}
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
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
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
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="01712345678"
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
                                                    placeholder="01712345678"
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
                                        </div>

                                        {/* FOOTER */}
                                        <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateForm(false)}
                                                className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer"
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

                    {/* Customer Details Modal - Matching Branch Form Design */}
                    {showDetailsModal && selectedCustomer && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                {/* HEADER */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Customer Details
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            View complete customer information
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setSelectedCustomer(null);
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
                                                Full Name
                                            </label>
                                            <p className="text-sm font-semibold text-gray-900">
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
                                            <p className="text-sm text-gray-900">
                                                {selectedCustomer.email || 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                Role
                                            </label>
                                            <p className="text-sm text-gray-900 capitalize">
                                                {selectedCustomer.role}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                Address
                                            </label>
                                            <p className="text-sm text-gray-900">
                                                {selectedCustomer.address || 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                Appointments
                                            </label>
                                            <p className="text-sm font-semibold text-[#dba627]">
                                                {selectedCustomer.appointment_count || 0}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                                Associated Branches
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCustomer.branch_names && selectedCustomer.branch_names.length > 0 ? (
                                                    selectedCustomer.branch_names.map((branch, index) => (
                                                        <span key={index} className="px-3 py-1.5 bg-[#dba627] bg-opacity-10 text-[#dba627] rounded-lg text-xs font-medium">
                                                            {branch}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500">No branches associated</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setSelectedCustomer(null);
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
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Name</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Appointments</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branches</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {customers.map((customer, index) => (
                                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#dba627] flex items-center justify-center text-white text-sm font-semibold">
                                                        {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {customer.first_name} {customer.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-400 capitalize">
                                                            {customer.role || 'Customer'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span className="text-sm text-gray-700">{customer.phone}</span>
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
                                                    {customer.appointment_count || 0} appointments
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {customer.branch_names && customer.branch_names.length > 0 ? (
                                                        <>
                                                            {customer.branch_names.slice(0, 2).map((branch, idx) => (
                                                                <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                    {branch}
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
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
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
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Customers;