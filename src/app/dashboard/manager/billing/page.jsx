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

export default function Billing() {
    const router = useRouter();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [billingType, setBillingType] = useState('direct');
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [staff, setStaff] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [branchInfo, setBranchInfo] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        served_by: '',
        payment_method: 'cash',
        discount: '0',
        discount_type: 'flat',
        appointment: '',
        customer_id: '',
        phone: '',
        first_name: '',
        last_name: '',
        email: '',
        whatsapp: '',
        gender: 'male',
        address: '',
    });

    const [currentItem, setCurrentItem] = useState({
        type: 'service',
        id: '',
        quantity: 1
    });

    const [cartItems, setCartItems] = useState([]);
    const [selectedAppointmentData, setSelectedAppointmentData] = useState(null);

    useEffect(() => {
        checkAuth();
        fetchInvoices();
        fetchServices();
        fetchProducts();
        fetchStaff();
        fetchAppointments();
        fetchCustomers();
        fetchBranchInfo();
    }, []);

    // Reset currentItem type when billingType changes
    useEffect(() => {
        if (billingType === 'appointment') {
            setCurrentItem(prev => ({ ...prev, type: 'product', id: '' }));
        } else {
            setCurrentItem(prev => ({ ...prev, type: 'service', id: '' }));
        }
    }, [billingType]);

    // Load appointment items when appointment is selected
    useEffect(() => {
        if (billingType === 'appointment' && formData.appointment) {
            const appointment = appointments.find(app => app.id === parseInt(formData.appointment));
            if (appointment) {
                setSelectedAppointmentData(appointment);
                // Clear cart items when appointment changes
                setCartItems([]);
            }
        } else {
            setSelectedAppointmentData(null);
        }
    }, [formData.appointment, billingType, appointments]);

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

    const fetchBranchInfo = async () => {
        try {
            const data = await apiFetch('/branches/get-all-branches/');
            let branchData = data.data || data.branches || data.results || [];
            if (branchData.length > 0) {
                setBranchInfo(branchData[0]);
            }
        } catch (error) {
            console.error('Error fetching branch info:', error);
        }
    };

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/invoices/get-all-invoices/');
            let invoicesData = data.data || data.invoices || data.results || [];
            setInvoices(invoicesData);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch invoices',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const data = await apiFetch('/service/services/');
            setServices(data.data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await apiFetch('/products/get-all-products/');
            setProducts(data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const data = await apiFetch('/staff/bookable/');
            setStaff(data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchAppointments = async () => {
        try {
            const data = await apiFetch('/appointments/get-all-appointments/?status=completed');
            setAppointments(data.data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const data = await apiFetch('/users/customers/');
            setCustomers(data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        setLoading(true);

        let payload;

        if (billingType === 'appointment') {
            // For appointment billing: ONLY send appointment ID and payment details
            // DO NOT send any service items - backend handles that automatically
            payload = {
                appointment: parseInt(formData.appointment),
                payment_method: formData.payment_method,
                discount: formData.discount,
                discount_type: formData.discount_type,
            };
            
            // ONLY add items array if there are additional products in cart
            if (cartItems.length > 0) {
                payload.items = cartItems.map(item => ({
                    product: parseInt(item.id),
                    quantity: item.quantity
                }));
            }
            // If cartItems is empty, NO 'items' field is sent at all
            
        } else if (billingType === 'new_customer') {
            payload = {
                served_by: parseInt(formData.served_by),
                phone: formData.phone,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                whatsapp: formData.whatsapp,
                gender: formData.gender,
                address: formData.address,
                payment_method: formData.payment_method,
                discount: formData.discount,
                discount_type: formData.discount_type,
                items: cartItems.map(item => ({
                    service: item.type === 'service' ? parseInt(item.id) : undefined,
                    product: item.type === 'product' ? parseInt(item.id) : undefined,
                    quantity: item.quantity
                }))
            };
        } else {
            // direct billing
            payload = {
                customer_id: parseInt(formData.customer_id),
                served_by: parseInt(formData.served_by),
                payment_method: formData.payment_method,
                discount: formData.discount,
                discount_type: formData.discount_type,
                items: cartItems.map(item => ({
                    service: item.type === 'service' ? parseInt(item.id) : undefined,
                    product: item.type === 'product' ? parseInt(item.id) : undefined,
                    quantity: item.quantity
                }))
            };
        }

        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        try {
            const result = await apiFetch('/invoice/create-invoice/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Invoice created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowCreateForm(false);
                resetForm();
                fetchInvoices();
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create invoice',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoiceDetails = async (invoiceId) => {
        setLoading(true);
        try {
            const data = await apiFetch(`/invoice/${invoiceId}/`);
            setSelectedInvoice(data.data);
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

    const addItemToCart = () => {
        if (!currentItem.id) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please select an item',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        // Prevent adding services for appointment billing
        if (billingType === 'appointment' && currentItem.type === 'service') {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Only products can be added for appointment billing!',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        let itemDetails;
        if (currentItem.type === 'service') {
            itemDetails = services.find(s => s.id === parseInt(currentItem.id));
            if (itemDetails) {
                const existingIndex = cartItems.findIndex(item => item.type === 'service' && item.id === itemDetails.id);
                if (existingIndex !== -1) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Duplicate Item',
                        text: 'This service is already in the cart!',
                        confirmButtonColor: '#dba627'
                    });
                    return;
                }
                setCartItems([...cartItems, {
                    type: 'service',
                    id: itemDetails.id,
                    name: itemDetails.name,
                    price: parseFloat(itemDetails.price),
                    quantity: parseInt(currentItem.quantity),
                    total: parseFloat(itemDetails.price) * parseInt(currentItem.quantity)
                }]);
            }
        } else {
            itemDetails = products.find(p => p.id === parseInt(currentItem.id));
            if (itemDetails) {
                const existingIndex = cartItems.findIndex(item => item.type === 'product' && item.id === itemDetails.id);
                if (existingIndex !== -1) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Duplicate Item',
                        text: 'This product is already in the cart!',
                        confirmButtonColor: '#dba627'
                    });
                    return;
                }
                setCartItems([...cartItems, {
                    type: 'product',
                    id: itemDetails.id,
                    name: itemDetails.name,
                    price: parseFloat(itemDetails.selling_price),
                    quantity: parseInt(currentItem.quantity),
                    total: parseFloat(itemDetails.selling_price) * parseInt(currentItem.quantity)
                }]);
            }
        }

        setCurrentItem({ 
            type: billingType === 'appointment' ? 'product' : 'service', 
            id: '', 
            quantity: 1 
        });
    };

    const removeItemFromCart = (index) => {
        const newCart = [...cartItems];
        newCart.splice(index, 1);
        setCartItems(newCart);
    };

    const calculateSubtotal = () => {
        // For appointment billing, only calculate from additional products
        // Backend will add appointment items total
        return cartItems.reduce((sum, item) => sum + item.total, 0);
    };

    const calculateDiscount = (subtotal) => {
        const discount = parseFloat(formData.discount) || 0;
        if (formData.discount_type === 'percent') {
            return (subtotal * discount) / 100;
        }
        return discount;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discount = calculateDiscount(subtotal);
        return subtotal - discount;
    };

    const resetForm = () => {
        setFormData({
            served_by: '',
            payment_method: 'cash',
            discount: '0',
            discount_type: 'flat',
            appointment: '',
            customer_id: '',
            phone: '',
            first_name: '',
            last_name: '',
            email: '',
            whatsapp: '',
            gender: 'male',
            address: '',
        });
        setCartItems([]);
        setSelectedAppointmentData(null);
        setBillingType('direct');
        setCurrentItem({ 
            type: 'service', 
            id: '', 
            quantity: 1 
        });
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getPaymentMethodBadge = (method) => {
        const colors = {
            'cash': 'bg-green-100 text-green-800',
            'online': 'bg-blue-100 text-blue-800',
            'card': 'bg-purple-100 text-purple-800',
        };
        return colors[method] || 'bg-gray-100 text-gray-800';
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
                            ${branchInfo ? `
                                <p>${branchInfo.name}</p>
                                <p>${branchInfo.address}, ${branchInfo.city}</p>
                                <p>Phone: +91${branchInfo.phone || 'N/A'} | Email: ${branchInfo.email || 'N/A'}</p>
                                <p>GST: ${branchInfo.gst_number || 'N/A'}</p>
                            ` : '<p>Your Salon Address Here</p>'}
                        </div>
                    </div>
                    <div class="branch-info">
                        <p><strong>Branch:</strong> ${branchInfo?.name || 'N/A'} | <strong>Location:</strong> ${branchInfo?.city || 'N/A'}</p>
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
                        <p>For any queries, please contact us at ${branchInfo?.phone || 'your salon phone'}</p>
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
                       `📞 *Phone:* ${invoice.customer?.phone}\n` +
                       `💰 *Total Amount:* ₹${invoice.total_amount}\n` +
                       `💳 *Payment Method:* ${invoice.payment_method?.toUpperCase()}\n\n` +
                       `${branchInfo ? `🏪 *Branch:* ${branchInfo.name}\n📍 *Location:* ${branchInfo.city}\n📞 *Branch Phone:* +91${branchInfo.phone || 'N/A'}\n\n` : ''}` +
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

    // Filter and Pagination Logic
    const filteredInvoices = invoices.filter(invoice => 
        invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id?.toString().includes(searchTerm) ||
        invoice.customer?.phone?.includes(searchTerm)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <DashboardLayout>
            <div className="px-2">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Billing & <span className="text-[#dba627]">Invoices</span>
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Manage all invoices and billing
                        </p>
                    </div>

                    {/* Create Invoice Button */}
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateForm(true);
                        }}
                        className="bg-black text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Invoice
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by invoice ID, customer name, or phone..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dba627]"
                    />
                </div>

                {/* Create Invoice Form Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Create New Invoice
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Fill in the details to create a new invoice
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        resetForm();
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* BODY */}
                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleCreateInvoice}>
                                    {/* Billing Type Selection */}
                                    <div className="mb-6">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Billing Type *
                                        </label>
                                        <div className="flex gap-6 flex-wrap">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value="direct"
                                                    checked={billingType === 'direct'}
                                                    onChange={() => setBillingType('direct')}
                                                    className="w-4 h-4 text-[#dba627] focus:ring-[#dba627]"
                                                />
                                                <span className="text-sm text-gray-700">Existing Customer</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value="new_customer"
                                                    checked={billingType === 'new_customer'}
                                                    onChange={() => setBillingType('new_customer')}
                                                    className="w-4 h-4 text-[#dba627] focus:ring-[#dba627]"
                                                />
                                                <span className="text-sm text-gray-700">New Customer</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value="appointment"
                                                    checked={billingType === 'appointment'}
                                                    onChange={() => setBillingType('appointment')}
                                                    className="w-4 h-4 text-[#dba627] focus:ring-[#dba627]"
                                                />
                                                <span className="text-sm text-gray-700">From Appointment</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Left Column - Customer & Invoice Details */}
                                        <div className="space-y-5">
                                            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Invoice Details</h3>

                                            {billingType === 'appointment' ? (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Completed Appointment *
                                                    </label>
                                                    <select
                                                        name="appointment"
                                                        value={formData.appointment}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Appointment</option>
                                                        {appointments.map(app => (
                                                            <option key={app.id} value={app.id}>
                                                                #{app.id} - {app.customer_name} - {app.date} (Items: {app.items?.length || 0})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {selectedAppointmentData && (
                                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                            <p className="text-xs font-semibold text-blue-800 mb-2">Appointment Items (Auto-included):</p>
                                                            {selectedAppointmentData.items?.map((item, idx) => (
                                                                <div key={idx} className="text-xs text-gray-700 flex justify-between">
                                                                    <span>{item.service_name}</span>
                                                                    <span>₹{item.price}</span>
                                                                </div>
                                                            ))}
                                                            <div className="mt-2 pt-2 border-t border-blue-200 text-xs font-semibold text-blue-800 flex justify-between">
                                                                <span>Appointment Total:</span>
                                                                <span>₹{selectedAppointmentData.items?.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-2 italic">
                                                                Note: Service lines come from the appointment automatically. Add only extra products manually if needed.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Staff (Served By) *
                                                    </label>
                                                    <select
                                                        name="served_by"
                                                        value={formData.served_by}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Staff Member</option>
                                                        {staff.map(member => (
                                                            <option key={member.id} value={member.id}>
                                                                {member.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {billingType === 'direct' && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Select Customer *
                                                    </label>
                                                    <select
                                                        name="customer_id"
                                                        value={formData.customer_id}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Customer</option>
                                                        {customers.map(customer => (
                                                            <option key={customer.id} value={customer.id}>
                                                                {customer.first_name} {customer.last_name} - {customer.phone}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {billingType === 'new_customer' && (
                                                <>
                                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mt-4">Customer Information</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                Phone Number *
                                                            </label>
                                                            <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                            <span className="text-gray-500 text-sm flex items-center gap-1">
                                                                <span className="text-base">🇮🇳</span>
                                                                <span>+91</span>
                                                            </span>
                                                        </div>
                                                            <input
                                                                type="tel"
                                                                name="phone"
                                                                value={formData.phone}
                                                                onChange={handleInputChange}
                                                                required
                                                                placeholder="9876543210"
                                                                className="w-full h-10 pl-16 pr-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                First Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="first_name"
                                                                value={formData.first_name}
                                                                onChange={handleInputChange}
                                                                required
                                                                placeholder="Enter first name"
                                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                Last Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="last_name"
                                                                value={formData.last_name}
                                                                onChange={handleInputChange}
                                                                placeholder="Enter last name"
                                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                Email ID
                                                            </label>
                                                            <input
                                                                type="email"
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                                placeholder="customer@example.com"
                                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                WhatsApp Number
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                name="whatsapp"
                                                                value={formData.whatsapp}
                                                                onChange={handleInputChange}
                                                                placeholder="e.g., 9876543210"
                                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                Gender
                                                            </label>
                                                            <select
                                                                name="gender"
                                                                value={formData.gender}
                                                                onChange={handleInputChange}
                                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            >
                                                                <option value="male">Male</option>
                                                                <option value="female">Female</option>
                                                                <option value="other">Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                Complete Address
                                                            </label>
                                                            <textarea
                                                                name="address"
                                                                value={formData.address}
                                                                onChange={handleInputChange}
                                                                rows="2"
                                                                placeholder="Enter full address with city, state, pincode"
                                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Payment Method *
                                                    </label>
                                                    <select
                                                        name="payment_method"
                                                        value={formData.payment_method}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="cash">Cash</option>
                                                        <option value="online">Online</option>
                                                        <option value="card">Card</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Discount Type
                                                    </label>
                                                    <select
                                                        name="discount_type"
                                                        value={formData.discount_type}
                                                        onChange={handleInputChange}
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="flat">Flat (₹)</option>
                                                        <option value="percent">Percentage (%)</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Discount Amount
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="discount"
                                                        value={formData.discount}
                                                        onChange={handleInputChange}
                                                        step="0.01"
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="Enter discount amount"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column - Cart Items */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                                                {billingType === 'appointment' ? 'Additional Products (Optional)' : 'Items'}
                                            </h3>

                                            {/* Add Item - Optional for appointment billing */}
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                <div className="grid grid-cols-2 gap-3">
                                                    {billingType !== 'appointment' && (
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                Item Type
                                                            </label>
                                                            <select
                                                                value={currentItem.type}
                                                                onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value, id: '' })}
                                                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            >
                                                                <option value="service">Service</option>
                                                                <option value="product">Product</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                    
                                                    {billingType === 'appointment' && (
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                                Item Type
                                                            </label>
                                                            <div className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-gray-100 text-sm text-gray-600 flex items-center">
                                                                Product Only (Optional)
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Quantity
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={currentItem.quantity}
                                                            onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                                            min="1"
                                                            placeholder="Enter quantity"
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        />
                                                    </div>
                                                    <div className={billingType === 'appointment' ? "col-span-2" : "col-span-2"}>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                            Select {billingType === 'appointment' ? 'Product' : (currentItem.type === 'service' ? 'Service' : 'Product')} {billingType === 'appointment' && '(Optional)'}
                                                        </label>
                                                        <select
                                                            value={currentItem.id}
                                                            onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value })}
                                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        >
                                                            <option value="">
                                                                Select {billingType === 'appointment' ? 'Product' : (currentItem.type === 'service' ? 'Service' : 'Product')}
                                                            </option>
                                                            {billingType === 'appointment' ? (
                                                                products.map(item => (
                                                                    <option key={item.id} value={item.id}>
                                                                        {item.name} - ₹{item.selling_price} (Stock: {item.stock_qty})
                                                                    </option>
                                                                ))
                                                            ) : (
                                                                currentItem.type === 'service'
                                                                    ? services.map(item => (
                                                                        <option key={item.id} value={item.id}>
                                                                            {item.name} - ₹{item.price}
                                                                        </option>
                                                                    ))
                                                                    : products.map(item => (
                                                                        <option key={item.id} value={item.id}>
                                                                            {item.name} - ₹{item.selling_price} (Stock: {item.stock_qty})
                                                                        </option>
                                                                    ))
                                                            )}
                                                        </select>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addItemToCart}
                                                    className="mt-3 w-full h-10 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                                                >
                                                    Add to Cart
                                                </button>
                                                {billingType === 'appointment' && (
                                                    <p className="text-xs text-gray-500 mt-2 text-center italic">
                                                        Note: When billing an appointment, service lines come from the appointment automatically. Add only extra products manually.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Cart Items List - Only for additional products in appointment billing */}
                                            {cartItems.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                                        {billingType === 'appointment' ? 'Additional Products' : 'Cart Items'}
                                                    </h4>
                                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                                        {cartItems.map((item, index) => (
                                                            <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        ₹{item.price} x {item.quantity} = ₹{item.total}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItemFromCart(index)}
                                                                    className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cart Summary */}
                                            {(cartItems.length > 0 || (billingType === 'appointment' && selectedAppointmentData)) && (
                                                <div className="mt-4 pt-3 border-t border-gray-200">
                                                    {billingType === 'appointment' && selectedAppointmentData && (
                                                        <div className="mb-3">
                                                            <div className="flex justify-between mb-2 text-sm">
                                                                <span className="text-gray-600">Appointment Items:</span>
                                                                <span className="font-semibold text-gray-900">₹{selectedAppointmentData.items?.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)}</span>
                                                            </div>
                                                            {cartItems.length > 0 && (
                                                                <div className="flex justify-between mb-2 text-sm">
                                                                    <span className="text-gray-600">Additional Products:</span>
                                                                    <span className="font-semibold text-gray-900">₹{cartItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-sm text-gray-600">Subtotal:</span>
                                                        <span className="font-semibold text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
                                                    </div>
                                                    {parseFloat(formData.discount) > 0 && (
                                                        <div className="flex justify-between mb-2 text-red-600">
                                                            <span className="text-sm">Discount ({formData.discount_type === 'percent' ? `${formData.discount}%` : '₹'}):</span>
                                                            <span>- ₹{calculateDiscount(calculateSubtotal()).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                                                        <span>Total:</span>
                                                        <span className="text-[#dba627]">₹{calculateTotal().toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* FOOTER */}
                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                resetForm();
                                            }}
                                            className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || (billingType !== 'appointment' && cartItems.length === 0)}
                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? 'Creating...' : 'Create Invoice'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice Details Modal */}
                {showDetailsModal && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Invoice Details
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        View complete invoice information
                                    </p>
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

                            {/* BODY */}
                            <div className="overflow-y-auto px-6 py-5">
                                <div className="space-y-5">
                                    {/* Branch Info Banner */}
                                    {branchInfo && (
                                        <div className="bg-gradient-to-r from-[#dba627]/10 to-transparent p-4 rounded-lg border border-[#dba627]/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-[#dba627]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                <h3 className="font-semibold text-gray-800">Devine Salon - {branchInfo.name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-600">{branchInfo.address}, {branchInfo.city}</p>
                                            <p className="text-xs text-gray-500 mt-1">Phone: +91{branchInfo.phone || 'N/A'} | GST: {branchInfo.gst_number || 'N/A'}</p>
                                        </div>
                                    )}

                                    {/* Invoice Header */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                    Invoice ID
                                                </label>
                                                <p className="text-sm font-bold text-gray-900">#{selectedInvoice.id}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                    Date
                                                </label>
                                                <p className="text-sm text-gray-900">{formatDate(selectedInvoice.created_at)}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                    Payment Method
                                                </label>
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getPaymentMethodBadge(selectedInvoice.payment_method)}`}>
                                                    {selectedInvoice.payment_method?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                    Served By
                                                </label>
                                                <p className="text-sm text-gray-900">{selectedInvoice.served_by?.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="grid grid-cols-1 gap-5">
                                        <div className="border border-gray-200 p-4 rounded-lg">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Customer Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        <span className="text-gray-500">Name:</span> {selectedInvoice.customer?.name}
                                                    </p>
                                                    <p className="text-sm text-gray-700">
                                                        <span className="text-gray-500">Phone:</span> +91{selectedInvoice.customer?.phone}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        <span className="text-gray-500">Email:</span> {selectedInvoice.customer?.email || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Items</h3>
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedInvoice.items?.map((item) => (
                                                        <tr key={item.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900">{item.service_name || item.product_name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">{item.item_type}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700 text-right">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700 text-right">₹{item.price}</td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{item.total}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Subtotal:</td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">₹{selectedInvoice.subtotal}</td>
                                                    </tr>
                                                    {parseFloat(selectedInvoice.discount) > 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                                                                Discount ({selectedInvoice.discount_type === 'percent' ? `${selectedInvoice.discount}%` : '₹'}):
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">- ₹{selectedInvoice.discount}</td>
                                                        </tr>
                                                    )}
                                                    <tr className="border-t-2 border-gray-300">
                                                        <td colSpan="4" className="px-4 py-3 text-right text-base font-bold text-gray-900">Total:</td>
                                                        <td className="px-4 py-3 text-right text-base font-bold text-[#dba627]">₹{selectedInvoice.total_amount}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER */}
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
                {loading && !showCreateForm ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : currentInvoices.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No invoices found. Click Create Invoice to create one.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentInvoices.map((invoice, index) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-900">{indexOfFirstItem + index + 1}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        <span className="text-gray-500">Name:</span> {invoice.customer?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        <span className="text-gray-400">Phone:</span> +91{invoice.customer?.phone}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{formatDate(invoice.created_at)}</span>
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
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getPaymentMethodBadge(invoice.payment_method)}`}>
                                                    {invoice.payment_method?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-[#dba627]">₹{invoice.total_amount}</span>
                                                {parseFloat(invoice.discount) > 0 && (
                                                    <div className="text-xs text-green-600">-{invoice.discount}{invoice.discount_type === 'percent' ? '%' : ' ₹'}</div>
                                                )}
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
                                    ))}
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