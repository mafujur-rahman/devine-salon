"use client"
import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const DeleteBranch = ({ branchId, onBranchDeleted }) => {
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = 'https://saloon.mrshakil.com/api';
    
    // Create axios instance with headers directly
    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Token 73e4c3a1fbc67f4ebdae84b0d3a7e2b03539c514'
        }
    });

    const handleDeleteBranch = async () => {
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
                // Make sure branchId is valid
                if (!branchId) {
                    throw new Error('Branch ID is missing');
                }
                
                const response = await axiosInstance.delete(`/branch/delete-branch/${branchId}/`);
                const data = response.data;

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Branch has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    onBranchDeleted();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Failed to delete',
                        confirmButtonColor: '#dba627'
                    });
                }
            } catch (error) {
                console.error('Error deleting branch:', error);
                
                // Log full error details
                if (error.response) {
                    console.log('Response status:', error.response.status);
                    console.log('Response headers:', error.response.headers);
                    console.log('Response data:', error.response.data);
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || error.response?.data?.error || 'Failed to delete branch',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <button
            onClick={handleDeleteBranch}
            disabled={loading}
            className=" text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
            title="Delete Branch"
        >
            {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            )}
        </button>
    );
};

export default DeleteBranch;