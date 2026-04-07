"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "@/app/page";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function BookableStaffTable() {
    const [staff, setStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState("");

    // Fetch branches on component mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Token ${token}`;
        }
        fetchBranches();
    }, []);

    // Fetch staff when branch changes
    useEffect(() => {
        if (selectedBranchId) {
            fetchStaff();
        } else {
            setStaff([]);
        }
    }, [selectedBranchId]);

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const response = await axios.get(`${API_BASE}/branches/get-all-branches/`);
            const branchesData = response.data.data || [];
            setBranches(branchesData);
            // Auto-select first branch if available
            if (branchesData.length > 0) {
                setSelectedBranchId(branchesData[0].id.toString());
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
            setBranches([]);
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchStaff = async () => {
        if (!selectedBranchId) return;

        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/staff/bookable/?branch_id=${selectedBranchId}`);
            setStaff(response.data.data || []);
        } catch (error) {
            console.error("Error fetching staff:", error);
            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 bg-white rounded-lg shadow">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Bookable Staff</h2>
                    <p className="text-sm text-gray-500">View all available staff members</p>
                </div>

                {/* Branch Selection Dropdown */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Branch
                    </label>
                    {loadingBranches ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#dba627] rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-500">Loading branches...</span>
                        </div>
                    ) : (
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dba627] focus:border-transparent"
                        >
                            <option value="">Select a branch</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name} {branch.city && `- ${branch.city}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#dba627] rounded-full animate-spin"></div>
                        <p className="mt-2 text-gray-500">Loading staff...</p>
                    </div>
                )}

                {/* Staff Table */}
                {!loading && selectedBranchId && staff.length > 0 && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {staff.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                                {member.address && <div className="text-xs text-gray-500">{member.address}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.job_title_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.branch_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.branch_city || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#dba627]">{member.commission_percentage}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${member.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {member.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-sm text-gray-500">
                            Total: {staff.length} staff member(s)
                        </div>
                    </>
                )}

                {/* No Staff State */}
                {!loading && selectedBranchId && staff.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded">
                        <p className="text-gray-500">No bookable staff found for {branches.find(b => b.id.toString() === selectedBranchId)?.name}</p>
                    </div>
                )}

                {/* No Branch Selected */}
                {!loading && !selectedBranchId && (
                    <div className="text-center py-8 bg-gray-50 rounded">
                        <p className="text-gray-500">Please select a branch to view staff</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}