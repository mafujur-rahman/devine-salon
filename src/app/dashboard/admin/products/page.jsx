"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";
import axios from "axios";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function AdminProducts() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [showCreateProductModal, setShowCreateProductModal] = useState(false);
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
    const [showCategoriesListModal, setShowCategoriesListModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryBranch, setNewCategoryBranch] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '',
        brand: '',
        category: '',
        branch: '',
        selling_price: '',
        cost_price: '',
        stock_qty: '',
        low_stock_alert: ''
    });
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesCurrentPage, setCategoriesCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Admin-specific filters
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [stockFilter, setStockFilter] = useState('');

    // Axios interceptor for auth token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        }
    }, []);

    useEffect(() => {
        checkAuth();
        fetchProducts();
        fetchBranches();
        fetchCategories();
    }, []);

    // Filter categories when branch is selected in product form
    useEffect(() => {
        if (newProduct.branch) {
            const filtered = categories.filter(cat => cat.branch === parseInt(newProduct.branch));
            setFilteredCategories(filtered);
            // Reset category selection when branch changes
            setNewProduct({...newProduct, category: ''});
        } else {
            setFilteredCategories([]);
        }
    }, [newProduct.branch, categories]);

    // Apply filters whenever filter criteria or products change
    useEffect(() => {
        applyFilters();
        setCurrentPage(1); // Reset to first page when filters change
    }, [selectedBranchFilter, selectedCategoryFilter, searchTerm, stockFilter, products]);

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
        let filtered = [...products];
        
        if (selectedBranchFilter) {
            filtered = filtered.filter(product => product.branch === parseInt(selectedBranchFilter));
        }
        
        if (selectedCategoryFilter) {
            filtered = filtered.filter(product => product.category === parseInt(selectedCategoryFilter));
        }
        
        if (stockFilter === 'low') {
            filtered = filtered.filter(product => product.stock_qty <= product.low_stock_alert);
        } else if (stockFilter === 'out') {
            filtered = filtered.filter(product => product.stock_qty === 0);
        }
        
        if (searchTerm) {
            filtered = filtered.filter(product => 
                product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.id.toString().includes(searchTerm)
            );
        }
        
        setFilteredProducts(filtered);
    };

    // Pagination helper functions
    const getPaginatedProducts = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredProducts.slice(startIndex, endIndex);
    };

    const getPaginatedCategories = () => {
        const startIndex = (categoriesCurrentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return categories.slice(startIndex, endIndex);
    };

    const getTotalPages = (totalItems) => {
        return Math.ceil(totalItems / itemsPerPage);
    };

    const handlePageChange = (page, type) => {
        if (type === 'products') {
            setCurrentPage(page);
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

        const itemLabel = type === 'products' ? 'products' : 'categories';

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> {itemLabel}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1, type)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                        }`}
                    >
                        Previous
                    </button>
                    {pageNumbers.map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page, type)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
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
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                        }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/products/get-all-products/`);
            const productsData = response.data.data || response.data.products || response.data.results || [];
            setProducts(productsData);
            setFilteredProducts(productsData);
        } catch (error) {
            console.error('Error fetching products:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch products',
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
            const response = await axios.get(`${API_BASE}/categories/get-all-categories/`);
            const categoriesData = response.data.data || response.data.categories || response.data.results || [];
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

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

        if (!newCategoryBranch) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please select a branch for this category',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: newCategoryName.trim(),
                branch: parseInt(newCategoryBranch)
            };

            const response = await axios.post(`${API_BASE}/category/create-category/`, payload);
            
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Category created successfully!',
                    confirmButtonColor: '#dba627'
                });
                
                setShowCreateCategoryModal(false);
                setNewCategoryName('');
                setNewCategoryBranch('');
                await fetchCategories();
            } else {
                throw new Error(response.data.message || 'Failed to create category');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || error.message || 'Failed to create category',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

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

        if (!newCategoryBranch) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please select a branch for this category',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: newCategoryName.trim(),
                branch: parseInt(newCategoryBranch)
            };

            const response = await axios.put(`${API_BASE}/category/update-category/${editingCategory.id}/`, payload);
            
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Category updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                
                setShowCreateCategoryModal(false);
                setNewCategoryName('');
                setNewCategoryBranch('');
                setEditingCategory(null);
                await fetchCategories();
            } else {
                throw new Error(response.data.message || 'Failed to update category');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || error.message || 'Failed to update category',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

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
                await axios.delete(`${API_BASE}/category/delete-category/${categoryId}/`);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Category has been deleted.',
                    confirmButtonColor: '#dba627'
                });
                await fetchCategories();
                await fetchProducts();
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
        
        if (!newProduct.branch) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please select a branch for this product',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: newProduct.name,
                brand: newProduct.brand,
                category: parseInt(newProduct.category),
                branch: parseInt(newProduct.branch),
                selling_price: parseFloat(newProduct.selling_price),
                cost_price: parseFloat(newProduct.cost_price),
                stock_qty: parseInt(newProduct.stock_qty),
                low_stock_alert: parseInt(newProduct.low_stock_alert)
            };

            const response = await axios.post(`${API_BASE}/product/create-product/`, payload);
            
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Product created successfully!',
                    confirmButtonColor: '#dba627'
                });
                
                setShowCreateProductModal(false);
                resetProductForm();
                fetchProducts();
            } else {
                throw new Error(response.data.message || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || error.message || 'Failed to create product',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetProductForm = () => {
        setNewProduct({
            name: '',
            brand: '',
            category: '',
            branch: '',
            selling_price: '',
            cost_price: '',
            stock_qty: '',
            low_stock_alert: ''
        });
        setFilteredCategories([]);
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
                const response = await axios.delete(`${API_BASE}/product/delete-product/${productId}/`);
                
                if (response.data.success) {
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
            const response = await axios.get(`${API_BASE}/product/${productId}/`);
            setSelectedProduct(response.data.data);
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

    const handleEditProduct = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Edit Product',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Product Name" value="${selectedProduct.name || ''}">
                <input id="swal-brand" class="swal2-input" placeholder="Brand" value="${selectedProduct.brand || ''}">
                <input id="swal-selling-price" class="swal2-input" placeholder="Selling Price" value="${selectedProduct.selling_price || ''}">
                <input id="swal-cost-price" class="swal2-input" placeholder="Cost Price" value="${selectedProduct.cost_price || ''}">
                <input id="swal-stock-qty" class="swal2-input" placeholder="Stock Quantity" value="${selectedProduct.stock_qty || ''}">
                <input id="swal-low-stock-alert" class="swal2-input" placeholder="Low Stock Alert" value="${selectedProduct.low_stock_alert || ''}">
                <select id="swal-branch" class="swal2-select">
                    <option value="">Select Branch</option>
                    ${branches.map(branch => 
                        `<option value="${branch.id}" ${selectedProduct.branch === branch.id ? 'selected' : ''}>${branch.name} - ${branch.city}</option>`
                    ).join('')}
                </select>
                <select id="swal-category" class="swal2-select">
                    <option value="">Select Category</option>
                    ${categories.map(category => 
                        `<option value="${category.id}" ${selectedProduct.category === category.id ? 'selected' : ''}>${category.name} (${category.branch_name || 'Branch ID: ' + category.branch})</option>`
                    ).join('')}
                </select>
                <label class="swal2-checkbox">
                    <input type="checkbox" id="swal-is-active" ${selectedProduct.is_active ? 'checked' : ''}>
                    <span>Active</span>
                </label>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Update',
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value,
                    brand: document.getElementById('swal-brand').value,
                    selling_price: document.getElementById('swal-selling-price').value,
                    cost_price: document.getElementById('swal-cost-price').value,
                    stock_qty: document.getElementById('swal-stock-qty').value,
                    low_stock_alert: document.getElementById('swal-low-stock-alert').value,
                    branch: document.getElementById('swal-branch').value,
                    category: document.getElementById('swal-category').value,
                    is_active: document.getElementById('swal-is-active').checked
                };
            }
        });

        if (formValues) {
            setLoading(true);
            try {
                const response = await axios.put(`${API_BASE}/product/update-product/${selectedProduct.id}/`, formValues);
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Product updated successfully',
                        confirmButtonColor: '#dba627'
                    });
                    fetchProducts();
                    fetchProductDetails(selectedProduct.id);
                }
            } catch (error) {
                console.error('Error updating product:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to update product',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateStock = async () => {
        const { value: stockQty } = await Swal.fire({
            title: 'Update Stock',
            input: 'number',
            inputLabel: 'New Stock Quantity',
            inputValue: selectedProduct.stock_qty || 0,
            inputAttributes: {
                step: '1',
                min: '0'
            },
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Update'
        });

        if (stockQty !== undefined && stockQty !== null) {
            setLoading(true);
            try {
                const response = await axios.put(`${API_BASE}/product/update-product/${selectedProduct.id}/`, {
                    stock_qty: parseInt(stockQty)
                });
                
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Stock quantity updated successfully',
                        confirmButtonColor: '#dba627'
                    });
                    fetchProducts();
                    fetchProductDetails(selectedProduct.id);
                }
            } catch (error) {
                console.error('Error updating stock:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to update stock',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const openEditCategory = (category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setNewCategoryBranch(category.branch.toString());
        setShowCreateCategoryModal(true);
    };

    const getStockStatusColor = (stockQty, lowStockAlert) => {
        if (stockQty === 0) return 'bg-red-100 text-red-800';
        if (stockQty <= lowStockAlert) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const getStockStatusText = (stockQty, lowStockAlert) => {
        if (stockQty === 0) return 'Out of Stock';
        if (stockQty <= lowStockAlert) return 'Low Stock';
        return 'In Stock';
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.id === branchId);
        return branch ? `${branch.name} - ${branch.city}` : `ID: ${branchId}`;
    };

    // Statistics for admin dashboard
    const totalProducts = filteredProducts.length;
    const totalStockValue = filteredProducts.reduce((sum, product) => sum + (parseFloat(product.cost_price || 0) * (product.stock_qty || 0)), 0);
    const totalRevenueValue = filteredProducts.reduce((sum, product) => sum + (parseFloat(product.selling_price || 0) * (product.stock_qty || 0)), 0);
    const lowStockCount = filteredProducts.filter(p => p.stock_qty <= p.low_stock_alert).length;
    const outOfStockCount = filteredProducts.filter(p => p.stock_qty === 0).length;

    const clearFilters = () => {
        setSelectedBranchFilter('');
        setSelectedCategoryFilter('');
        setSearchTerm('');
        setStockFilter('');
    };

    const paginatedProducts = getPaginatedProducts();
    const paginatedCategories = getPaginatedCategories();

    return (
        <DashboardLayout>
            <div>
                {/* Header with Buttons */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Admin <span className="text-[#dba627]">Products</span>
                        </h1>
                        <p className="text-gray-500 mt-1">View and manage all products across all branches</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCategoriesListModal(true)}
                            className="bg-[#dba627] text-black font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Categories
                        </button>
                        <button
                            onClick={() => setShowCreateProductModal(true)}
                            className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Categories List Modal with Table View */}
                {showCategoriesListModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">All Categories</h2>
                                    <p className="text-xs text-gray-500 mt-1">View and manage all categories across branches</p>
                                </div>
                                <button
                                    onClick={() => setShowCategoriesListModal(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 border-b border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowCategoriesListModal(false);
                                        setEditingCategory(null);
                                        setNewCategoryName('');
                                        setNewCategoryBranch('');
                                        setShowCreateCategoryModal(true);
                                    }}
                                    className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create New Category
                                </button>
                            </div>

                            <div className="overflow-y-auto p-6">
                                {categories.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No categories found</p>
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
                                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {paginatedCategories.map((category, index) => {
                                                        const branch = branches.find(b => b.id === category.branch);
                                                        return (
                                                            <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                                    {(categoriesCurrentPage - 1) * itemsPerPage + index + 1}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-sm text-gray-700">{branch?.name || `ID: ${category.branch}`}</span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-sm text-gray-700">{branch?.city || '-'}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                setShowCategoriesListModal(false);
                                                                                openEditCategory(category);
                                                                            }}
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
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPagination(categoriesCurrentPage, categories.length, 'categories')}
                                    </>
                                )}
                            </div>

                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowCategoriesListModal(false)}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Category Modal */}
                {showCreateCategoryModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {editingCategory ? 'Edit Category' : 'Create New Category'}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {editingCategory ? 'Update category details' : 'Add a new product category for a branch'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateCategoryModal(false);
                                        setNewCategoryName('');
                                        setNewCategoryBranch('');
                                        setEditingCategory(null);
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                        placeholder="e.g., Hair Care, Skin Care, Beauty Products"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                        Select Branch *
                                    </label>
                                    <select
                                        value={newCategoryBranch}
                                        onChange={(e) => setNewCategoryBranch(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name} - {branch.city}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowCreateCategoryModal(false);
                                        setNewCategoryName('');
                                        setNewCategoryBranch('');
                                        setEditingCategory(null);
                                    }}
                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
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

                {/* Create Product Modal with Branch-wise Categories */}
                {showCreateProductModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Add New Product</h2>
                                    <p className="text-xs text-gray-500 mt-1">Fill in the details to create a new product</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateProductModal(false);
                                        resetProductForm();
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleCreateProduct}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Product Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={newProduct.name}
                                                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., Ayurvedic Hair Oil, Aloe Vera Gel"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Brand *
                                            </label>
                                            <input
                                                type="text"
                                                value={newProduct.brand}
                                                onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., Patanjali, Himalaya, Lotus"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Select Branch *
                                            </label>
                                            <select
                                                value={newProduct.branch}
                                                onChange={(e) => setNewProduct({...newProduct, branch: e.target.value})}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            >
                                                <option value="">Select Branch</option>
                                                {branches.map(branch => (
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
                                                value={newProduct.category}
                                                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                                                required
                                                disabled={!newProduct.branch}
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">
                                                    {!newProduct.branch ? 'Select Branch First' : 'Select Category'}
                                                </option>
                                                {filteredCategories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {newProduct.branch && filteredCategories.length === 0 && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    No categories found for this branch. Please add a category first.
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Selling Price (₹) *
                                            </label>
                                            <input
                                                type="number"
                                                value={newProduct.selling_price}
                                                onChange={(e) => setNewProduct({...newProduct, selling_price: e.target.value})}
                                                required
                                                step="0.01"
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., 499.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Cost Price (₹) *
                                            </label>
                                            <input
                                                type="number"
                                                value={newProduct.cost_price}
                                                onChange={(e) => setNewProduct({...newProduct, cost_price: e.target.value})}
                                                required
                                                step="0.01"
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., 350.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Stock Quantity *
                                            </label>
                                            <input
                                                type="number"
                                                value={newProduct.stock_qty}
                                                onChange={(e) => setNewProduct({...newProduct, stock_qty: e.target.value})}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., 100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Low Stock Alert *
                                            </label>
                                            <input
                                                type="number"
                                                value={newProduct.low_stock_alert}
                                                onChange={(e) => setNewProduct({...newProduct, low_stock_alert: e.target.value})}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., 10"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateProductModal(false);
                                                resetProductForm();
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
                                            {loading ? 'Creating...' : 'Create Product'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Products</p>
                        <p className="text-2xl font-bold">{totalProducts}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Stock Value</p>
                        <p className="text-2xl font-bold">₹{totalStockValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Potential Revenue</p>
                        <p className="text-2xl font-bold">₹{totalRevenueValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-yellow-600 rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Low Stock Items</p>
                        <p className="text-2xl font-bold">{lowStockCount}</p>
                    </div>
                    <div className="bg-red-600 rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Out of Stock</p>
                        <p className="text-2xl font-bold">{outOfStockCount}</p>
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
                                    {category.name} ({getBranchName(category.branch)})
                                </option>
                            ))}
                        </select>
                        
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Stock Status</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                        </select>
                        
                        <input
                            type="text"
                            placeholder="Search by product name or brand..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                    </div>
                </div>

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
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Product ID
                                        </label>
                                        <p className="text-sm font-semibold text-gray-900">#{selectedProduct.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Status
                                        </label>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedProduct.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {selectedProduct.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Product Name
                                        </label>
                                        <p className="text-lg font-bold text-gray-900">{selectedProduct.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Brand
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedProduct.brand || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Category
                                        </label>
                                        <p className="text-sm text-gray-900">
                                            {categories.find(c => c.id === selectedProduct.category)?.name || `ID: ${selectedProduct.category}`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Branch
                                        </label>
                                        <p className="text-sm text-gray-900">{getBranchName(selectedProduct.branch)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Selling Price
                                        </label>
                                        <p className="text-2xl font-bold text-[#dba627]">₹{selectedProduct.selling_price}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Cost Price
                                        </label>
                                        <p className="text-sm text-gray-900">₹{selectedProduct.cost_price}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Profit Margin
                                        </label>
                                        <p className="text-sm text-green-600 font-semibold">
                                            ₹{(parseFloat(selectedProduct.selling_price) - parseFloat(selectedProduct.cost_price)).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Stock Quantity
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-semibold px-2 py-1 rounded-full ${getStockStatusColor(selectedProduct.stock_qty, selectedProduct.low_stock_alert)}`}>
                                                {selectedProduct.stock_qty} units
                                            </p>
                                            <button
                                                onClick={handleUpdateStock}
                                                className="text-[#dba627] hover:text-black text-xs font-medium"
                                            >
                                                Update Stock
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Stock Status
                                        </label>
                                        <p className={`text-sm font-semibold ${getStockStatusColor(selectedProduct.stock_qty, selectedProduct.low_stock_alert)}`}>
                                            {getStockStatusText(selectedProduct.stock_qty, selectedProduct.low_stock_alert)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Low Stock Alert
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedProduct.low_stock_alert} units</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={handleEditProduct}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Edit Product
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedProduct(null);
                                    }}
                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Products Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No products found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Selling Price</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedProducts.map((product, index) => {
                                        const branch = branches.find(b => b.id === product.branch);
                                        const category = categories.find(c => c.id === product.category);

                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{product.brand || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="text-sm text-gray-700">{branch?.name || `ID: ${product.branch}`}</span>
                                                        {branch?.city && (
                                                            <div className="text-xs text-gray-400">{branch.city}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{category?.name || `ID: ${product.category}`}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-[#dba627]">₹{product.selling_price}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(product.stock_qty, product.low_stock_alert)}`}>
                                                            {product.stock_qty} units
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {product.is_active ? 'Active' : 'Inactive'}
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
                        {renderPagination(currentPage, filteredProducts.length, 'products')}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}