"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";
import axios from "axios";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function AdminPackages() {
    const router = useRouter();
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [branches, setBranches] = useState([]);
    const [allServices, setAllServices] = useState([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Admin-specific filters
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
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
        fetchAllPackages();
        fetchBranches();
        fetchAllServices();
    }, []);

    // Apply filters whenever filter criteria or packages change
    useEffect(() => {
        applyFilters();
        setCurrentPage(1); // Reset to first page when filters change
    }, [selectedBranchFilter, searchTerm, packages]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "superadmin") {
            router.push("/login");
        }
    };

    const applyFilters = () => {
        let filtered = [...packages];
        
        // Filter by branch
        if (selectedBranchFilter) {
            filtered = filtered.filter(pkg => pkg.branch === parseInt(selectedBranchFilter));
        }
        
        // Search by name
        if (searchTerm) {
            filtered = filtered.filter(pkg => 
                pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pkg.id.toString().includes(searchTerm)
            );
        }
        
        setFilteredPackages(filtered);
    };

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPackages.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const fetchAllPackages = async () => {
        setLoading(true);
        try {
            // Fetch packages from all branches
            const branchesData = await fetchAllBranchesForPackages();
            let allPackages = [];
            
            for (const branch of branchesData) {
                try {
                    const response = await axios.get(`${API_BASE}/service/packages/?branch=${branch.id}`);
                    const packagesData = response.data.data || response.data.packages || response.data.results || [];
                    allPackages = [...allPackages, ...packagesData];
                } catch (error) {
                    console.error(`Error fetching packages for branch ${branch.id}:`, error);
                }
            }
            
            setPackages(allPackages);
            setFilteredPackages(allPackages);
        } catch (error) {
            console.error('Error fetching all packages:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch packages',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllBranchesForPackages = async () => {
        try {
            const response = await axios.get(`${API_BASE}/branches/get-all-branches/`);
            return response.data.data || response.data.branches || response.data.results || [];
        } catch (error) {
            console.error('Error fetching branches:', error);
            return [];
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

    const fetchAllServices = async () => {
        try {
            const response = await axios.get(`${API_BASE}/service/services/`);
            const servicesData = response.data.data || response.data.services || response.data.results || [];
            setAllServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchPackageDetails = async (packageId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/service/package-detail/${packageId}/`);
            setSelectedPackage(response.data.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching package details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch package details',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePackage = async (packageId) => {
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
                const response = await axios.delete(`${API_BASE}/service/delete-package/${packageId}/`);
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Package has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchAllPackages();
                }
            } catch (error) {
                console.error('Error deleting package:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to delete package',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditPackage = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Edit Package',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Package Name" value="${selectedPackage.name || ''}">
                <textarea id="swal-description" class="swal2-textarea" placeholder="Description">${selectedPackage.description || ''}</textarea>
                <input id="swal-package-price" class="swal2-input" placeholder="Package Price" value="${selectedPackage.package_price || ''}">
                <input id="swal-validity-days" class="swal2-input" placeholder="Validity Days" value="${selectedPackage.validity_days || ''}">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Update',
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value,
                    description: document.getElementById('swal-description').value,
                    package_price: document.getElementById('swal-package-price').value,
                    validity_days: document.getElementById('swal-validity-days').value
                };
            }
        });

        if (formValues) {
            setLoading(true);
            try {
                const response = await axios.put(`${API_BASE}/service/update-package/${selectedPackage.id}/`, formValues);
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Package updated successfully',
                        confirmButtonColor: '#dba627'
                    });
                    fetchAllPackages();
                    if (selectedPackage.id) {
                        fetchPackageDetails(selectedPackage.id);
                    }
                }
            } catch (error) {
                console.error('Error updating package:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to update package',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const getServicesNames = (serviceIds) => {
        if (!serviceIds || !Array.isArray(serviceIds)) return [];
        return serviceIds.map(id => {
            const service = allServices.find(s => s.id === id);
            return service ? service.name : `Service #${id}`;
        });
    };

    const calculateTotalOriginalPrice = () => {
        if (!selectedPackage?.services) return 0;
        let total = 0;
        selectedPackage.services.forEach(serviceId => {
            const service = allServices.find(s => s.id === serviceId);
            if (service && service.price) {
                total += parseFloat(service.price);
            }
        });
        return total.toFixed(2);
    };

    const calculateSavings = () => {
        const originalTotal = parseFloat(calculateTotalOriginalPrice());
        const packagePrice = parseFloat(selectedPackage?.package_price || 0);
        const savings = originalTotal - packagePrice;
        return savings > 0 ? savings.toFixed(2) : '0.00';
    };

    const calculateSavingsPercentage = () => {
        const originalTotal = parseFloat(calculateTotalOriginalPrice());
        const packagePrice = parseFloat(selectedPackage?.package_price || 0);
        if (originalTotal === 0) return '0';
        const percentage = ((originalTotal - packagePrice) / originalTotal) * 100;
        return percentage > 0 ? percentage.toFixed(0) : '0';
    };

    // Statistics for admin dashboard
    const totalPackages = filteredPackages.length;
    const totalSavings = filteredPackages.reduce((sum, pkg) => {
        const originalTotal = pkg.original_price ? parseFloat(pkg.original_price) : 0;
        const packagePrice = parseFloat(pkg.package_price || 0);
        return sum + (originalTotal - packagePrice);
    }, 0);
    const avgDiscount = totalPackages > 0 ? (totalSavings / totalPackages).toFixed(2) : 0;
    const totalRevenue = filteredPackages.reduce((sum, pkg) => sum + parseFloat(pkg.package_price || 0), 0);
    const uniqueBranches = new Set(filteredPackages.map(p => p.branch)).size;

    const clearFilters = () => {
        setSelectedBranchFilter('');
        setSearchTerm('');
    };

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Admin <span className="text-[#dba627]">Packages</span>
                        </h1>
                        <p className="text-gray-500 mt-1">View and manage all service packages across all branches</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Packages</p>
                        <p className="text-2xl font-bold">{totalPackages}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Unique Branches</p>
                        <p className="text-2xl font-bold">{uniqueBranches}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Package Value</p>
                        <p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Customer Savings</p>
                        <p className="text-2xl font-bold text-green-400">₹{totalSavings.toFixed(2)}</p>
                    </div>
                    <div className="bg-[#dba627] rounded-xl p-4 text-black shadow-lg">
                        <p className="text-sm opacity-90">Average Discount</p>
                        <p className="text-2xl font-bold">₹{avgDiscount}</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                        
                        <input
                            type="text"
                            placeholder="Search by package name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                    </div>
                </div>

                {/* Package Details Modal */}
                {showDetailsModal && selectedPackage && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Package Details</h2>
                                    <p className="text-xs text-gray-500 mt-1">View complete package information</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedPackage(null);
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
                                            Package ID
                                        </label>
                                        <p className="text-sm font-semibold text-gray-900">#{selectedPackage.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Validity
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedPackage.validity_days} days</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Package Name
                                        </label>
                                        <p className="text-lg font-bold text-gray-900">{selectedPackage.name}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Description
                                        </label>
                                        <p className="text-sm text-gray-700">{selectedPackage.description || 'No description available'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Branch
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedPackage.branch_name || `ID: ${selectedPackage.branch}`}</p>
                                        {selectedPackage.branch_city && (
                                            <p className="text-xs text-gray-500">{selectedPackage.branch_city}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Original Price
                                        </label>
                                        <p className="text-sm text-gray-500 line-through">₹{selectedPackage.original_price || calculateTotalOriginalPrice()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Package Price
                                        </label>
                                        <p className="text-2xl font-bold text-[#dba627]">₹{selectedPackage.package_price}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            You Save
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-green-600">
                                                ₹{calculateSavings()} ({calculateSavingsPercentage()}% off)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Included Services ({selectedPackage.services?.length || 0})
                                        </label>
                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                            <div className="space-y-2">
                                                {selectedPackage.services && selectedPackage.services.length > 0 ? (
                                                    getServicesNames(selectedPackage.services).map((serviceName, index) => (
                                                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                                            <span className="w-1.5 h-1.5 bg-[#dba627] rounded-full"></span>
                                                            {serviceName}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500">No services in this package</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={handleEditPackage}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Edit Package
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedPackage(null);
                                    }}
                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Packages Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : filteredPackages.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No packages found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SL</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Package Name</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Original Price</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Package Price</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">You Save</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Validity</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.map((pkg, index) => {
                                        const originalPrice = parseFloat(pkg.original_price || 0);
                                        const packagePrice = parseFloat(pkg.package_price || 0);
                                        const savings = originalPrice - packagePrice;
                                        const savingsPercentage = originalPrice > 0 ? ((savings / originalPrice) * 100).toFixed(0) : 0;
                                        const branch = branches.find(b => b.id === pkg.branch);
                                        const serialNumber = indexOfFirstItem + index + 1;

                                        return (
                                            <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{serialNumber}</td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-900">{pkg.name}</span>
                                                        {pkg.description && (
                                                            <div className="text-xs text-gray-400 truncate max-w-xs">{pkg.description}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="text-sm text-gray-700">{branch?.name || pkg.branch_name || `ID: ${pkg.branch}`}</span>
                                                        {branch?.city && (
                                                            <div className="text-xs text-gray-400">{branch.city}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{pkg.services?.length || 0} services</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-500 line-through">₹{originalPrice.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-[#dba627]">₹{packagePrice.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {savings > 0 ? (
                                                        <div>
                                                            <span className="text-sm font-semibold text-green-600">₹{savings.toFixed(2)}</span>
                                                            <span className="text-xs text-green-500 ml-1">({savingsPercentage}% off)</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">No discount</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{pkg.validity_days} days</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => fetchPackageDetails(pkg.id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePackage(pkg.id)}
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
                                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredPackages.length)}</span> of{' '}
                                            <span className="font-medium">{filteredPackages.length}</span> results
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
                                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                                currentPage === pageNumber
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