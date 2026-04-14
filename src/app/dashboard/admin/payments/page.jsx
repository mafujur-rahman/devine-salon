"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";
import axios from "axios";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function AdminPayments() {
    const router = useRouter();
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [branches, setBranches] = useState([]);
    const [branchInfo, setBranchInfo] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    
    // Admin-specific filters
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Axios interceptor for auth token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        }
    }, []);

    useEffect(() => {
        checkAuth();
        fetchAllInvoices();
        fetchBranches();
        fetchBranchInfo();
    }, []);

    // Apply filters whenever filter criteria or invoices change
    useEffect(() => {
        applyFilters();
        setCurrentPage(1); // Reset to first page when filters change
    }, [selectedBranchFilter, searchTerm, paymentMethodFilter, dateFrom, dateTo, invoices]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "superadmin") {
            router.push("/login");
        }
    };

    const fetchBranchInfo = async () => {
        try {
            const response = await axios.get(`${API_BASE}/branches/get-all-branches/`);
            const branchesData = response.data.data || response.data.branches || response.data.results || [];
            if (branchesData.length > 0) {
                setBranchInfo(branchesData[0]);
            }
        } catch (error) {
            console.error('Error fetching branch info:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...invoices];
        
        // Filter by branch
        if (selectedBranchFilter) {
            filtered = filtered.filter(invoice => invoice.branch?.id === parseInt(selectedBranchFilter));
        }
        
        // Search by customer name or phone
        if (searchTerm) {
            filtered = filtered.filter(invoice => 
                invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.customer?.phone?.includes(searchTerm) ||
                invoice.id.toString().includes(searchTerm)
            );
        }
        
        // Filter by payment method
        if (paymentMethodFilter) {
            filtered = filtered.filter(invoice => invoice.payment_method === paymentMethodFilter);
        }
        
        // Filter by date range
        if (dateFrom) {
            filtered = filtered.filter(invoice => invoice.created_at?.split('T')[0] >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter(invoice => invoice.created_at?.split('T')[0] <= dateTo);
        }
        
        setFilteredInvoices(filtered);
    };

    const fetchAllInvoices = async () => {
        setLoading(true);
        try {
            // First fetch all branches
            const branchesResponse = await axios.get(`${API_BASE}/branches/get-all-branches/`);
            const branchesData = branchesResponse.data.data || branchesResponse.data.branches || branchesResponse.data.results || [];
            
            let allInvoices = [];
            
            // Fetch invoices for each branch
            for (const branch of branchesData) {
                try {
                    const response = await axios.get(`${API_BASE}/invoices/get-all-invoices/?branch_id=${branch.id}`);
                    const invoicesData = response.data.data || response.data.invoices || response.data.results || [];
                    allInvoices = [...allInvoices, ...invoicesData];
                } catch (error) {
                    console.error(`Error fetching invoices for branch ${branch.id}:`, error);
                }
            }
            
            // Sort invoices by created_at date (newest first)
            allInvoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            setInvoices(allInvoices);
            setFilteredInvoices(allInvoices);
        } catch (error) {
            console.error('Error fetching all invoices:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch invoices',
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

    const fetchInvoiceDetails = async (invoiceId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/invoice/${invoiceId}/`);
            setSelectedInvoice(response.data.data);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch invoice details',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPaymentMethodBadge = (method) => {
        const colors = {
            'cash': 'bg-green-100 text-green-800',
            'online': 'bg-blue-100 text-blue-800',
            'card': 'bg-purple-100 text-purple-800'
        };
        return colors[method] || 'bg-gray-100 text-gray-800';
    };

    const getDiscountTypeBadge = (type) => {
        const colors = {
            'flat': 'bg-orange-100 text-orange-800',
            'percent': 'bg-yellow-100 text-yellow-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    // PDF Generation Function
    const generatePDF = (invoice) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice #${invoice.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .invoice-title { color: #dba627; font-size: 28px; margin-bottom: 10px; }
                        .company-info { margin-bottom: 20px; }
                        .invoice-details { margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #f5f5f5; font-weight: bold; }
                        .total-section { text-align: right; margin-top: 20px; }
                        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
                        .branch-info { background-color: #f9f9f9; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="invoice-title">INVOICE</div>
                        <div class="company-info">
                            <h3>Devine Salon</h3>
                            ${invoice.branch ? `
                                <p>${invoice.branch.name}</p>
                                <p>${invoice.branch.address}, ${invoice.branch.city}</p>
                                <p>Phone: +91${invoice.branch.phone || 'N/A'}</p>
                            ` : '<p>Your Salon Address Here</p>'}
                        </div>
                    </div>
                    <div class="branch-info">
                        <p><strong>Branch:</strong> ${invoice.branch?.name || 'N/A'} | <strong>Location:</strong> ${invoice.branch?.city || 'N/A'}</p>
                    </div>
                    <div class="invoice-details">
                        <p><strong>Invoice ID:</strong> #${invoice.id}</p>
                        <p><strong>Date:</strong> ${formatDate(invoice.created_at)}</p>
                        <p><strong>Payment Method:</strong> ${invoice.payment_method?.toUpperCase()}</p>
                        <p><strong>Served By:</strong> ${invoice.served_by?.name}</p>
                        <p><strong>Customer Name:</strong> ${invoice.customer?.name}</p>
                        <p><strong>Customer Phone:</strong> +91${invoice.customer?.phone}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items?.map(item => `
                                <tr>
                                    <td>${item.service_name || item.product_name}</td>
                                    <td>${item.item_type}</td>
                                    <td>${item.quantity}</td>
                                    <td>₹${item.price}</td>
                                    <td>₹${item.total}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" style="text-align: right;"><strong>Subtotal:</strong></td>
                                <td>₹${invoice.subtotal}</td>
                            </tr>
                            ${parseFloat(invoice.discount) > 0 ? `
                            <tr>
                                <td colspan="4" style="text-align: right;"><strong>Discount (${invoice.discount_type === 'percent' ? `${invoice.discount}%` : '₹'}):</strong></td>
                                <td>- ₹${invoice.discount}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td colspan="4" style="text-align: right;"><strong>Total:</strong></td>
                                <td><strong>₹${invoice.total_amount}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="footer">
                        <p>Thank you for choosing Devine Salon!</p>
                        <p>For any queries, please contact us at ${invoice.branch?.phone || 'your salon phone'}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Print Function
    const handlePrint = (invoice) => {
        generatePDF(invoice);
    };

    // WhatsApp Send Function
    const sendWhatsApp = (invoice) => {
        const message = `🏢 *DEVINE SALON* 🏢\n\n` +
                       `📄 *INVOICE DETAILS*\n\n` +
                       `🧾 *Invoice ID:* #${invoice.id}\n` +
                       `📅 *Date:* ${formatDate(invoice.created_at)}\n` +
                       `👤 *Customer:* ${invoice.customer?.name}\n` +
                       `📞 *Phone:* +91${invoice.customer?.phone}\n` +
                       `💰 *Total Amount:* ₹${invoice.total_amount}\n` +
                       `💳 *Payment Method:* ${invoice.payment_method?.toUpperCase()}\n\n` +
                       `${invoice.branch ? `🏪 *Branch:* ${invoice.branch.name}\n📍 *Location:* ${invoice.branch.city}\n📞 *Branch Phone:* ${invoice.branch.phone || 'N/A'}\n\n` : ''}` +
                       `✨ Thank you for choosing Devine Salon! ✨\n` +
                       `We look forward to serving you again!`;
        
        const phoneNumber = invoice.customer?.phone;
        if (phoneNumber) {
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Customer phone number not found!',
                confirmButtonColor: '#dba627'
            });
        }
    };

    // Statistics for admin dashboard
    const totalInvoices = filteredInvoices.length;
    const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
    const totalDiscount = filteredInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.discount || 0), 0);
    const avgInvoiceValue = totalInvoices > 0 ? (totalRevenue / totalInvoices).toFixed(2) : 0;
    const cashPayments = filteredInvoices.filter(i => i.payment_method === 'cash').reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
    const onlinePayments = filteredInvoices.filter(i => i.payment_method === 'online').reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
    const uniqueBranches = new Set(filteredInvoices.map(i => i.branch?.id)).size;

    const clearFilters = () => {
        setSelectedBranchFilter('');
        setSearchTerm('');
        setPaymentMethodFilter('');
        setDateFrom('');
        setDateTo('');
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <DashboardLayout>
            <div className="px-3">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Admin <span className="text-[#dba627]">Payments & Invoices</span>
                        </h1>
                        <p className="text-gray-500 mt-1">View and manage all customer payments and invoices across all branches</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Invoices</p>
                        <p className="text-2xl font-bold">{totalInvoices}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Unique Branches</p>
                        <p className="text-2xl font-bold">{uniqueBranches}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Revenue</p>
                        <p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Total Discount</p>
                        <p className="text-2xl font-bold text-red-400">₹{totalDiscount.toFixed(2)}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Average Invoice</p>
                        <p className="text-2xl font-bold">₹{avgInvoiceValue}</p>
                    </div>
                    <div className="bg-green-600 rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Cash Payments</p>
                        <p className="text-2xl font-bold">₹{cashPayments.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-600 rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Online Payments</p>
                        <p className="text-2xl font-bold">₹{onlinePayments.toFixed(2)}</p>
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
                            value={paymentMethodFilter}
                            onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Payment Methods</option>
                            <option value="cash">Cash</option>
                            <option value="online">Online</option>
                            <option value="card">Card</option>
                        </select>
                        
                        <input
                            type="text"
                            placeholder="Search by customer name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <input
                            type="date"
                            placeholder="Date From"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                        <input
                            type="date"
                            placeholder="Date To"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                    </div>
                </div>

                {/* Invoice Details Modal */}
                {showDetailsModal && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
                                    <p className="text-xs text-gray-500 mt-1">Complete invoice information</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedInvoice(null);
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-5">
                                {/* Branch Info Banner */}
                                {selectedInvoice.branch && (
                                    <div className="bg-gradient-to-r from-[#dba627]/10 to-transparent p-4 rounded-lg border border-[#dba627]/20 mb-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <h3 className="font-semibold text-gray-800">Devine Salon - {selectedInvoice.branch.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600">{selectedInvoice.branch.address}, {selectedInvoice.branch.city}</p>
                                        <p className="text-xs text-gray-500 mt-1">Phone: {selectedInvoice.branch.phone || 'N/A'}</p>
                                    </div>
                                )}

                                {/* Invoice Header */}
                                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Invoice #{selectedInvoice.id}</h3>
                                        <p className="text-xs text-gray-500 mt-1">Created: {formatDate(selectedInvoice.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">Status: <span className="text-green-600">Paid</span></p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Customer Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Customer Details</h4>
                                        <div className="space-y-2">
                                            <p className="text-sm">
                                                <span className="text-gray-500">Name:</span>{' '}
                                                <span className="font-medium text-gray-900">{selectedInvoice.customer?.name || 'N/A'}</span>
                                            </p>
                                            <p className="text-sm">
                                                <span className="text-gray-500">Phone:</span>{' '}
                                                <span className="font-medium text-gray-900">{selectedInvoice.customer?.phone || 'N/A'}</span>
                                            </p>
                                            {selectedInvoice.customer?.email && (
                                                <p className="text-sm">
                                                    <span className="text-gray-500">Email:</span>{' '}
                                                    <span className="font-medium text-gray-900">{selectedInvoice.customer.email}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Staff Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Staff Information</h4>
                                        <div className="space-y-2">
                                            <p className="text-sm">
                                                <span className="text-gray-500">Served By:</span>{' '}
                                                <span className="font-medium text-gray-900">{selectedInvoice.served_by?.name || 'N/A'}</span>
                                            </p>
                                            <p className="text-sm">
                                                <span className="text-gray-500">Payment Method:</span>{' '}
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPaymentMethodBadge(selectedInvoice.payment_method)}`}>
                                                    {selectedInvoice.payment_method?.toUpperCase()}
                                                </span>
                                            </p>
                                            <p className="text-sm">
                                                <span className="text-gray-500">Discount:</span>{' '}
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getDiscountTypeBadge(selectedInvoice.discount_type)}`}>
                                                    {selectedInvoice.discount_type?.toUpperCase()}
                                                </span>
                                                <span className="ml-2 font-medium text-red-600">-₹{selectedInvoice.discount}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Items</h4>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Item</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
                                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Qty</th>
                                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Price</th>
                                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedInvoice.items?.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {item.service_name || item.product_name}
                                                         </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                item.item_type === 'service' 
                                                                    ? 'bg-purple-100 text-purple-800' 
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {item.item_type?.toUpperCase()}
                                                            </span>
                                                         </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 text-right">₹{item.price}</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{item.total}</td>
                                                     </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                        Subtotal:
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                                        ₹{selectedInvoice.subtotal}
                                                    </td>
                                                </tr>
                                                {selectedInvoice.discount > 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                                                            Discount ({selectedInvoice.discount_type}):
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                                                            -₹{selectedInvoice.discount}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="border-t border-gray-300">
                                                    <td colSpan="4" className="px-4 py-3 text-right text-base font-bold text-gray-900">
                                                        Total Amount:
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xl font-bold text-[#dba627]">
                                                        ₹{selectedInvoice.total_amount}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => handlePrint(selectedInvoice)}
                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                </button>
                                <button
                                    onClick={() => sendWhatsApp(selectedInvoice)}
                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedInvoice(null);
                                    }}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoices Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : currentInvoices.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No invoices found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtotal</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentInvoices.map((invoice, index) => {
                                        const totalItems = invoice.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                                        
                                        return (
                                            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-gray-900">{indexOfFirstItem + index + 1}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-900">{invoice.branch?.name || 'N/A'}</span>
                                                        {invoice.branch?.city && (
                                                            <div className="text-xs text-gray-400">{invoice.branch.city}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            <span className="text-gray-500"></span> {invoice.customer?.name || 'N/A'}
                                                        </p>
                                                        
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">+91{invoice.customer?.phone || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {invoice.items?.slice(0, 2).map((item, idx) => (
                                                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                {item.service_name || item.product_name}
                                                            </span>
                                                        ))}
                                                        {invoice.items?.length > 2 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{invoice.items.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">{totalItems} items total</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm text-gray-700">₹{invoice.subtotal}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {invoice.discount > 0 ? (
                                                        <div>
                                                            <span className="text-sm text-red-600">-₹{invoice.discount}</span>
                                                            <div className="text-xs text-gray-500">{invoice.discount_type}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-[#dba627]">₹{invoice.total_amount}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getPaymentMethodBadge(invoice.payment_method)}`}>
                                                        {invoice.payment_method?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{formatDate(invoice.created_at)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => fetchInvoiceDetails(invoice.id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                            title="View Details"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePrint(invoice)}
                                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                                            title="Print Invoice"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => sendWhatsApp(invoice)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Send via WhatsApp"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
                            <div className="flex justify-center items-center gap-2 mt-6">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => paginate(index + 1)}
                                        className={`px-3 py-1 rounded ${
                                            currentPage === index + 1
                                                ? 'bg-[#dba627] text-white'
                                                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}