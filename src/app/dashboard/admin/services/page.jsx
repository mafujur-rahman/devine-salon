"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";
import axios from "axios";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function AdminServices() {
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    
    // Admin-specific filters
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
    const [selectedGenderFilter, setSelectedGenderFilter] = useState('');
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
        fetchServices();
        fetchBranches();
        fetchCategories();
    }, []);

    // Apply filters whenever filter criteria or services change
    useEffect(() => {
        applyFilters();
    }, [selectedBranchFilter, selectedCategoryFilter, selectedGenderFilter, searchTerm, services]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "superadmin") {
            router.push("/login");
        }
    };

    const applyFilters = () => {
        let filtered = [...services];
        
        // Filter by branch
        if (selectedBranchFilter) {
            filtered = filtered.filter(service => service.branch === parseInt(selectedBranchFilter));
        }
        
        // Filter by category
        if (selectedCategoryFilter) {
            filtered = filtered.filter(service => service.category === parseInt(selectedCategoryFilter));
        }
        
        // Filter by gender
        if (selectedGenderFilter) {
            filtered = filtered.filter(service => service.gender === selectedGenderFilter);
        }
        
        // Search by name
        if (searchTerm) {
            filtered = filtered.filter(service => 
                service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.id.toString().includes(searchTerm)
            );
        }
        
        setFilteredServices(filtered);
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/service/services/`;
            if (selectedBranchFilter) {
                url += `?branch=${selectedBranchFilter}`;
            }
            const response = await axios.get(url);
            const servicesData = response.data.data || response.data.services || response.data.results || [];
            setServices(servicesData);
            setFilteredServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch services',
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

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE}/service/categories/`);
            const categoriesData = response.data.data || response.data.categories || response.data.results || [];
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDeleteService = async (serviceId) => {
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
                const response = await axios.delete(`${API_BASE}/service/delete-service/${serviceId}/`);
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Service has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchServices();
                }
            } catch (error) {
                console.error('Error deleting service:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to delete service',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchServiceDetails = async (serviceId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/service/service/${serviceId}/`);
            setSelectedService(response.data.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching service details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch service details',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditService = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Edit Service',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Service Name" value="${selectedService.name || ''}">
                <input id="swal-price" class="swal2-input" placeholder="Price" value="${selectedService.price || ''}">
                <input id="swal-duration" class="swal2-input" placeholder="Duration (minutes)" value="${selectedService.duration || ''}">
                <select id="swal-gender" class="swal2-select">
                    <option value="male" ${selectedService.gender === 'male' ? 'selected' : ''}>Male</option>
                    <option value="female" ${selectedService.gender === 'female' ? 'selected' : ''}>Female</option>
                    <option value="unisex" ${selectedService.gender === 'unisex' ? 'selected' : ''}>Unisex</option>
                </select>
                <textarea id="swal-description" class="swal2-textarea" placeholder="Description">${selectedService.description || ''}</textarea>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Update',
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value,
                    price: document.getElementById('swal-price').value,
                    duration: document.getElementById('swal-duration').value,
                    gender: document.getElementById('swal-gender').value,
                    description: document.getElementById('swal-description').value
                };
            }
        });

        if (formValues) {
            setLoading(true);
            try {
                const response = await axios.put(`${API_BASE}/service/update-service/${selectedService.id}/`, formValues);
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Service updated successfully',
                        confirmButtonColor: '#dba627'
                    });
                    fetchServices();
                    fetchServiceDetails(selectedService.id);
                }
            } catch (error) {
                console.error('Error updating service:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to update service',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditCommission = async () => {
        const { value: commission } = await Swal.fire({
            title: 'Edit Commission',
            input: 'number',
            inputLabel: 'Commission Percentage',
            inputValue: selectedService.commission_percentage || 0,
            inputAttributes: {
                step: '0.01',
                min: '0',
                max: '100'
            },
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Update'
        });

        if (commission !== undefined) {
            setLoading(true);
            try {
                const response = await axios.put(`${API_BASE}/service/update-service/${selectedService.id}/`, {
                    commission_percentage: commission
                });
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Commission updated successfully',
                        confirmButtonColor: '#dba627'
                    });
                    fetchServices();
                    fetchServiceDetails(selectedService.id);
                }
            } catch (error) {
                console.error('Error updating commission:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to update commission',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const getGenderColor = (gender) => {
        const colors = {
            'male': 'bg-blue-100 text-blue-800',
            'female': 'bg-pink-100 text-pink-800',
            'unisex': 'bg-purple-100 text-purple-800'
        };
        return colors[gender] || 'bg-gray-100 text-gray-800';
    };

    // Statistics for admin dashboard
    const totalServices = filteredServices.length;
    const totalRevenue = filteredServices.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
    const uniqueBranches = new Set(filteredServices.map(s => s.branch)).size;
    const avgPrice = totalServices > 0 ? (totalRevenue / totalServices).toFixed(2) : 0;

    const clearFilters = () => {
        setSelectedBranchFilter('');
        setSelectedCategoryFilter('');
        setSelectedGenderFilter('');
        setSearchTerm('');
    };

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Admin <span className="text-[#dba627]">Services</span>
                        </h1>
                        <p className="text-gray-500 mt-1">View and manage all services across all branches</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Services</p>
                        <p className="text-2xl font-bold">{totalServices}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Unique Branches</p>
                        <p className="text-2xl font-bold">{uniqueBranches}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Average Price</p>
                        <p className="text-2xl font-bold">₹{avgPrice}</p>
                    </div>
                    <div className="bg-[#dba627] rounded-xl p-4 text-black shadow-lg">
                        <p className="text-sm opacity-90">Total Value</p>
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
                            value={selectedCategoryFilter}
                            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        
                        <select
                            value={selectedGenderFilter}
                            onChange={(e) => setSelectedGenderFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Genders</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="unisex">Unisex</option>
                        </select>
                        
                        <input
                            type="text"
                            placeholder="Search by service name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                    </div>
                </div>

                {/* Service Details Modal */}
                {showDetailsModal && selectedService && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Service Details</h2>
                                    <p className="text-xs text-gray-500 mt-1">View complete service information</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedService(null);
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
                                            Service ID
                                        </label>
                                        <p className="text-sm font-semibold text-gray-900">#{selectedService.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Gender
                                        </label>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGenderColor(selectedService.gender)}`}>
                                            {selectedService.gender?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Service Name
                                        </label>
                                        <p className="text-lg font-bold text-gray-900">{selectedService.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Branch
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedService.branch_name || `ID: ${selectedService.branch}`}</p>
                                        {selectedService.branch_city && (
                                            <p className="text-xs text-gray-500">{selectedService.branch_city}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Category
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedService.category_name || `ID: ${selectedService.category}`}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Price
                                        </label>
                                        <p className="text-2xl font-bold text-[#dba627]">₹{selectedService.price}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Duration
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedService.duration} minutes</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Commission
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-900">{selectedService.commission_percentage}%</p>
                                            <button
                                                onClick={handleEditCommission}
                                                className="text-[#dba627] hover:text-black text-xs font-medium"
                                            >
                                                Edit Commission
                                            </button>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Description
                                        </label>
                                        <p className="text-sm text-gray-700">{selectedService.description || 'No description available'}</p>
                                    </div>
                                    {selectedService.image && (
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                                Image
                                            </label>
                                            <img 
                                                src={selectedService.image} 
                                                alt={selectedService.name}
                                                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={handleEditService}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Edit Service
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedService(null);
                                    }}
                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Services Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No services found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Name</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredServices.map((service, index) => {
                                    const branch = branches.find(b => b.id === service.branch);
                                    const category = categories.find(c => c.id === service.category);

                                    return (
                                        <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-900">#{service.id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-900">{service.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className="text-sm text-gray-700">{branch?.name || `ID: ${service.branch}`}</span>
                                                    {branch?.city && (
                                                        <div className="text-xs text-gray-400">{branch.city}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{category?.name || `ID: ${service.category}`}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-[#dba627]">₹{service.price}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{service.duration} min</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGenderColor(service.gender)}`}>
                                                    {service.gender?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{service.commission_percentage}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* <button
                                                        onClick={() => fetchServiceDetails(service.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button> */}
                                                    <button
                                                        onClick={() => handleDeleteService(service.id)}
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
                )}
            </div>
        </DashboardLayout>
    );
}