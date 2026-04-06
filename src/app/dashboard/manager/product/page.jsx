"use client"
import DashboardLayout from '@/app/page';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Products = () => {
    const [activeTab, setActiveTab] = useState('product'); // 'product' or 'category'
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: '',
        selling_price: '',
        cost_price: '',
        stock_qty: '',
        low_stock_alert: '',
        branch: ''
    });

    const API_BASE_URL = 'https://saloon.mrshakil.com/api';
    const TOKEN = '73e4c3a1fbc67f4ebdae84b0d3a7e2b03539c514';

    const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${TOKEN}`
        }
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchBranches();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/products/get-all-products/');
            const data = response.data;
            let productsData = data.data || data.products || data.results || [];
            setProducts(productsData);
        } catch (error) {
            console.error('Error fetching products:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch products',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axiosInstance.get('/categories/get-all-categories/');
            const data = response.data;
            console.log('Categories API Response:', data);

            let categoriesData = [];
            if (data.success && data.data) {
                categoriesData = data.data;
            } else if (data.data && Array.isArray(data.data)) {
                categoriesData = data.data;
            } else if (Array.isArray(data)) {
                categoriesData = data;
            }

            console.log('Parsed Categories:', categoriesData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error fetching categories:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch categories',
                confirmButtonColor: '#dba627'
            });
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await axiosInstance.get('/branches/get-all-branches/');
            const data = response.data;
            let branchesData = data.data || data.branches || data.results || [];
            setBranches(branchesData);
            console.log('Branches loaded:', branchesData);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    // Create Category Function
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please enter category name',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.post('/category/create-category/', {
                name: newCategoryName.trim()
            });

            const result = response.data;
            console.log('Create Category Response:', result);

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Category created successfully!',
                    confirmButtonColor: '#dba627'
                });

                setShowCategoryModal(false);
                setNewCategoryName('');
                await fetchCategories();

                if (result.data && result.data.id && activeTab === 'product') {
                    setFormData({
                        ...formData,
                        category: result.data.id
                    });
                }
            } else {
                throw new Error(result.message || 'Failed to create category');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            let errorMessage = 'Failed to create category';

            if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.name && errorData.name[0]) {
                    errorMessage = errorData.name[0];
                }
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    // Update Category Function
    const handleUpdateCategory = async () => {
        if (!newCategoryName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please enter category name',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.put(`/category/update-category/${editingCategory.id}/`, {
                name: newCategoryName.trim()
            });

            const result = response.data;

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Category updated successfully!',
                    confirmButtonColor: '#dba627'
                });

                setShowCategoryModal(false);
                setNewCategoryName('');
                setEditingCategory(null);
                await fetchCategories();
            } else {
                throw new Error(result.message || 'Failed to update category');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update category',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete Category Function
    const handleDeleteCategory = async (categoryId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will also affect products using this category!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const response = await axiosInstance.delete(`/category/delete-category/${categoryId}/`);
                const data = response.data;

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Category has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchCategories();
                    fetchProducts(); // Refresh products as well
                }
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

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const categoryId = parseInt(formData.category);
            const branchId = parseInt(formData.branch);

            console.log('Selected Category ID:', categoryId);
            console.log('Selected Branch ID:', branchId);

            const selectedCategory = categories.find(c => c.id === categoryId);
            if (!selectedCategory) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Category',
                    text: `Please select a valid category`,
                    confirmButtonColor: '#dba627'
                });
                setLoading(false);
                return;
            }

            const payload = {
                name: formData.name,
                brand: formData.brand,
                category: categoryId,
                selling_price: parseFloat(formData.selling_price),
                cost_price: parseFloat(formData.cost_price),
                stock_qty: parseInt(formData.stock_qty),
                low_stock_alert: parseInt(formData.low_stock_alert),
                branch: branchId
            };

            console.log('Sending payload:', payload);

            const response = await axiosInstance.post('/product/create-product/', payload);
            const result = response.data;

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Product created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowCreateForm(false);
                resetForm();
                fetchProducts();
            } else {
                throw new Error(result.message || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            let errorMessage = 'Failed to create product';

            if (error.response?.data) {
                const errorData = error.response.data;
                console.error('API Error:', errorData);

                if (typeof errorData === 'object') {
                    const messages = [];
                    for (const [key, value] of Object.entries(errorData)) {
                        if (Array.isArray(value)) {
                            messages.push(`${key}: ${value.join(', ')}`);
                        } else {
                            messages.push(`${key}: ${value}`);
                        }
                    }
                    errorMessage = messages.join('\n');
                }
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const categoryId = parseInt(formData.category);

            const payload = {
                name: formData.name,
                brand: formData.brand,
                category: categoryId,
                selling_price: parseFloat(formData.selling_price),
                cost_price: parseFloat(formData.cost_price),
                stock_qty: parseInt(formData.stock_qty),
                low_stock_alert: parseInt(formData.low_stock_alert)
            };

            console.log('Updating payload:', payload);

            const response = await axiosInstance.put(`/product/update-product/${editingProduct.id}/`, payload);
            const result = response.data;

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Product updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowCreateForm(false);
                setEditingProduct(null);
                resetForm();
                fetchProducts();
            }
        } catch (error) {
            console.error('Error updating product:', error);
            let errorMessage = 'Failed to update product';

            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    const messages = [];
                    for (const [key, value] of Object.entries(errorData)) {
                        if (Array.isArray(value)) {
                            messages.push(`${key}: ${value.join(', ')}`);
                        } else {
                            messages.push(`${key}: ${value}`);
                        }
                    }
                    errorMessage = messages.join('\n');
                }
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
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
                const response = await axiosInstance.delete(`/product/delete-product/${productId}/`);
                const data = response.data;

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Product has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchProducts();
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to delete product',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchProductDetails = async (productId) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/product/${productId}/`);
            const data = response.data;
            setSelectedProduct(data.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching product details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch product details',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const openEditProduct = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            brand: product.brand,
            category: product.category,
            selling_price: product.selling_price,
            cost_price: product.cost_price,
            stock_qty: product.stock_qty,
            low_stock_alert: product.low_stock_alert,
            branch: product.branch
        });
        setShowCreateForm(true);
    };

    const openEditCategory = (category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setShowCategoryModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            brand: '',
            category: '',
            selling_price: '',
            cost_price: '',
            stock_qty: '',
            low_stock_alert: '',
            branch: ''
        });
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getStockStatus = (stock, alert) => {
        if (stock <= 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
        if (stock <= alert) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
    };

    const calculateProfit = (selling, cost) => {
        const profit = selling - cost;
        const margin = (profit / selling) * 100;
        return { profit: profit.toFixed(2), margin: margin.toFixed(1) };
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : `ID: ${categoryId}`;
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : `ID: ${branchId}`;
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-white">
                <div className="px-4">
                    {/* Header with Tabs */}
                    <div className=" ">
                        <div  className='mb-6 border-b-2 border-[#dba627] pb-4'>
                            <h1 className="text-3xl font-bold text-black tracking-tight">
                                Product <span className="text-[#dba627]">Management</span>
                            </h1>
                        </div>
                        <div className="flex justify-between items-center gap-6 mb-6">
                            {/* Tabs */}
                            <div className="flex gap-2 ml-4">
                                <button
                                    onClick={() => setActiveTab('product')}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'product'
                                        ? 'bg-[#dba627] text-black shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Products
                                </button>
                                <button
                                    onClick={() => setActiveTab('category')}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'category'
                                        ? 'bg-[#dba627] text-black shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Categories
                                </button>
                            </div>
                            {/* Add Button - Changes based on active tab */}
                            {activeTab === 'product' && (
                                <button
                                    onClick={() => {
                                        setEditingProduct(null);
                                        resetForm();
                                        setShowCreateForm(true);
                                    }}
                                    className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Product
                                </button>
                            )}

                            {activeTab === 'category' && (
                                <button
                                    onClick={() => {
                                        setEditingCategory(null);
                                        setNewCategoryName('');
                                        setShowCategoryModal(true);
                                    }}
                                    className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Category
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Modal (Create/Edit) */}
                    {showCategoryModal && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {editingCategory ? 'Edit Category' : 'Create New Category'}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {editingCategory ? 'Update category name' : 'Add a new product category'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCategoryModal(false);
                                            setNewCategoryName('');
                                            setEditingCategory(null);
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="p-6">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                        placeholder="e.g., Hair Care, Skin Care"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                editingCategory ? handleUpdateCategory() : handleCreateCategory();
                                            }
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowCategoryModal(false);
                                            setNewCategoryName('');
                                            setEditingCategory(null);
                                        }}
                                        className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                                        disabled={loading}
                                        className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Form Modal */}
                    {showCreateForm && activeTab === 'product' && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {editingProduct ? 'Update product details' : 'Fill in the details to create a new product'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setEditingProduct(null);
                                            resetForm();
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="overflow-y-auto px-6 py-5">
                                    <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Product Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="e.g., Shampoo X"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Brand *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="brand"
                                                    value={formData.brand}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="e.g., BrandY"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Category *
                                                </label>
                                                <div className="flex gap-2">
                                                    <select
                                                        name="category"
                                                        value={formData.category}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(category => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Branch *
                                                </label>
                                                <select
                                                    name="branch"
                                                    value={formData.branch}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                >
                                                    <option value="">Select Branch</option>
                                                    {branches.map(branch => (
                                                        <option key={branch.id} value={branch.id}>
                                                            {branch.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Selling Price (BDT) *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="selling_price"
                                                    value={formData.selling_price}
                                                    onChange={handleInputChange}
                                                    required
                                                    step="0.01"
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="1200.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Cost Price (BDT) *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="cost_price"
                                                    value={formData.cost_price}
                                                    onChange={handleInputChange}
                                                    required
                                                    step="0.01"
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="800.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Stock Quantity *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="stock_qty"
                                                    value={formData.stock_qty}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="50"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Low Stock Alert *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="low_stock_alert"
                                                    value={formData.low_stock_alert}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    placeholder="5"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCreateForm(false);
                                                    setEditingProduct(null);
                                                    resetForm();
                                                }}
                                                className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                            >
                                                {loading ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Details Modal */}
                    {showDetailsModal && selectedProduct && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
                                        <p className="text-xs text-gray-500 mt-1">View complete product information</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setSelectedProduct(null);
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="overflow-y-auto px-6 py-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Product ID</label>
                                            <p className="text-sm font-semibold text-gray-900">#{selectedProduct.id}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Status</label>
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${selectedProduct.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {selectedProduct.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Product Name</label>
                                            <p className="text-base font-bold text-gray-900">{selectedProduct.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Brand</label>
                                            <p className="text-sm font-semibold text-gray-900">{selectedProduct.brand}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Category</label>
                                            <p className="text-sm font-semibold text-gray-900">{getCategoryName(selectedProduct.category)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Branch</label>
                                            <p className="text-sm text-gray-900">{getBranchName(selectedProduct.branch)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Stock Status</label>
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStockStatus(selectedProduct.stock_qty, selectedProduct.low_stock_alert).color}`}>
                                                {getStockStatus(selectedProduct.stock_qty, selectedProduct.low_stock_alert).text}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Stock Quantity</label>
                                            <p className={`text-sm font-bold ${selectedProduct.stock_qty <= selectedProduct.low_stock_alert ? 'text-red-600' : 'text-gray-900'}`}>
                                                {selectedProduct.stock_qty} units
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Selling Price</label>
                                            <p className="text-xl font-bold text-[#dba627]">৳{selectedProduct.selling_price}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Cost Price</label>
                                            <p className="text-sm font-semibold text-gray-900">৳{selectedProduct.cost_price}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setSelectedProduct(null);
                                        }}
                                        className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Table */}
                    {activeTab === 'product' && (
                        <>
                            {loading && !showCreateForm ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">No products found. Click Add Product to create one.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {products.map((product, index) => {
                                                const stockStatus = getStockStatus(product.stock_qty, product.low_stock_alert);

                                                return (
                                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                                                <p className="text-xs text-gray-400">ID: {product.id}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-700">{product.brand}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-700">{getCategoryName(product.category)}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-700">{getBranchName(product.branch)}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-bold text-[#dba627]">৳{product.selling_price}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-600">৳{product.cost_price}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-sm font-semibold ${product.stock_qty <= product.low_stock_alert ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {product.stock_qty} units
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                                                                {stockStatus.text}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => fetchProductDetails(product.id)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => openEditProduct(product)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteProduct(product.id)}
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
                        </>
                    )}

                    {/* Categories Table */}
                    {activeTab === 'category' && (
                        <>
                            {loading ? (
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
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category ID</th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Name</th>
                                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {categories.map((category, index) => (
                                                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold text-gray-900">#{category.id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-700">{category.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditCategory(category)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit Category"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCategory(category.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Category"
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
            </div>
        </DashboardLayout>
    );
};

export default Products;