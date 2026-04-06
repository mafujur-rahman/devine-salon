"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const CreateBranch = ({ onBranchCreated }) => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [managers, setManagers] = useState([]);
    const [loadingManagers, setLoadingManagers] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        opening_time: '',
        closing_time: '',
        gst_number: '',
        tax_rate: '',
        manager: ''
    });

    const API_BASE_URL = 'https://saloon.mrshakil.com/api';

    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Token 73e4c3a1fbc67f4ebdae84b0d3a7e2b03539c514'
        }
    });

    // Fetch staff members who have manager job titles
    useEffect(() => {
        if (showCreateForm) {
            fetchManagers();
        }
    }, [showCreateForm]);

    const fetchManagers = async () => {
        setLoadingManagers(true);

        try {
            // Get all job titles
            const jobTitlesResponse = await axiosInstance.get('/staff/get-all-job-titles/');
            const jobTitlesResult = jobTitlesResponse.data;

            if (!jobTitlesResult.success) throw new Error('Failed to fetch job titles');

            // Only get job titles that can create manager accounts
            const managerJobTitles = jobTitlesResult.data.filter(job => job.creates_manager_account);

            console.log('Manager Job Titles:', managerJobTitles);

            setManagers(managerJobTitles);
        } catch (err) {
            console.error('Error fetching manager job titles:', err);
            setManagers([]);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load manager options',
                confirmButtonColor: '#111111'
            });
        } finally {
            setLoadingManagers(false);
        }
    };

    const handleInputChange = (e) => setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });

    const resetForm = () => setFormData({
        name: '', address: '', city: '', phone: '', email: '',
        opening_time: '', closing_time: '', gst_number: '', tax_rate: '', manager: ''
    });

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                opening_time: formData.opening_time,
                closing_time: formData.closing_time,
                gst_number: formData.gst_number.trim(),
                tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : null,
                manager: formData.manager.id  
            };

            console.log('Sending payload:', payload);

            const response = await axiosInstance.post('/branch/branch-create/', payload);
            const result = response.data;

            console.log('Response:', result);

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Branch created successfully!',
                    background: '#fff',
                    confirmButtonColor: '#111111'
                });
                setShowCreateForm(false);
                resetForm();
                onBranchCreated();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to create branch',
                    confirmButtonColor: '#111111'
                });
            }
        } catch (error) {
            console.error('Error creating branch:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || error.response?.data?.error || 'Failed to create branch',
                confirmButtonColor: '#111111'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Create Button */}
            <button
                onClick={() => setShowCreateForm(true)}
                className="bg-black text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Branch
            </button>

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">

                        {/* HEADER */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Add New Branch
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Fill in the details to create a new branch
                                </p>
                            </div>

                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                            >
                                ✕
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="overflow-y-auto px-6 py-5">
                            <form onSubmit={handleCreateBranch}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                    {['name', 'city', 'address', 'phone', 'email', 'opening_time', 'closing_time', 'gst_number', 'tax_rate'].map((field) => (
                                        <div key={field} className={field === 'address' ? 'md:col-span-2' : ''}>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                {field.replace('_', ' ')}
                                                {!['address', 'gst_number', 'tax_rate'].includes(field) && ' *'}
                                            </label>

                                            <input
                                                type={
                                                    field === 'email'
                                                        ? 'email'
                                                        : field === 'tax_rate'
                                                            ? 'number'
                                                            : field.includes('time')
                                                                ? 'time'
                                                                : 'text'
                                                }
                                                name={field}
                                                value={formData[field]}
                                                onChange={handleInputChange}
                                                required={!['address', 'gst_number', 'tax_rate'].includes(field)}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black"
                                                step={field === 'tax_rate' ? '0.01' : undefined}
                                            />
                                        </div>
                                    ))}

                                    {/* Manager Select - Shows actual staff members with manager job titles */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Branch Manager *
                                        </label>

                                        <select
                                            name="manager"
                                            value={formData.manager}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loadingManagers}
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:border-black focus:ring-1 focus:ring-black"
                                        >
                                            <option value="">Select Branch Manager</option>
                                            {managers.map(manager => (
                                                <option key={manager.id} value={manager.id}>
                                                    {manager.name}
                                                </option>
                                            ))}
                                        </select>

                                        {loadingManagers && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Loading managers...
                                            </p>
                                        )}

                                        {!loadingManagers && managers.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-2">
                                                No managers found. Please create a staff member with a manager job title first.
                                            </p>
                                        )}
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
                                        className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer hover:bg-gray-800"
                                    >
                                        {loading ? 'Creating...' : 'Create Branch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreateBranch;