"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";

const API_BASE = "https://saloon.mrshakil.com/api";

// Helper for authenticated requests - FIXED VERSION
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
        let errorMessage = "API request failed";
        try {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
        } catch (e) {
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    if (options.method === 'DELETE' || response.status === 204) {
        return null;
    }

    try {
        return await response.json();
    } catch (e) {
        return null;
    }
}

export default function Packages() {
    const router = useRouter();

    // State for packages
    const [packages, setPackages] = useState([]);
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // State for services
    const [services, setServices] = useState([]);

    // State for form data
    const [packageFormData, setPackageFormData] = useState({
        name: '',
        description: '',
        package_price: '',
        validity_days: ''
    });

    const [selectedServicesList, setSelectedServicesList] = useState([]);
    const [serviceInput, setServiceInput] = useState({ service: '' });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkAuth();
        fetchPackages();
        fetchServices();
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

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/service/packages/');
            let packagesData = data?.data || data?.packages || data?.results || [];
            setPackages(packagesData);
            setTotalPages(Math.ceil(packagesData.length / itemsPerPage));
            // Reset to first page when fetching new data
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching packages:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch packages',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const data = await apiFetch('/service/services/');
            let servicesData = data?.data || data?.services || data?.results || [];
            setServices(servicesData);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const handleCreatePackage = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: packageFormData.name,
            description: packageFormData.description,
            services: selectedServicesList.map(s => s.id),
            package_price: parseFloat(packageFormData.package_price),
            validity_days: parseInt(packageFormData.validity_days)
        };

        try {
            const result = await apiFetch('/service/create-package/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (result?.success || result) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Package created successfully!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowPackageForm(false);
                resetPackageForm();
                fetchPackages();
            }
        } catch (error) {
            console.error('Error creating package:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create package',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePackage = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: packageFormData.name,
            description: packageFormData.description,
            services: selectedServicesList.map(s => s.id),
            package_price: parseFloat(packageFormData.package_price),
            validity_days: parseInt(packageFormData.validity_days)
        };

        try {
            const result = await apiFetch(`/service/update-package/${editingPackage.id}/`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (result?.success || result) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Package updated successfully!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowPackageForm(false);
                setEditingPackage(null);
                resetPackageForm();
                fetchPackages();
            }
        } catch (error) {
            console.error('Error updating package:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update package',
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
                await apiFetch(`/service/delete-package/${packageId}/`, {
                    method: 'DELETE'
                });

                setPackages(prevPackages => {
                    const updatedPackages = prevPackages.filter(pkg => pkg.id !== packageId);
                    setTotalPages(Math.ceil(updatedPackages.length / itemsPerPage));
                    if (currentPage > Math.ceil(updatedPackages.length / itemsPerPage) && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    }
                    return updatedPackages;
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Package has been deleted successfully.',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error deleting package:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to delete package',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const addServiceToPackage = () => {
        if (serviceInput.service) {
            const service = services.find(s => s.id === parseInt(serviceInput.service));
            if (service && !selectedServicesList.find(s => s.id === service.id)) {
                setSelectedServicesList([...selectedServicesList, {
                    id: service.id,
                    name: service.name,
                    price: service.price,
                    duration: service.duration
                }]);
                setServiceInput({ service: '' });
            } else if (selectedServicesList.find(s => s.id === service.id)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Duplicate Service',
                    text: 'This service is already added to the package!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        }
    };

    const removeServiceFromPackage = (index) => {
        const newServices = [...selectedServicesList];
        newServices.splice(index, 1);
        setSelectedServicesList(newServices);
    };

    const resetPackageForm = () => {
        setPackageFormData({
            name: '',
            description: '',
            package_price: '',
            validity_days: ''
        });
        setSelectedServicesList([]);
        setServiceInput({ service: '' });
    };

    const openEditPackage = (pkg) => {
        setEditingPackage(pkg);
        setPackageFormData({
            name: pkg.name,
            description: pkg.description || '',
            package_price: pkg.package_price,
            validity_days: pkg.validity_days
        });

        const selectedServices = services.filter(s => pkg.services.includes(s.id));
        setSelectedServicesList(selectedServices.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration: s.duration
        })));

        setShowPackageForm(true);
    };

    const openDetailsModal = (pkg) => {
        setSelectedPackage(pkg);
        setShowDetailsModal(true);
    };

    const handleInputChange = (e) => {
        setPackageFormData({
            ...packageFormData,
            [e.target.name]: e.target.value
        });
    };

    const calculateTotalPrice = () => {
        const total = selectedServicesList.reduce((sum, service) => sum + parseFloat(service.price), 0);
        return total.toFixed(2);
    };

    const isFormValid = () => {
        return packageFormData.name && 
               packageFormData.package_price && 
               packageFormData.validity_days &&
               selectedServicesList.length > 0;
    };

    const getServiceNames = (serviceIds) => {
        if (!serviceIds || !Array.isArray(serviceIds)) return [];
        return serviceIds.map(id => {
            const service = services.find(s => s.id === id);
            return service ? service.name : `Service ${id}`;
        });
    };

    // Get current page data
    const getCurrentPackages = () => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return packages.slice(indexOfFirstItem, indexOfLastItem);
    };

    // Pagination component
    const Pagination = () => {
        const getPageNumbers = () => {
            const pageNumbers = [];
            const maxVisible = 5;
            
            if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                if (currentPage <= 3) {
                    for (let i = 1; i <= 4; i++) pageNumbers.push(i);
                    pageNumbers.push('...');
                    pageNumbers.push(totalPages);
                } else if (currentPage >= totalPages - 2) {
                    pageNumbers.push(1);
                    pageNumbers.push('...');
                    for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
                } else {
                    pageNumbers.push(1);
                    pageNumbers.push('...');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
                    pageNumbers.push('...');
                    pageNumbers.push(totalPages);
                }
            }
            return pageNumbers;
        };

        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 mt-4">
                <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, packages.length)} of {packages.length} packages
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Previous
                    </button>
                    {getPageNumbers().map((pageNum, idx) => (
                        <button
                            key={idx}
                            onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                pageNum === currentPage
                                    ? 'bg-[#dba627] text-white'
                                    : pageNum === '...'
                                    ? 'cursor-default border-none'
                                    : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                            disabled={pageNum === '...'}
                        >
                            {pageNum}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div>
                {/* Header with Create Button */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Package <span className="text-[#dba627]">Management</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Manage service packages and combos</p>
                    </div>
                    <button
                        onClick={() => {
                            resetPackageForm();
                            setEditingPackage(null);
                            setShowPackageForm(true);
                        }}
                        className="bg-black text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Package
                    </button>
                </div>

                {/* Create/Edit Package Form Modal */}
                {showPackageForm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {editingPackage ? 'Edit Package' : 'Create New Package'}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {editingPackage ? 'Update package details' : 'Fill in the details to create a new service package'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPackageForm(false);
                                        setEditingPackage(null);
                                        resetPackageForm();
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={editingPackage ? handleUpdatePackage : handleCreatePackage}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Package Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={packageFormData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., Deluxe Hair Care Package"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                value={packageFormData.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="Describe what's included in this package..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Validity Days *
                                            </label>
                                            <input
                                                type="number"
                                                name="validity_days"
                                                value={packageFormData.validity_days}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., 30"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Services in Package *
                                            </label>
                                            <div className="flex gap-2 mb-3">
                                                <select
                                                    value={serviceInput.service}
                                                    onChange={(e) => setServiceInput({ service: e.target.value })}
                                                    className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                >
                                                    <option value="">Select Service</option>
                                                    {services.map(service => (
                                                        <option key={service.id} value={service.id}>
                                                            {service.name} - ₹{service.price} ({service.duration} min)
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={addServiceToPackage}
                                                    className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer hover:bg-gray-800 transition-colors"
                                                >
                                                    Add Service
                                                </button>
                                            </div>

                                            {selectedServicesList.length > 0 && (
                                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                                    {selectedServicesList.map((service, index) => (
                                                        <div key={index} className="p-3 flex justify-between items-center">
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-900">{service.name}</span>
                                                                <span className="text-xs text-gray-500 ml-2">
                                                                    ₹{service.price} - {service.duration} min
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeServiceFromPackage(index)}
                                                                className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Total Original Price
                                            </label>
                                            <div className="h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center">
                                                <span className="text-sm font-semibold text-gray-700">₹{calculateTotalPrice()}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Package Price (₹) *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="package_price"
                                                value={packageFormData.package_price}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                placeholder="e.g., 999"
                                            />
                                            {packageFormData.package_price && parseFloat(packageFormData.package_price) < parseFloat(calculateTotalPrice()) && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    ✨ Customers save ₹{(parseFloat(calculateTotalPrice()) - parseFloat(packageFormData.package_price)).toFixed(2)} with this package!
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* FOOTER */}
                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPackageForm(false);
                                                setEditingPackage(null);
                                                resetPackageForm();
                                            }}
                                            className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !isFormValid()}
                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-800 transition-colors"
                                        >
                                            {loading ? 'Saving...' : (editingPackage ? 'Update Package' : 'Create Package')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Package Details Modal */}
                {showDetailsModal && selectedPackage && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Package Details
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Complete package information
                                    </p>
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
                                            Package Name
                                        </label>
                                        <p className="text-sm font-semibold text-gray-900">{selectedPackage.name}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Description
                                        </label>
                                        <p className="text-sm text-gray-700">{selectedPackage.description || 'No description provided'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Branch
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedPackage.branch_name || 'N/A'} - {selectedPackage.branch_city || ''}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Validity Days
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedPackage.validity_days} days</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Original Price
                                        </label>
                                        <p className="text-sm text-gray-700 line-through">₹{selectedPackage.original_price}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Package Price
                                        </label>
                                        <p className="text-xl font-bold text-[#dba627]">₹{selectedPackage.package_price}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Savings
                                        </label>
                                        <p className="text-sm font-semibold text-green-600">
                                            Save ₹{(parseFloat(selectedPackage.original_price) - parseFloat(selectedPackage.package_price)).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                            Included Services
                                        </label>
                                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                            {selectedPackage.services && selectedPackage.services.map((serviceId, index) => {
                                                const service = services.find(s => s.id === serviceId);
                                                return (
                                                    <div key={index} className="p-3 flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{service?.name || `Service ${serviceId}`}</p>
                                                            <p className="text-xs text-gray-500">Duration: {service?.duration || 'N/A'} min</p>
                                                        </div>
                                                        <p className="text-sm font-bold text-[#dba627]">₹{service?.price || '0'}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedPackage(null);
                                    }}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Packages Table */}
                {loading && !showPackageForm ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : packages.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No packages found. Click Create Package to add one.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Package Name</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Original Price</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Package Price</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Validity</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {getCurrentPackages().map((pkg, index) => {
                                        const serviceNames = getServiceNames(pkg.services);
                                        const savings = parseFloat(pkg.original_price) - parseFloat(pkg.package_price);

                                        return (
                                            <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                                                        {pkg.description && (
                                                            <p className="text-xs text-gray-400 truncate max-w-xs">{pkg.description}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{pkg.branch_name || 'N/A'}</span>
                                                    {pkg.branch_city && <span className="text-xs text-gray-400 block">({pkg.branch_city})</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {serviceNames.slice(0, 2).map((name, idx) => (
                                                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                {name}
                                                            </span>
                                                        ))}
                                                        {serviceNames.length > 2 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{serviceNames.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-500 line-through">₹{pkg.original_price}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-[#dba627]">₹{pkg.package_price}</span>
                                                    {savings > 0 && (
                                                        <span className="text-xs text-green-600 block">Save ₹{savings.toFixed(2)}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{pkg.validity_days} days</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openDetailsModal(pkg)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => openEditPackage(pkg)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                        <Pagination />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}