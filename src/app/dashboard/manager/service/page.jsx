"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";

const API_BASE = "https://saloon.mrshakil.com/api";

// Helper for authenticated requests
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
    }

    return response.json();
}

export default function Services() {
    const router = useRouter();

    // State for categories
    const [categories, setCategories] = useState([]);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryFormData, setCategoryFormData] = useState({ name: '' });

    // State for services
    const [services, setServices] = useState([]);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceFormData, setServiceFormData] = useState({
        name: '',
        category: '',
        price: '',
        duration: '',
        gender: 'unisex',
        commission_percentage: ''
    });

    // State for branches
    const [branches, setBranches] = useState([]);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('services');

    useEffect(() => {
        checkAuth();
        fetchCategories();
        fetchServices();
        fetchBranches();
    }, []);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token) {
            router.push("/login");
        }

        if (role !== "manager") {
            router.push("/login");
        }
    };

    const fetchBranches = async () => {
        try {
            const data = await apiFetch('/branches/get-all-branches/');
            let branchesData = data.data || data.branches || data.results || [];
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    // Category CRUD operations
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/service/categories/');
            let categoriesData = data.data || data.categories || data.results || [];
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error fetching categories:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch categories',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await apiFetch('/service/create-category/', {
                method: 'POST',
                body: JSON.stringify(categoryFormData)
            });

            if (result.success) {
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
                setCategoryFormData({ name: '' });
            }
        } catch (error) {
            console.error('Error creating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create category',
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
            const result = await apiFetch(`/service/update-category/${editingCategory.id}/`, {
                method: 'PUT',
                body: JSON.stringify(categoryFormData)
            });

            if (result.success) {
                setCategories(prevCategories =>
                    prevCategories.map(cat =>
                        cat.id === editingCategory.id
                            ? { ...cat, name: categoryFormData.name }
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
                setCategoryFormData({ name: '' });
            }
        } catch (error) {
            console.error('Error updating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update category',
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
                await apiFetch(`/service/delete-category/${categoryId}/`, {
                    method: 'DELETE'
                });

                setCategories(prevCategories => {
                    return prevCategories.filter(category => category.id !== categoryId);
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Category has been deleted.',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error deleting category:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to delete category',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    // Service CRUD operations
    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/service/services/');
            let servicesData = data.data || data.services || data.results || [];
            setServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch services',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: serviceFormData.name,
            category: parseInt(serviceFormData.category),
            price: parseFloat(serviceFormData.price),
            duration: parseInt(serviceFormData.duration),
            gender: serviceFormData.gender,
            commission_percentage: parseFloat(serviceFormData.commission_percentage) || 0
        };

        try {
            const result = await apiFetch('/service/create-service/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (result.success) {
                await fetchServices();
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Service created successfully!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowServiceForm(false);
                resetServiceForm();
            }
        } catch (error) {
            console.error('Error creating service:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create service',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateService = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: serviceFormData.name,
            category: parseInt(serviceFormData.category),
            price: parseFloat(serviceFormData.price),
            duration: parseInt(serviceFormData.duration),
            gender: serviceFormData.gender,
            commission_percentage: parseFloat(serviceFormData.commission_percentage) || 0
        };

        try {
            const result = await apiFetch(`/service/update-service/${editingService.id}/`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (result.success) {
                setServices(prevServices =>
                    prevServices.map(service =>
                        service.id === editingService.id
                            ? { ...service, ...payload }
                            : service
                    )
                );

                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Service updated successfully!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowServiceForm(false);
                setEditingService(null);
                resetServiceForm();
            }
        } catch (error) {
            console.error('Error updating service:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update service',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
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
                await apiFetch(`/service/delete-service/${serviceId}/`, {
                    method: 'DELETE'
                });

                setServices(prevServices => {
                    return prevServices.filter(service => service.id !== serviceId);
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Service has been deleted.',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error deleting service:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to delete service',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const resetServiceForm = () => {
        setServiceFormData({
            name: '',
            category: '',
            price: '',
            duration: '',
            gender: 'unisex',
            commission_percentage: ''
        });
    };

    const handleServiceInputChange = (e) => {
        setServiceFormData({
            ...serviceFormData,
            [e.target.name]: e.target.value
        });
    };

    const openEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryFormData({ name: category.name });
        setShowCategoryForm(true);
    };

    const openEditService = (service) => {
        setEditingService(service);
        setServiceFormData({
            name: service.name,
            category: service.category,
            price: service.price,
            duration: service.duration,
            gender: service.gender,
            commission_percentage: service.commission_percentage || ''
        });
        setShowServiceForm(true);
    };

    const getGenderBadgeColor = (gender) => {
        const colors = {
            'male': 'bg-blue-100 text-blue-800',
            'female': 'bg-pink-100 text-pink-800',
            'unisex': 'bg-purple-100 text-purple-800'
        };
        return colors[gender] || 'bg-gray-100 text-gray-800';
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.id === parseInt(branchId));
        return branch ? branch.name : `Branch ID: ${branchId}`;
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === parseInt(categoryId));
        return category ? category.name : `Category ID: ${categoryId}`;
    };

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Service <span className="text-[#dba627]">Management</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Manage services and categories</p>
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
                                setCategoryFormData({ name: '' });
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
                            onClick={() => {
                                setEditingService(null);
                                resetServiceForm();
                                setShowServiceForm(true);
                            }}
                            className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Service
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
                                                setCategoryFormData({ name: '' });
                                            }}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto px-6 py-5">
                                        <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Category Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={categoryFormData.name}
                                                    onChange={(e) => setCategoryFormData({ name: e.target.value })}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] focus:border-transparent"
                                                    placeholder="e.g., Hair, Spa, Nail"
                                                />
                                            </div>

                                            <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCategoryForm(false);
                                                        setEditingCategory(null);
                                                        setCategoryFormData({ name: '' });
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
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Name</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {categories.map((category, index) => (
                                            <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-gray-900">{category.name}</span>
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
                        )}
                    </>
                )}

                {/* Services Section */}
                {activeTab === 'services' && (
                    <>
                        {/* Service Form Modal */}
                        {showServiceForm && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                                <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {editingService ? 'Edit Service' : 'Add New Service'}
                                            </h2>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {editingService ? 'Update service details' : 'Fill in the details to create a new service'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowServiceForm(false);
                                                setEditingService(null);
                                                resetServiceForm();
                                            }}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto px-6 py-5">
                                        <form onSubmit={editingService ? handleUpdateService : handleCreateService}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Service Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={serviceFormData.name}
                                                        onChange={handleServiceInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="e.g., Hair Cut"
                                                    />
                                                </div>

                                                

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Category *
                                                    </label>
                                                    <select
                                                        name="category"
                                                        value={serviceFormData.category}
                                                        onChange={handleServiceInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map((category) => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Price (BDT) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="price"
                                                        value={serviceFormData.price}
                                                        onChange={handleServiceInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="300"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Duration (minutes) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="duration"
                                                        value={serviceFormData.duration}
                                                        onChange={handleServiceInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="30"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Gender *
                                                    </label>
                                                    <select
                                                        name="gender"
                                                        value={serviceFormData.gender}
                                                        onChange={handleServiceInputChange}
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
                                                        value={serviceFormData.commission_percentage}
                                                        onChange={handleServiceInputChange}
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="20"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowServiceForm(false);
                                                        setEditingService(null);
                                                        resetServiceForm();
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
                                                    {loading ? 'Saving...' : (editingService ? 'Update' : 'Create')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Services Table */}
                        {loading && !showServiceForm ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                            </div>
                        ) : services.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500">No services found. Click Add Service to create one.</p>
                            </div>
                        ) : (
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
                                        {services.map((service, index) => (
                                            <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-gray-900">{service.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{getBranchName(service.branch)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{getCategoryName(service.category)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-[#dba627]">৳{service.price}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{service.duration} min</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getGenderBadgeColor(service.gender)}`}>
                                                        {service.gender}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">
                                                        {service.commission_percentage ? `${service.commission_percentage}%` : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditService(service)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}