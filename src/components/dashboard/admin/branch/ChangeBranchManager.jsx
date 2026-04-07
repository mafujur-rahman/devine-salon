"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { HiOutlineUserGroup } from 'react-icons/hi';

const ChangeBranchManager = ({ branch, onManagerChanged }) => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [jobTitles, setJobTitles] = useState([]);
    const [formData, setFormData] = useState({
        staff_id: '',
        assign_new_job_title_id: ''
    });

    const API_BASE_URL = 'https://saloon.mrshakil.com/api';

    const getAuthToken = () => {
        return localStorage.getItem("token");
    };

    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        }
    });

    // Add token to requests
    axiosInstance.interceptors.request.use((config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    });

    useEffect(() => {
        if (showModal) {
            fetchStaff();
            fetchJobTitles();
        }
    }, [showModal]);

    const fetchStaff = async () => {
        setLoadingStaff(true);
        try {
            const response = await axiosInstance.get(`/staff/get-all-staff/?branch=${branch.id}`);
            const staffData = response.data.data || response.data.staff || response.data.results || [];
            setStaffList(staffData);
        } catch (error) {
            console.error('Error fetching staff:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch staff members',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoadingStaff(false);
        }
    };

    const fetchJobTitles = async () => {
        try {
            const response = await axiosInstance.get('/staff/get-all-job-titles/');
            const jobTitlesData = response.data.data || response.data.job_titles || response.data.results || [];
            setJobTitles(jobTitlesData);
        } catch (error) {
            console.error('Error fetching job titles:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                branch_id: branch.id,
                staff_id: parseInt(formData.staff_id),
                assign_new_job_title_id: parseInt(formData.assign_new_job_title_id)
            };

            console.log('Changing branch manager with payload:', payload);

            const response = await axiosInstance.post('/staff/change-branch-manager/', payload);
            const result = response.data;

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: result.message || 'Branch manager changed successfully',
                    confirmButtonColor: '#dba627'
                });
                setShowModal(false);
                resetForm();
                if (onManagerChanged) onManagerChanged();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to change branch manager',
                    confirmButtonColor: '#dba627'
                });
            }
        } catch (error) {
            console.error('Error changing branch manager:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || error.response?.data?.error || 'Failed to change branch manager',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            staff_id: '',
            assign_new_job_title_id: ''
        });
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Change Branch Manager"
            >
                <HiOutlineUserGroup size={18} />
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Change Branch Manager
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    For branch: {branch.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto px-6 py-5">
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Select Staff Member *
                                        </label>
                                        <select
                                            name="staff_id"
                                            value={formData.staff_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loadingStaff}
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                        >
                                            <option value="">Select Staff Member</option>
                                            {staffList.map(staff => (
                                                <option key={staff.id} value={staff.id}>
                                                    {staff.name} - {staff.job_title_name || `ID: ${staff.job_title}`}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingStaff && (
                                            <p className="text-xs text-gray-500 mt-2">Loading staff members...</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            New Job Title *
                                        </label>
                                        <select
                                            name="assign_new_job_title_id"
                                            value={formData.assign_new_job_title_id}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                        >
                                            <option value="">Select Job Title</option>
                                            {jobTitles.map(job => (
                                                <option key={job.id} value={job.id}>
                                                    {job.name} {job.creates_manager_account && '(Manager Role)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer hover:bg-gray-800"
                                    >
                                        {loading ? 'Changing...' : 'Change Manager'}
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

export default ChangeBranchManager;