"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    HiOutlineLocationMarker,
    HiOutlinePhone,
    HiOutlineMail,
    HiOutlineClock,
    HiOutlineOfficeBuilding,
    HiOutlineStatusOnline,
    HiOutlineStatusOffline
} from 'react-icons/hi';
import UpdateBranch from './UpdateBranch';
import DeleteBranch from './DeleteBranch';
import ChangeBranchManager from './ChangeBranchManager';

const DisplayBranches = ({ refreshTrigger }) => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [togglingBranchId, setTogglingBranchId] = useState(null);
    const [togglingActiveId, setTogglingActiveId] = useState(null);

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
        fetchBranches();
    }, [refreshTrigger]);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/branches/get-all-branches/');
            const data = response.data;
            let branchesData = Array.isArray(data) ? data : data.data || data.branches || data.results || [];
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching branches:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch branches',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleOpenStatus = async (branchId, currentStatus) => {
        setTogglingBranchId(branchId);
        try {
            const response = await axiosInstance.post(`/branch/${branchId}/toggle-open/`);
            if (response.data.success) {
                setBranches(prevBranches =>
                    prevBranches.map(branch =>
                        branch.id === branchId
                            ? { ...branch, currently_open: response.data.data.currently_open }
                            : branch
                    )
                );
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `Branch is now ${response.data.data.currently_open ? 'OPEN' : 'CLOSED'}`,
                    confirmButtonColor: '#dba627',
                    toast: true,
                    position: 'top-end',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            fetchBranches();
        } finally {
            setTogglingBranchId(null);
        }
    };

    const toggleActiveStatus = async (branchId, currentStatus) => {
        setTogglingActiveId(branchId);
        try {
            const response = await axiosInstance.post(`/branch/${branchId}/toggle-active/`);
            if (response.data.success) {
                setBranches(prevBranches =>
                    prevBranches.map(branch =>
                        branch.id === branchId
                            ? { ...branch, active: response.data.data.active }
                            : branch
                    )
                );
            }
        } catch (error) {
            fetchBranches();
        } finally {
            setTogglingActiveId(null);
        }
    };

    // Helper function to convert time to 12-hour format with AM/PM
    const formatTimeWithAMPM = (timeString) => {
        if (!timeString) return null;
        
        // Handle different time formats (HH:MM:SS or HH:MM)
        let hours, minutes;
        if (timeString.includes(':')) {
            const parts = timeString.split(':');
            hours = parseInt(parts[0], 10);
            minutes = parts[1];
        } else {
            return timeString;
        }
        
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-2 border-[#dba627] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (branches.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <HiOutlineOfficeBuilding className="mx-auto text-5xl text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No branches found</p>
                <p className="text-sm text-gray-400 mt-1">Ready to expand? Create your first branch.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ">
            {branches.map((branch) => (
                <div
                    key={branch.id}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between"
                >
                    {/* TOP CONTENT */}
                    <div>
                        {/* HEADER */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
                                    Branch Unit
                                </p>
                                <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                                    {branch.name}
                                </h3>
                                <p className="text-[11px] text-gray-400 font-mono mt-1">
                                    ID #{branch.id}
                                </p>
                            </div>

                            {/* TOGGLE */}
                            <div className="flex flex-col items-end gap-1">
                                <button
                                    onClick={() => toggleOpenStatus(branch.id, branch.currently_open)}
                                    disabled={togglingBranchId === branch.id}
                                    className={`
                                relative w-14 h-7 rounded-full border
                                ${branch.currently_open ? 'border-green-500 bg-green-500/90' : 'border-gray-300 bg-gray-200'}
                                ${togglingBranchId === branch.id ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                                >
                                    <div
                                        className={`
                                    absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center
                                    ${branch.currently_open ? 'translate-x-7' : ''}
                                `}
                                    >
                                        {togglingBranchId === branch.id && (
                                            <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                        )}
                                    </div>
                                </button>

                                <span
                                    className={`text-[10px] font-semibold tracking-wide ${branch.currently_open ? 'text-green-600' : 'text-gray-400'
                                        }`}
                                >
                                    {branch.currently_open ? 'Open Now' : 'Closed'}
                                </span>
                            </div>
                        </div>

                        {/* DETAILS */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                                    <HiOutlineLocationMarker size={18} />
                                </div>
                                <span className="text-sm text-gray-700 font-medium truncate">
                                    {branch.city || 'Location Unset'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                                    <HiOutlinePhone size={18} />
                                </div>
                                <span className="text-sm text-gray-700 font-medium">
                                    {branch.phone || 'No Contact'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
                                    <HiOutlineClock size={18} />
                                </div>
                                <span className="text-sm text-gray-600 italic">
                                    {branch.opening_time && branch.closing_time
                                        ? `${formatTimeWithAMPM(branch.opening_time)} — ${formatTimeWithAMPM(branch.closing_time)}`
                                        : 'Hours not set'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <button
                            onClick={() => toggleActiveStatus(branch.id, branch.active)}
                            disabled={togglingActiveId === branch.id}
                            className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide border
                        ${branch.active
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-gray-300 text-gray-400 bg-gray-100'
                                }
                    `}
                        >
                            {branch.active ? (
                                <HiOutlineStatusOnline size={14} />
                            ) : (
                                <HiOutlineStatusOffline size={14} />
                            )}
                            {togglingActiveId === branch.id
                                ? 'Updating...'
                                : branch.active
                                    ? 'Active'
                                    : 'Inactive'}
                        </button>

                        <div className="flex items-center gap-2">
                            <ChangeBranchManager 
                                branch={branch} 
                                onManagerChanged={fetchBranches} 
                            />
                            <UpdateBranch branch={branch} onBranchUpdated={fetchBranches} />
                            <DeleteBranch branchId={branch.id} onBranchDeleted={fetchBranches} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DisplayBranches;