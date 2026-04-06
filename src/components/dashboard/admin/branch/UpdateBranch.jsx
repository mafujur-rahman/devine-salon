"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const UpdateBranch = ({ branch, onBranchUpdated }) => {
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        tax_rate: ''
    });

    const API_BASE_URL = 'https://saloon.mrshakil.com/api';

    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Token 73e4c3a1fbc67f4ebdae84b0d3a7e2b03539c514'
        }
    });

    // Update form data when branch prop changes or form opens
    useEffect(() => {
        if (branch && showUpdateForm) {
            setFormData({
                name: branch.name || '',
                phone: branch.phone || '',
                tax_rate: branch.tax_rate || ''
            });
        }
    }, [branch, showUpdateForm]);

    const handleInputChange = (e) => setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });

    const handleUpdateBranch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.put(`/branch/update-branch/${branch.id}/`, formData);
            const result = response.data;

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Branch updated successfully!',
                    background: '#fff',
                    confirmButtonColor: '#111111'
                });
                setShowUpdateForm(false);
                onBranchUpdated();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to update branch',
                    confirmButtonColor: '#111111'
                });
            }
        } catch (error) {
            console.error('Error updating branch:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update branch',
                confirmButtonColor: '#111111'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Update Button */}
            <button
                onClick={() => setShowUpdateForm(true)}
                className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                title="Edit Branch"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>

            {/* Update Form Modal */}
            {showUpdateForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden">

                        {/* HEADER */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Update Branch
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Modify branch information
                                </p>
                            </div>

                            <button
                                onClick={() => setShowUpdateForm(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="px-6 py-5">
                            <form onSubmit={handleUpdateBranch}>
                                <div className="space-y-5">

                                    {/* Branch Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Branch Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter branch name"
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none"
                                        />
                                    </div>

                                    {/* Phone */}
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
                                            placeholder="Enter phone number"
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none"
                                        />
                                    </div>

                                    {/* Tax Rate */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Tax Rate (%) *
                                        </label>
                                        <input
                                            type="number"
                                            name="tax_rate"
                                            value={formData.tax_rate}
                                            onChange={handleInputChange}
                                            required
                                            step="0.01"
                                            placeholder="Enter tax rate"
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* FOOTER */}
                                <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowUpdateForm(false)}
                                        className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? 'Updating...' : 'Update Branch'}
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

export default UpdateBranch;