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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState('services');
    
    // Pagination states
    const [servicesCurrentPage, setServicesCurrentPage] = useState(1);
    const [categoriesCurrentPage, setCategoriesCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Category management state
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryFormData, setCategoryFormData] = useState({ 
        name: '',
        branch: '' 
    });
    
    // Form state for creating service
    const [createFormData, setCreateFormData] = useState({
        name: '',
        description: '',
        price: '',
        branch: '',
        category: '',
        duration: '',
        gender: 'unisex',
        commission_percentage: ''
    });

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
        setServicesCurrentPage(1); // Reset to first page when filters change
    }, [selectedBranchFilter, selectedCategoryFilter, selectedGenderFilter, searchTerm, services]);

    // Reset categories page when categories change
    useEffect(() => {
        setCategoriesCurrentPage(1);
    }, [categories]);

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

    // Pagination helper functions
    const getPaginatedData = (data, currentPage) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const getTotalPages = (totalItems) => {
        return Math.ceil(totalItems / itemsPerPage);
    };

    const handlePageChange = (page, type) => {
        if (type === 'services') {
            setServicesCurrentPage(page);
        } else if (type === 'categories') {
            setCategoriesCurrentPage(page);
        }
    };

    const renderPagination = (currentPage, totalItems, type) => {
        const totalPages = getTotalPages(totalItems);
        if (totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1, type)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        Previous
                    </button>
                    {pageNumbers.map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page, type)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                    ? 'bg-[#dba627] text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1, type)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
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

    // Category CRUD operations
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: categoryFormData.name,
                branch: parseInt(categoryFormData.branch)
            };
            const response = await axios.post(`${API_BASE}/service/create-category/`, payload);
            
            if (response.data?.success || response.status === 201) {
                await fetchCategories();
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Category created successfully!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowCategoryForm(false);
                setCategoryFormData({ name: '', branch: '' });
            }
        } catch (error) {
            console.error('Error creating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create category',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: categoryFormData.name,
                branch: parseInt(categoryFormData.branch)
            };
            const response = await axios.put(`${API_BASE}/service/update-category/${editingCategory.id}/`, payload);
            
            if (response.data?.success || response.status === 200) {
                setCategories(prevCategories =>
                    prevCategories.map(cat =>
                        cat.id === editingCategory.id
                            ? { ...cat, name: categoryFormData.name, branch: categoryFormData.branch }
                            : cat
                    )
                );
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Category updated successfully!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowCategoryForm(false);
                setEditingCategory(null);
                setCategoryFormData({ name: '', branch: '' });
            }
        } catch (error) {
            console.error('Error updating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update category',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
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
                await axios.delete(`${API_BASE}/service/delete-category/${categoryId}/`);
                
                setCategories(prevCategories => {
                    return prevCategories.filter(category => category.id !== categoryId);
                });
                
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Category has been deleted successfully.',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error deleting category:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to delete category',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const openEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryFormData({ 
            name: category.name,
            branch: category.branch || ''
        });
        setShowCategoryForm(true);
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.id === parseInt(branchId));
        return branch ? branch.name : `Branch ID: ${branchId}`;
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: createFormData.name,
            description: createFormData.description,
            price: parseFloat(createFormData.price).toFixed(2),
            branch: parseInt(createFormData.branch),
            category: parseInt(createFormData.category),
            duration: parseInt(createFormData.duration),
            gender: createFormData.gender,
            commission_percentage: parseFloat(createFormData.commission_percentage).toFixed(2) || "0.00"
        };

        try {
            const response = await axios.post(`${API_BASE}/service/create-service/`, payload);
            
            if (response.data.success || response.status === 201) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Service created successfully!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowCreateModal(false);
                resetCreateForm();
                fetchServices();
            }
        } catch (error) {
            console.error('Error creating service:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create service',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetCreateForm = () => {
        setCreateFormData({
            name: '',
            description: '',
            price: '',
            branch: '',
            category: '',
            duration: '',
            gender: 'unisex',
            commission_percentage: ''
        });
    };

    const handleCreateInputChange = (e) => {
        setCreateFormData({
            ...createFormData,
            [e.target.name]: e.target.value
        });
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
                
                if (response.data.success || response.status === 204) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Service has been deleted.',
                        confirmButtonColor: '#dba627',
                        timer: 1500,
                        showConfirmButton: false
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
                        confirmButtonColor: '#dba627',
                        timer: 1500,
                        showConfirmButton: false
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
                        confirmButtonColor: '#dba627',
                        timer: 1500,
                        showConfirmButton: false
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

    // Get paginated data
    const paginatedServices = getPaginatedData(filteredServices, servicesCurrentPage);
    const paginatedCategories = getPaginatedData(categories, categoriesCurrentPage);

    return (
        <DashboardLayout>
            <div className="px-3">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Admin <span className="text-[#dba627]">Services & Categories</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Manage services and categories across all branches</p>
                    </div>
                </div>

                {/* Tabs and Add Buttons Row */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'services'
                                    ? 'text-[#dba627] border-b-2 border-[#dba627]'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Services
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'categories'
                                    ? 'text-[#dba627] border-b-2 border-[#dba627]'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Categories
                        </button>
                    </div>

                    {activeTab === 'categories' && (
                        <button
                            onClick={() => {
                                setEditingCategory(null);
                                setCategoryFormData({ name: '', branch: '' });
                                setShowCategoryForm(true);
                            }}
                            className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Category
                        </button>
                    )}

                    {activeTab === 'services' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Service
                        </button>
                    )}
                </div>

                {/* Categories Section */}
                {activeTab === 'categories' && (
                    <>
                        {/* Category Form Modal */}
                        {showCategoryForm && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                                <div className="w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                                            </h2>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {editingCategory ? 'Update category details' : 'Fill in the details to create a new category'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowCategoryForm(false);
                                                setEditingCategory(null);
                                                setCategoryFormData({ name: '', branch: '' });
                                            }}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto px-6 py-5">
                                        <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                                            <div className="space-y-5">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Category Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={categoryFormData.name}
                                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] focus:border-transparent"
                                                        placeholder="e.g., Hair Styling, Spa Therapy, Nail Art"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Branch *
                                                    </label>
                                                    <select
                                                        name="branch"
                                                        value={categoryFormData.branch}
                                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, branch: e.target.value })}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Branch</option>
                                                        {branches.map((branch) => (
                                                            <option key={branch.id} value={branch.id}>
                                                                {branch.name} - {branch.city}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Select which branch this category belongs to
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCategoryForm(false);
                                                        setEditingCategory(null);
                                                        setCategoryFormData({ name: '', branch: '' });
                                                    }}
                                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                                >
                                                    {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Categories Table */}
                        {loading && !showCategoryForm ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500">No categories found. Click Add Category to create one.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Name</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedCategories.map((category, index) => (
                                                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                        {(categoriesCurrentPage - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-gray-900">{category.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-700">{getBranchName(category.branch)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">#{category.id}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditCategory(category)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCategory(category.id)}
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
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {renderPagination(categoriesCurrentPage, categories.length, 'categories')}
                            </>
                        )}
                    </>
                )}

                {/* Services Section */}
                {activeTab === 'services' && (
                    <>
                        {/* Create Service Modal */}
                        {showCreateModal && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                                <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">Create New Service</h2>
                                            <p className="text-xs text-gray-500 mt-1">Fill in the details to create a new service</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                resetCreateForm();
                                            }}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto px-6 py-5">
                                        <form onSubmit={handleCreateService}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Service Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={createFormData.name}
                                                        onChange={handleCreateInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="e.g., Hair Cutting, Facial Treatment, Manicure"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        value={createFormData.description}
                                                        onChange={handleCreateInputChange}
                                                        rows="3"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="Describe the service..."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Branch *
                                                    </label>
                                                    <select
                                                        name="branch"
                                                        value={createFormData.branch}
                                                        onChange={handleCreateInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Branch</option>
                                                        {branches.map((branch) => (
                                                            <option key={branch.id} value={branch.id}>
                                                                {branch.name} - {branch.city}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Category *
                                                    </label>
                                                    <select
                                                        name="category"
                                                        value={createFormData.category}
                                                        onChange={handleCreateInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories
                                                            .filter(category => !createFormData.branch || category.branch === parseInt(createFormData.branch))
                                                            .map((category) => (
                                                                <option key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    {createFormData.branch && categories.filter(c => c.branch === parseInt(createFormData.branch)).length === 0 && (
                                                        <p className="text-xs text-amber-600 mt-1">
                                                            No categories available for this branch. Please create a category first.
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Price (₹) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="price"
                                                        value={createFormData.price}
                                                        onChange={handleCreateInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="e.g., 500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Duration (minutes) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="duration"
                                                        value={createFormData.duration}
                                                        onChange={handleCreateInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="e.g., 45"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Gender *
                                                    </label>
                                                    <select
                                                        name="gender"
                                                        value={createFormData.gender}
                                                        onChange={handleCreateInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="unisex">Unisex</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Commission Percentage
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="commission_percentage"
                                                        value={createFormData.commission_percentage}
                                                        onChange={handleCreateInputChange}
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="e.g., 15"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCreateModal(false);
                                                        resetCreateForm();
                                                    }}
                                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                                >
                                                    {loading ? 'Creating...' : 'Create Service'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                    {categories
                                        .filter(category => !selectedBranchFilter || category.branch === parseInt(selectedBranchFilter))
                                        .map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name} {category.branch_name ? `(${category.branch_name})` : ''}
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
                            <>
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
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
                                            {paginatedServices.map((service, index) => {
                                                const branch = branches.find(b => b.id === service.branch);
                                                const category = categories.find(c => c.id === service.category);

                                                return (
                                                    <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                            {(servicesCurrentPage - 1) * itemsPerPage + index + 1}
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
                                                                <button
                                                                    onClick={() => fetchServiceDetails(service.id)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </button>
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
                                {renderPagination(servicesCurrentPage, filteredServices.length, 'services')}
                            </>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}