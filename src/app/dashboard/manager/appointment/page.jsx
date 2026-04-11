
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";
import axios from "axios";

const API_BASE = "https://saloon.mrshakil.com/api";

// Define the status flow order
const STATUS_FLOW = ['booked', 'approved', 'in_progress', 'completed'];
const CANCELLABLE_STATUSES = ['booked', 'approved', 'in_progress'];

export default function Appointments() {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
    const [statusUpdateData, setStatusUpdateData] = useState({ status: '' });
    const [customerType, setCustomerType] = useState('existing');
    const [services, setServices] = useState([]);
    const [packages, setPackages] = useState([]);
    const [staff, setStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [formData, setFormData] = useState({
        customer: '',
        phone: '',
        first_name: '',
        last_name: '',
        email: '',
        whatsapp: '',
        address: '',
        gender: 'male',
        staff: '',
        date: '',
        time: '',
        appointment_type: 'walkin',
        notes: '',
        items: []
    });
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [serviceInput, setServiceInput] = useState('');
    const [packageInput, setPackageInput] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Axios interceptor for auth token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        }
    }, []);

    useEffect(() => {
        checkAuth();
        fetchAppointments();
        fetchServices();
        fetchPackages();
        fetchStaff();
        fetchBranches();
        fetchCustomers();
    }, []);

    // Filter customers based on search
    useEffect(() => {
        if (customerSearch) {
            const filtered = customers.filter(customer =>
                customer.phone && customer.phone.includes(customerSearch)
            );
            setFilteredCustomers(filtered);
        } else {
            setFilteredCustomers(customers);
        }
    }, [customerSearch, customers]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "manager") {
            router.push("/login");
        }
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/appointments/get-all-appointments/`);
            let appointmentsData = response.data.data || response.data.appointments || response.data.results || [];

            // Parse package_details if stored as string
            appointmentsData = appointmentsData.map(app => {
                if (app.package_details && typeof app.package_details === 'string') {
                    try {
                        app.package_details = JSON.parse(app.package_details);
                    } catch (e) {
                        app.package_details = [];
                    }
                }
                return app;
            });

            setAppointments(appointmentsData);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch appointments',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await axios.get(`${API_BASE}/service/services/`);
            setServices(response.data.data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchPackages = async () => {
        try {
            const response = await axios.get(`${API_BASE}/service/packages/`);
            setPackages(response.data.data || []);
        } catch (error) {
            console.error('Error fetching packages:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await axios.get(`${API_BASE}/staff/bookable/`);
            setStaff(response.data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
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

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_BASE}/users/customers/`);
            console.log("Customers fetched:", response.data);
            setCustomers(response.data.data || []);
            setFilteredCustomers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();

        // Check if at least one service OR package is selected
        if (selectedServices.length === 0 && selectedPackages.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please add at least one service or package to the appointment',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        setLoading(true);

        let payload;

        // Calculate total amount
        let servicesTotal = 0;
        for (const service of selectedServices) {
            servicesTotal += service.price || 0;
        }

        let packagesTotal = 0;
        for (const pkg of selectedPackages) {
            packagesTotal += pkg.package_price || 0;
        }

        const totalAmount = servicesTotal + packagesTotal;

        // Prepare package details
        const packageDetailsArray = selectedPackages.map(pkg => ({
            package_id: pkg.packageId,
            package_name: pkg.package_name,
            package_price: pkg.package_price,
            validity_days: pkg.validity_days,
            services_count: pkg.services?.length || 0
        }));

        if (customerType === 'existing') {
            // Start with base payload
            payload = {
                customer: parseInt(formData.customer),
                staff: parseInt(formData.staff),
                date: formData.date,
                time: formData.time,
                appointment_type: formData.appointment_type,
                notes: formData.notes,
                total_amount: totalAmount
            };

            // Add package_details if there are packages
            if (selectedPackages.length > 0) {
                payload.package_details = JSON.stringify(packageDetailsArray);

                // If there's exactly ONE package, also send as "package" field
                if (selectedPackages.length === 1) {
                    payload.package = selectedPackages[0].packageId;
                }
            }

            // Add items if there are selected services
            if (selectedServices.length > 0) {
                payload.items = selectedServices.map(item => ({
                    service: parseInt(item.service)
                }));
            }
        } else {
            // Start with base payload for new customer
            payload = {
                staff: parseInt(formData.staff),
                date: formData.date,
                time: formData.time,
                appointment_type: formData.appointment_type,
                notes: formData.notes,
                phone: formData.phone,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                whatsapp: formData.whatsapp,
                address: formData.address,
                gender: formData.gender,
                total_amount: totalAmount
            };

            // Add package_details if there are packages
            if (selectedPackages.length > 0) {
                payload.package_details = JSON.stringify(packageDetailsArray);

                // If there's exactly ONE package, also send as "package" field
                if (selectedPackages.length === 1) {
                    payload.package = selectedPackages[0].packageId;
                }
            }

            // Add items if there are selected services
            if (selectedServices.length > 0) {
                payload.items = selectedServices.map(item => ({
                    service: parseInt(item.service)
                }));
            }
        }

        console.log("Sending payload:", payload);
        console.log("Total Amount:", totalAmount);
        console.log("Services Total:", servicesTotal);
        console.log("Packages Total:", packagesTotal);

        try {
            const response = await axios.post(`${API_BASE}/appointment/create-appointment/`, payload);

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Appointment created successfully!',
                    confirmButtonColor: '#dba627'
                });
                setShowCreateForm(false);
                resetForm();
                fetchAppointments();
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            console.error('Error response:', error.response?.data);

            let errorMessage = 'Failed to create appointment';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (typeof error.response?.data === 'object') {
                errorMessage = JSON.stringify(error.response.data);
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

    // Get next status in flow
    const getNextStatus = (currentStatus) => {
        const currentIndex = STATUS_FLOW.indexOf(currentStatus);
        if (currentIndex !== -1 && currentIndex < STATUS_FLOW.length - 1) {
            return STATUS_FLOW[currentIndex + 1];
        }
        return null;
    };

    // Get previous status
    const getPreviousStatus = (currentStatus) => {
        const currentIndex = STATUS_FLOW.indexOf(currentStatus);
        if (currentIndex > 0) {
            return STATUS_FLOW[currentIndex - 1];
        }
        return null;
    };

    // Sequential status update handler
    const handleSequentialUpdate = async (appointment, targetStatus) => {
        setLoading(true);
        try {
            const response = await axios.put(`${API_BASE}/appointment/${appointment.id}/update-status/`, { status: targetStatus });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated!',
                    text: `Appointment status changed to ${targetStatus.toUpperCase()}`,
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });

                await fetchAppointments();
                if (showDetailsModal && selectedAppointment?.id === appointment.id) {
                    await fetchAppointmentDetails(appointment.id);
                }

                if (targetStatus !== 'completed' && getNextStatus(targetStatus)) {
                    const nextStatus = getNextStatus(targetStatus);
                    const result = await Swal.fire({
                        title: 'Next Action',
                        text: `Do you want to move to ${nextStatus.toUpperCase()}?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, Next',
                        cancelButtonText: 'No, Stay Here',
                        confirmButtonColor: '#dba627',
                        cancelButtonColor: '#333'
                    });

                    if (result.isConfirmed) {
                        await handleSequentialUpdate(appointment, nextStatus);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update status',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel appointment
    const handleCancelAppointment = async (appointment) => {
        const result = await Swal.fire({
            title: 'Cancel Appointment',
            text: 'Are you sure you want to cancel this appointment?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Cancel',
            cancelButtonText: 'No, Go Back',
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const response = await axios.put(`${API_BASE}/appointment/${appointment.id}/update-status/`, { status: 'cancelled' });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancelled!',
                        text: 'Appointment has been cancelled.',
                        confirmButtonColor: '#dba627',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    await fetchAppointments();
                    if (showDetailsModal && selectedAppointment?.id === appointment.id) {
                        setShowDetailsModal(false);
                        setSelectedAppointment(null);
                    }
                }
            } catch (error) {
                console.error('Error cancelling appointment:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to cancel appointment',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    // Quick status update with one click
    const handleQuickStatusUpdate = async (appointment) => {
        const nextStatus = getNextStatus(appointment.status);

        if (nextStatus) {
            await handleSequentialUpdate(appointment, nextStatus);
        } else if (appointment.status === 'completed') {
            Swal.fire({
                icon: 'info',
                title: 'Already Completed',
                text: 'This appointment is already completed.',
                confirmButtonColor: '#dba627'
            });
        } else {
            openUpdateStatusModal(appointment);
        }
    };

    const handleUpdateAppointment = async (updateData) => {
        setLoading(true);
        try {
            const response = await axios.put(`${API_BASE}/appointment/update-appointment/${selectedAppointment.id}/`, updateData);

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Appointment updated successfully!',
                    confirmButtonColor: '#dba627'
                });
                fetchAppointments();
                fetchAppointmentDetails(selectedAppointment.id);
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update appointment',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
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
                const response = await axios.delete(`${API_BASE}/appointment/delete-appointment/${appointmentId}/`);

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Appointment has been deleted.',
                        confirmButtonColor: '#dba627'
                    });
                    fetchAppointments();
                }
            } catch (error) {
                console.error('Error deleting appointment:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to delete appointment',
                    confirmButtonColor: '#dba627'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchAppointmentDetails = async (appointmentId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/appointment/${appointmentId}/`);
            let appointmentData = response.data.data;

            // Parse package_details if stored as string
            if (appointmentData.package_details && typeof appointmentData.package_details === 'string') {
                try {
                    appointmentData.package_details = JSON.parse(appointmentData.package_details);
                } catch (e) {
                    appointmentData.package_details = [];
                }
            }

            setSelectedAppointment(appointmentData);
            setShowDetailsModal(true);
        } catch (error) {
            console.error('Error fetching appointment details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch appointment details',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const addService = () => {
        if (serviceInput) {
            const service = services.find(s => s.id === parseInt(serviceInput));
            if (service) {
                if (selectedServices.some(s => s.service === service.id)) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Duplicate Service',
                        text: 'This service has already been added',
                        confirmButtonColor: '#dba627'
                    });
                    return;
                }

                const newService = {
                    service: service.id,
                    service_name: service.name,
                    duration: service.duration || 0,
                    price: service.price
                };

                setSelectedServices([...selectedServices, newService]);
                setServiceInput('');
            }
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'No Service Selected',
                text: 'Please select a service from the dropdown',
                confirmButtonColor: '#dba627'
            });
        }
    };

    const addPackage = () => {
        if (packageInput) {
            const pkg = packages.find(p => p.id === parseInt(packageInput));
            if (pkg) {
                if (selectedPackages.some(p => p.packageId === pkg.id)) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Duplicate Package',
                        text: 'This package has already been added',
                        confirmButtonColor: '#dba627'
                    });
                    return;
                }

                const newPackage = {
                    packageId: pkg.id,
                    package_name: pkg.name,
                    package_price: pkg.package_price,
                    validity_days: pkg.validity_days,
                    services: pkg.services
                };

                setSelectedPackages([...selectedPackages, newPackage]);
                setPackageInput('');
            }
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'No Package Selected',
                text: 'Please select a package from the dropdown',
                confirmButtonColor: '#dba627'
            });
        }
    };

    const removeService = (indexToRemove) => {
        setSelectedServices(selectedServices.filter((_, index) => index !== indexToRemove));
    };

    const removePackage = (indexToRemove) => {
        setSelectedPackages(selectedPackages.filter((_, index) => index !== indexToRemove));
    };

    const resetForm = () => {
        setFormData({
            customer: '',
            phone: '',
            first_name: '',
            last_name: '',
            email: '',
            whatsapp: '',
            address: '',
            gender: 'male',
            staff: '',
            date: '',
            time: '',
            appointment_type: 'walkin',
            notes: '',
            items: []
        });
        setSelectedServices([]);
        setSelectedPackages([]);
        setCustomerType('existing');
        setServiceInput('');
        setPackageInput('');
        setCustomerSearch('');
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'booked': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-blue-100 text-blue-800',
            'in_progress': 'bg-purple-100 text-purple-800',
            'completed': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const openUpdateStatusModal = (appointment) => {
        setSelectedAppointment(appointment);
        setStatusUpdateData({ status: appointment.status });
        setShowUpdateStatusModal(true);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.put(`${API_BASE}/appointment/${selectedAppointment.id}/update-status/`, statusUpdateData);

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Appointment status updated successfully!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowUpdateStatusModal(false);
                fetchAppointments();
                if (showDetailsModal && selectedAppointment?.id === selectedAppointment.id) {
                    fetchAppointmentDetails(selectedAppointment.id);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update status',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditNotes = async () => {
        const { value: notes } = await Swal.fire({
            title: 'Edit Notes',
            input: 'textarea',
            inputLabel: 'Appointment Notes',
            inputValue: selectedAppointment.notes || '',
            showCancelButton: true,
            confirmButtonColor: '#dba627',
            cancelButtonColor: '#333',
            confirmButtonText: 'Update'
        });

        if (notes !== undefined) {
            await handleUpdateAppointment({ notes });
        }
    };

    const getDurationMinutes = (duration) => {
        if (!duration) return 0;
        if (typeof duration === 'number') return duration;
        if (typeof duration === 'string') {
            const parsed = parseInt(duration);
            if (!isNaN(parsed)) return parsed;
        }
        return 0;
    };

    const isFormValid = () => {
        // Check if at least one service OR package is selected
        const hasServiceOrPackage = selectedServices.length > 0 || selectedPackages.length > 0;

        if (customerType === 'existing') {
            return formData.customer && formData.staff && formData.date && formData.time && hasServiceOrPackage;
        } else {
            return formData.phone && formData.first_name && formData.staff && formData.date && formData.time && hasServiceOrPackage;
        }
    };

    // Calculate total amount for display in form
    const calculateTotalAmount = () => {
        let total = 0;
        total += selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
        total += selectedPackages.reduce((sum, pkg) => sum + (pkg.package_price || 0), 0);
        return total;
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAppointments = appointments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(appointments.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <DashboardLayout>
            <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Appointment <span className="text-[#dba627]">Management</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Manage all appointments</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateForm(true);
                        }}
                        className="bg-black text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Appointment
                    </button>
                </div>

                {/* Create Appointment Form Modal - Keep as is */}
                {showCreateForm && (
                    // ... (your existing create form modal code)
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        {/* ... rest of your create form modal ... */}
                    </div>
                )}

                {/* Appointment Details Modal - Keep as is */}
                {showDetailsModal && selectedAppointment && (
                    // ... (your existing details modal code)
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        {/* ... rest of your details modal ... */}
                    </div>
                )}

                {/* Update Status Modal - Keep as is */}
                {showUpdateStatusModal && selectedAppointment && (
                    // ... (your existing update status modal code)
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        {/* ... rest of your update status modal ... */}
                    </div>
                )}

                {/* Appointments Table */}
                {loading && !showCreateForm ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No appointments found. Click Create Appointment to add one.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Packages</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentAppointments.map((appointment, index) => {
                                        const branch = branches.find(b => b.id === appointment.branch);
                                        const nextStatus = getNextStatus(appointment.status);
                                        const canCancel = CANCELLABLE_STATUSES.includes(appointment.status);
                                        const serialNumber = indexOfFirstItem + index + 1;

                                        // Handle packages - check both package_details and package field
                                        let packagesList = [];

                                        // Check if there's a package from the 'package' field (single package)
                                        if (appointment.package && appointment.package !== null && appointment.package_name) {
                                            packagesList.push(appointment.package_name);
                                        }

                                        // Check if there are package_details (multiple packages)
                                        if (appointment.package_details) {
                                            if (typeof appointment.package_details === 'string') {
                                                try {
                                                    const parsed = JSON.parse(appointment.package_details);
                                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                                        packagesList = [...packagesList, ...parsed.map(pkg => pkg.package_name)];
                                                    }
                                                } catch (e) {
                                                    console.error('Error parsing package_details:', e);
                                                }
                                            } else if (Array.isArray(appointment.package_details) && appointment.package_details.length > 0) {
                                                packagesList = [...packagesList, ...appointment.package_details.map(pkg => pkg.package_name)];
                                            }
                                        }

                                        // Get services list (only names)
                                        let servicesList = (appointment.items || []).map(item => item.service_name);

                                        return (
                                            <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">{serialNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{appointment.customer_name || `ID: ${appointment.customer}`}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{appointment.date}</div>
                                                    <div className="text-xs text-gray-400">{appointment.time}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{branch?.name || `ID: ${appointment.branch}`}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {packagesList.length > 0 ? (
                                                            packagesList.map((pkgName, idx) => (
                                                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                    {pkgName}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {servicesList.length > 0 ? (
                                                            servicesList.slice(0, 2).map((serviceName, idx) => (
                                                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                    {serviceName}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                        {servicesList.length > 2 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{servicesList.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-[#dba627]">₹{appointment.total_amount}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                                                        {appointment.status?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => fetchAppointmentDetails(appointment.id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                                            <>
                                                                {nextStatus && (
                                                                    <button
                                                                        onClick={() => handleQuickStatusUpdate(appointment)}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                        title={`Move to ${nextStatus.toUpperCase()}`}
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                                {canCancel && (
                                                                    <button
                                                                        onClick={() => handleCancelAppointment(appointment)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Cancel"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteAppointment(appointment.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        )}
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
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                                        }`}
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            onClick={() => paginate(number)}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === number
                                                    ? 'bg-[#dba627] text-white'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                                                }`}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                                        }`}
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