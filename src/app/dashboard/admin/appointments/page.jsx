"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DashboardLayout from "@/app/page";
import axios from "axios";

const API_BASE = "https://saloon.mrshakil.com/api";

// Define the status flow order (pending is the initial/cancellable status)
const STATUS_FLOW = ['pending', 'booked', 'in_progress', 'completed'];
// Only 'pending' status can be cancelled
const CANCELLABLE_STATUSES = ['pending'];

export default function AdminAppointments() {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
    const [statusUpdateData, setStatusUpdateData] = useState({ status: '' });
    const [customerType, setCustomerType] = useState('existing');
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [staff, setStaff] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Form state for creating appointment
    const [formData, setFormData] = useState({
        branch: '',
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
    
    // Admin-specific filters
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
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
        fetchAppointments();
        fetchBranches();
        fetchAllServices();
        fetchAllPackages();
        fetchAllStaff();
        fetchCustomers();
    }, []);

    // Filter services, packages, and staff when branch changes
    useEffect(() => {
        if (formData.branch) {
            // Filter services by selected branch
            const branchServices = services.filter(service => service.branch === parseInt(formData.branch));
            setFilteredServices(branchServices);
            
            // Filter packages by selected branch
            const branchPackages = packages.filter(pkg => pkg.branch === parseInt(formData.branch));
            setFilteredPackages(branchPackages);
            
            // Filter staff by selected branch
            const branchStaff = staff.filter(staffMember => staffMember.branch === parseInt(formData.branch));
            setFilteredStaff(branchStaff);
            
            // Reset selected items when branch changes
            setSelectedServices([]);
            setSelectedPackages([]);
            setServiceInput('');
            setPackageInput('');
            setFormData(prev => ({ ...prev, staff: '' }));
        } else {
            setFilteredServices([]);
            setFilteredPackages([]);
            setFilteredStaff([]);
        }
    }, [formData.branch, services, packages, staff]);

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

    // Apply filters whenever filter criteria or appointments change
    useEffect(() => {
        applyFilters();
        setCurrentPage(1);
    }, [selectedBranchFilter, selectedStatusFilter, dateFilter, searchTerm, appointments]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "superadmin") {
            router.push("/login");
        }
    };

    const applyFilters = () => {
        let filtered = [...appointments];
        
        // Filter by branch
        if (selectedBranchFilter) {
            filtered = filtered.filter(apt => apt.branch === parseInt(selectedBranchFilter));
        }
        
        // Filter by status
        if (selectedStatusFilter) {
            filtered = filtered.filter(apt => apt.status === selectedStatusFilter);
        }
        
        // Filter by date
        if (dateFilter) {
            filtered = filtered.filter(apt => apt.date === dateFilter);
        }
        
        // Search by customer name or phone
        if (searchTerm) {
            filtered = filtered.filter(apt => 
                apt.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.customer_phone?.includes(searchTerm) ||
                apt.id.toString().includes(searchTerm)
            );
        }
        
        setFilteredAppointments(filtered);
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
                    } catch(e) {
                        app.package_details = [];
                    }
                }
                return app;
            });
            
            setAppointments(appointmentsData);
            setFilteredAppointments(appointmentsData);
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
            setServices(response.data.data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchAllPackages = async () => {
        try {
            const response = await axios.get(`${API_BASE}/service/packages/`);
            setPackages(response.data.data || []);
        } catch (error) {
            console.error('Error fetching packages:', error);
        }
    };

    const fetchAllStaff = async () => {
        try {
            const response = await axios.get(`${API_BASE}/staff/bookable/`);
            setStaff(response.data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_BASE}/users/customers/`);
            setCustomers(response.data.data || []);
            setFilteredCustomers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
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

    // Handle cancel appointment - only for 'pending' status
    const handleCancelAppointment = async (appointment) => {
        // Check if status is 'pending'
        if (appointment.status !== 'pending') {
            Swal.fire({
                icon: 'warning',
                title: 'Cannot Cancel',
                text: 'Only pending appointments can be cancelled. Once an appointment is booked, it cannot be cancelled.',
                confirmButtonColor: '#dba627'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Cancel Appointment',
            text: 'Are you sure you want to cancel this pending appointment?',
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
                        text: 'Pending appointment has been cancelled.',
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
        
        if (!formData.branch) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please select a branch',
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
                branch: parseInt(formData.branch),
                customer: parseInt(formData.customer),
                staff: parseInt(formData.staff),
                date: formData.date,
                time: formData.time,
                appointment_type: formData.appointment_type,
                notes: formData.notes,
                total_amount: totalAmount,
                status: 'pending' // Set initial status to pending
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
            // Extract only the phone number without country code for API
            let cleanPhoneNumber = formData.phone;
            // Remove +91 prefix if present
            if (cleanPhoneNumber.startsWith('+91')) {
                cleanPhoneNumber = cleanPhoneNumber.substring(3);
            }
            // Remove any spaces or special characters
            cleanPhoneNumber = cleanPhoneNumber.replace(/[\s-]/g, '');
            
            // Start with base payload for new customer
            payload = {
                branch: parseInt(formData.branch),
                staff: parseInt(formData.staff),
                date: formData.date,
                time: formData.time,
                appointment_type: formData.appointment_type,
                notes: formData.notes,
                phone: cleanPhoneNumber, // Send only the number without country code
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                whatsapp: formData.whatsapp,
                address: formData.address,
                gender: formData.gender,
                total_amount: totalAmount,
                status: 'pending' // Set initial status to pending
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

        try {
            const response = await axios.post(`${API_BASE}/appointment/create-appointment/`, payload);
            
            if (response.data.success || response.status === 201) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Appointment created successfully with PENDING status!',
                    confirmButtonColor: '#dba627',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowCreateForm(false);
                resetForm();
                fetchAppointments();
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create appointment',
                confirmButtonColor: '#dba627'
            });
        } finally {
            setLoading(false);
        }
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
                if (showDetailsModal) {
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
                        confirmButtonColor: '#dba627',
                        timer: 1500,
                        showConfirmButton: false
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
                } catch(e) {
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
            const service = filteredServices.find(s => s.id === parseInt(serviceInput));
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
            const pkg = filteredPackages.find(p => p.id === parseInt(packageInput));
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
            branch: '',
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
        setFilteredServices([]);
        setFilteredPackages([]);
        setFilteredStaff([]);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle phone input - just store the value as is, no auto-formatting
    const handlePhoneChange = (e) => {
        setFormData({
            ...formData,
            phone: e.target.value
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'booked': 'bg-blue-100 text-blue-800',
            'in_progress': 'bg-purple-100 text-purple-800',
            'completed': 'bg-emerald-100 text-emerald-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const openUpdateStatusModal = (appointment) => {
        setSelectedAppointment(appointment);
        setStatusUpdateData({ status: appointment.status });
        setShowUpdateStatusModal(true);
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
            try {
                const response = await axios.put(`${API_BASE}/appointment/update-appointment/${selectedAppointment.id}/`, { notes });
                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Notes updated successfully',
                        confirmButtonColor: '#dba627',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchAppointments();
                    fetchAppointmentDetails(selectedAppointment.id);
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update notes',
                    confirmButtonColor: '#dba627'
                });
            }
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

    // Calculate total amount for display in form
    const calculateTotalAmount = () => {
        let total = 0;
        total += selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
        total += selectedPackages.reduce((sum, pkg) => sum + (pkg.package_price || 0), 0);
        return total;
    };

    // Check if form is valid for submission
    const isFormValid = () => {
        if (!formData.branch) return false;
        const hasServiceOrPackage = selectedServices.length > 0 || selectedPackages.length > 0;
        
        if (customerType === 'existing') {
            return formData.customer && formData.staff && formData.date && formData.time && hasServiceOrPackage;
        } else {
            // Validate phone has at least 10 digits
            const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
            return phoneDigits.length >= 10 && formData.first_name && formData.staff && formData.date && formData.time && hasServiceOrPackage;
        }
    };

    // Statistics for admin dashboard
    const totalAppointments = filteredAppointments.length;
    const completedCount = filteredAppointments.filter(apt => apt.status === 'completed').length;
    const pendingCount = filteredAppointments.filter(apt => apt.status === 'pending' || apt.status === 'booked').length;
    const cancelledCount = filteredAppointments.filter(apt => apt.status === 'cancelled').length;
    const totalRevenue = filteredAppointments.reduce((sum, apt) => sum + parseFloat(apt.total_amount || 0), 0);

    const clearFilters = () => {
        setSelectedBranchFilter('');
        setSelectedStatusFilter('');
        setDateFilter('');
        setSearchTerm('');
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <DashboardLayout>
            <div>
                {/* Header with Create Appointment Button */}
                <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black tracking-tight">
                            Admin <span className="text-[#dba627]">Appointments</span>
                        </h1>
                        <p className="text-gray-500 mt-1">View and manage all appointments across all branches</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateForm(true);
                        }}
                        className="bg-black text-white font-semibold py-2 px-5 cursor-pointer rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Appointment
                    </button>
                </div>

                {/* Create Appointment Form Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            {/* HEADER */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Create New Appointment
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Fill in the details to create a new appointment (Status will be PENDING)
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
                                <form onSubmit={handleCreateAppointment}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Branch Selection - Admin specific */}
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Select Branch *
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
                                                        {branch.name} - {branch.city}
                                                    </option>
                                                ))}
                                            </select>
                                            {!formData.branch && (
                                                <p className="text-xs text-amber-600 mt-1">Please select a branch first to load staff, services, and packages</p>
                                            )}
                                        </div>

                                        {/* Customer Type Selection */}
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                Customer Type *
                                            </label>
                                            <div className="flex gap-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        value="existing"
                                                        checked={customerType === 'existing'}
                                                        onChange={() => setCustomerType('existing')}
                                                        className="w-4 h-4 text-[#dba627] focus:ring-[#dba627]"
                                                    />
                                                    <span className="text-sm text-gray-700">Existing Customer</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        value="new"
                                                        checked={customerType === 'new'}
                                                        onChange={() => setCustomerType('new')}
                                                        className="w-4 h-4 text-[#dba627] focus:ring-[#dba627]"
                                                    />
                                                    <span className="text-sm text-gray-700">New Customer</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Customer Information */}
                                        {customerType === 'existing' ? (
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Search Customer by Mobile Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Search by mobile number..."
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] mb-2"
                                                />
                                                <select
                                                    name="customer"
                                                    value={formData.customer}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                >
                                                    <option value="">Select Customer</option>
                                                    {filteredCustomers && filteredCustomers.map(customer => (
                                                        <option key={customer.id} value={customer.id}>
                                                            {customer.first_name} {customer.last_name} - {customer.phone}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <>
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
                                                            onChange={handlePhoneChange}
                                                            required
                                                            className="w-full h-10 pl-16 pr-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                            placeholder="9876543210"
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
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="Rahul"
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
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="Sharma"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="rahul.sharma@example.com"
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
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="9876543210"
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
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Address
                                                    </label>
                                                    <textarea
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        rows="2"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="Enter customer address"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Appointment Details - Only show if branch is selected */}
                                        {formData.branch && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Staff Member *
                                                    </label>
                                                    <select
                                                        name="staff"
                                                        value={formData.staff}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="">Select Staff</option>
                                                        {filteredStaff && filteredStaff.map(staffMember => (
                                                            <option key={staffMember.id} value={staffMember.id}>
                                                                {staffMember.name || `${staffMember.first_name} ${staffMember.last_name}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {filteredStaff.length === 0 && (
                                                        <p className="text-xs text-amber-600 mt-1">No staff available for this branch</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Appointment Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        value={formData.date}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Appointment Time *
                                                    </label>
                                                    <input
                                                        type="time"
                                                        name="time"
                                                        value={formData.time}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Appointment Type *
                                                    </label>
                                                    <select
                                                        name="appointment_type"
                                                        value={formData.appointment_type}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    >
                                                        <option value="walkin">Walk-in</option>
                                                        <option value="appointment">Appointment</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Additional Notes
                                                    </label>
                                                    <textarea
                                                        name="notes"
                                                        value={formData.notes}
                                                        onChange={handleInputChange}
                                                        rows="2"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        placeholder="Any special requests or notes..."
                                                    />
                                                </div>

                                                {/* Services Selection - Optional */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Services (Optional)
                                                    </label>
                                                    <div className="flex gap-2 mb-3">
                                                        <select
                                                            value={serviceInput}
                                                            onChange={(e) => setServiceInput(e.target.value)}
                                                            className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        >
                                                            <option value="">Select Service</option>
                                                            {filteredServices && filteredServices.map(service => (
                                                                <option key={service.id} value={service.id}>
                                                                    {service.name} - ₹{service.price} ({getDurationMinutes(service.duration)} min)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={addService}
                                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                    
                                                    {selectedServices.length > 0 && (
                                                        <>
                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                                                                <p className="text-xs text-green-700 flex items-center gap-1">
                                                                    <span className="text-sm">✓</span> 
                                                                    {selectedServices.length} service(s) added
                                                                </p>
                                                            </div>
                                                            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4">
                                                                {selectedServices.map((service, index) => (
                                                                    <div key={index} className="p-3 flex justify-between items-center">
                                                                        <div>
                                                                            <span className="text-sm font-medium text-gray-900">{service.service_name}</span>
                                                                            <span className="text-xs text-gray-500 ml-2">
                                                                                ₹{service.price} - {service.duration} min
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeService(index)}
                                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Packages Selection - Optional */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                        Packages (Optional)
                                                    </label>
                                                    <div className="flex gap-2 mb-3">
                                                        <select
                                                            value={packageInput}
                                                            onChange={(e) => setPackageInput(e.target.value)}
                                                            className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                        >
                                                            <option value="">Select Package</option>
                                                            {filteredPackages && filteredPackages.map(pkg => (
                                                                <option key={pkg.id} value={pkg.id}>
                                                                    {pkg.name} - ₹{pkg.package_price} ({pkg.validity_days} days valid)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={addPackage}
                                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                    
                                                    {selectedPackages.length > 0 && (
                                                        <>
                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                                                                <p className="text-xs text-blue-700 flex items-center gap-1">
                                                                    <span className="text-sm">✓</span> 
                                                                    {selectedPackages.length} package(s) added
                                                                </p>
                                                            </div>
                                                            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                                                {selectedPackages.map((pkg, index) => (
                                                                    <div key={index} className="p-3 flex justify-between items-center">
                                                                        <div>
                                                                            <span className="text-sm font-medium text-gray-900">{pkg.package_name}</span>
                                                                            <span className="text-xs text-gray-500 ml-2">
                                                                                Package Price: ₹{pkg.package_price}
                                                                            </span>
                                                                            {pkg.validity_days && (
                                                                                <span className="text-xs text-gray-400 ml-2">
                                                                                    ({pkg.validity_days} days valid)
                                                                                </span>
                                                                            )}
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                Includes: {pkg.services?.length || 0} service(s)
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removePackage(index)}
                                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                    
                                                    {/* Show warning if no service or package selected */}
                                                    {selectedServices.length === 0 && selectedPackages.length === 0 && (
                                                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                                            <p className="text-xs text-yellow-700 flex items-center gap-1">
                                                                <span className="text-sm">⚠️</span> 
                                                                Please add at least one service OR package to create the appointment
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                            </>
                                        )}
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
                                            disabled={loading || !isFormValid()}
                                            className={`px-5 h-10 rounded-lg text-white text-sm font-semibold transition-colors ${
                                                loading || !isFormValid() 
                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                    : 'bg-black hover:bg-gray-800 cursor-pointer'
                                            }`}
                                        >
                                            {loading ? 'Creating...' : 'Create Appointment (Pending)'}
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
                        <p className="text-sm opacity-90">Total Appointments</p>
                        <p className="text-2xl font-bold">{totalAppointments}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Completed</p>
                        <p className="text-2xl font-bold">{completedCount}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Pending</p>
                        <p className="text-2xl font-bold">{pendingCount}</p>
                    </div>
                    <div className="bg-black rounded-xl p-4 text-white shadow-lg">
                        <p className="text-sm opacity-90">Cancelled</p>
                        <p className="text-2xl font-bold">{cancelledCount}</p>
                    </div>
                    <div className="bg-[#dba627] rounded-xl p-4 text-black shadow-lg">
                        <p className="text-sm opacity-90">Revenue</p>
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
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="booked">Booked</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                        
                        <input
                            type="text"
                            placeholder="Search by name, phone or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#dba627]"
                        />
                    </div>
                </div>

                {/* Appointment Details Modal */}
                {showDetailsModal && selectedAppointment && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>
                                    <p className="text-xs text-gray-500 mt-1">View complete appointment information</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedAppointment(null);
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
                                            Appointment ID
                                        </label>
                                        <p className="text-sm font-semibold text-gray-900">#{selectedAppointment.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Status
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedAppointment.status)}`}>
                                                {selectedAppointment.status?.toUpperCase()}
                                            </span>
                                            {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleQuickStatusUpdate(selectedAppointment)}
                                                        className="text-[#dba627] hover:text-black text-xs font-medium px-2 py-1 rounded border border-[#dba627] hover:bg-[#dba627] hover:text-white transition-colors"
                                                        title="Next Status"
                                                    >
                                                        Next →
                                                    </button>
                                                    {selectedAppointment.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleCancelAppointment(selectedAppointment)}
                                                            className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded border border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                                            title="Cancel"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Customer
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedAppointment.customer_name || `ID: ${selectedAppointment.customer}`}</p>
                                        {selectedAppointment.customer_phone && (
                                            <p className="text-xs text-gray-500">{selectedAppointment.customer_phone}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Branch
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedAppointment.branch_name || `ID: ${selectedAppointment.branch}`}</p>
                                        {selectedAppointment.branch_city && (
                                            <p className="text-xs text-gray-500">{selectedAppointment.branch_city}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Staff
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedAppointment.staff_name || `ID: ${selectedAppointment.staff}`}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Date & Time
                                        </label>
                                        <p className="text-sm text-gray-900">{selectedAppointment.date} at {selectedAppointment.time}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Appointment Type
                                        </label>
                                        <p className="text-sm text-gray-900 capitalize">{selectedAppointment.appointment_type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                                            Total Amount
                                        </label>
                                        <p className="text-lg font-bold text-[#dba627]">₹{selectedAppointment.total_amount}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                Notes
                                            </label>
                                            <button
                                                onClick={handleEditNotes}
                                                className="text-[#dba627] hover:text-black text-xs font-medium"
                                            >
                                                Edit Notes
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-700">{selectedAppointment.notes || 'No notes'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                            Packages
                                        </label>
                                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                            {selectedAppointment.package_details && selectedAppointment.package_details.length > 0 ? (
                                                selectedAppointment.package_details.map((pkg, index) => (
                                                    <div key={index} className="p-4 bg-blue-50">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="text-sm font-semibold text-blue-900">{pkg.package_name}</p>
                                                                <p className="text-xs text-blue-700 mt-1">
                                                                    Includes {pkg.services_count} services • Valid for {pkg.validity_days} days
                                                                </p>
                                                            </div>
                                                            <p className="text-lg font-bold text-[#dba627]">₹{pkg.package_price}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-gray-500">
                                                    No packages added
                                                </div>
                                            )}
                                        </div>
                                        
                                        {selectedAppointment.items && selectedAppointment.items.length > 0 && (
                                            <>
                                                <label className="block text-xs font-semibold text-gray-600 mb-2 mt-4 uppercase tracking-wide">
                                                    Individual Services
                                                </label>
                                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                                    {selectedAppointment.items.map((item, index) => (
                                                        <div key={index} className="p-3 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{item.service_name}</p>
                                                                <p className="text-xs text-gray-500">Duration: {item.duration} min</p>
                                                            </div>
                                                            <p className="text-sm font-bold text-[#dba627]">₹{item.price}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                                            <span className="text-sm font-semibold text-gray-900">Total</span>
                                            <span className="text-lg font-bold text-[#dba627]">₹{selectedAppointment.total_amount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedAppointment(null);
                                    }}
                                    className="px-4 h-10 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Update Status Modal (Full Menu) */}
                {showUpdateStatusModal && selectedAppointment && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                        <div className="w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Update Status</h2>
                                    <p className="text-xs text-gray-500 mt-1">Change appointment status</p>
                                </div>
                                <button
                                    onClick={() => setShowUpdateStatusModal(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto px-6 py-5">
                                <form onSubmit={handleUpdateStatus}>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Status *
                                        </label>
                                        <select
                                            value={statusUpdateData.status}
                                            onChange={(e) => setStatusUpdateData({ status: e.target.value })}
                                            required
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="booked">Booked</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowUpdateStatusModal(false)}
                                            className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? 'Updating...' : 'Update Status'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appointments Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No appointments found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
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
                                                } catch(e) {
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
                                                    <span className="text-sm font-semibold text-gray-900">#{appointment.id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700">{appointment.customer_name || `ID: ${appointment.customer}`}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-500">{appointment.customer_phone || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{appointment.date}</div>
                                                    <div className="text-xs text-gray-400">{appointment.time}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="text-sm text-gray-700">{branch?.name || `ID: ${appointment.branch}`}</span>
                                                        {branch?.city && (
                                                            <div className="text-xs text-gray-400">{branch.city}</div>
                                                        )}
                                                    </div>
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
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        currentPage === 1
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
                                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === number
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
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        currentPage === totalPages
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