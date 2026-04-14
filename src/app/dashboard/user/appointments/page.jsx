"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";
import DashboardLayout from "@/app/page";

const API_BASE = "https://saloon.mrshakil.com/api";

export default function CreateAppointment() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [packages, setPackages] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [serviceInput, setServiceInput] = useState("");
    const [appointments, setAppointments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Package selection state
    const [selectedPackage, setSelectedPackage] = useState("");
    const [packageServices, setPackageServices] = useState([]);

    // Branch status states
    const [selectedBranchStatus, setSelectedBranchStatus] = useState(null);
    const [isBranchActive, setIsBranchActive] = useState(true);
    const [branchInactiveReason, setBranchInactiveReason] = useState("");
    const [branchSchedule, setBranchSchedule] = useState(null);

    // Available time slots for selected date
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
    const [isBranchClosedOnSelectedDate, setIsBranchClosedOnSelectedDate] = useState(false);
    const [existingAppointments, setExistingAppointments] = useState([]);

    const [formData, setFormData] = useState({
        branch: "",
        staff: "",
        date: "",
        time: "",
        appointment_type: "appointment",
        notes: "",
    });

    // Axios interceptor for auth token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Token ${token}`;
        }
        checkAuth();
        fetchBranches();
        fetchAppointments();
    }, []);

    // Fetch staff when branch changes and check branch status
    useEffect(() => {
        if (formData.branch) {
            checkBranchStatus(formData.branch);
            fetchStaff(formData.branch);
            fetchServices(formData.branch);
            fetchPackages(formData.branch);
            fetchExistingAppointments(formData.branch);
            setFormData(prev => ({ ...prev, staff: "", time: "" }));
            setSelectedServices([]);
            setServiceInput("");
            setSelectedPackage("");
            setPackageServices([]);
            setAvailableTimeSlots([]);
            setIsBranchClosedOnSelectedDate(false);
        } else {
            setStaff([]);
            setServices([]);
            setPackages([]);
            setSelectedBranchStatus(null);
            setIsBranchActive(true);
            setBranchInactiveReason("");
            setBranchSchedule(null);
            setAvailableTimeSlots([]);
            setIsBranchClosedOnSelectedDate(false);
            setExistingAppointments([]);
        }
    }, [formData.branch]);

    // Check branch opening status when date changes
    useEffect(() => {
        if (formData.branch && formData.date && selectedBranchStatus) {
            checkBranchOpenOnDate();
        }
    }, [formData.date, selectedBranchStatus]);

    // Fetch available time slots when branch, staff, and date change
    useEffect(() => {
        if (formData.branch && formData.staff && formData.date && isBranchActive && !isBranchClosedOnSelectedDate && selectedBranchStatus) {
            generateAvailableTimeSlots();
        } else {
            setAvailableTimeSlots([]);
        }
    }, [formData.branch, formData.staff, formData.date, isBranchActive, isBranchClosedOnSelectedDate, selectedBranchStatus, existingAppointments]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "customer") {
            router.push("/login");
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await axios.get(`${API_BASE}/appointments/get-all-appointments/`);
            const appointmentsData = response.data.data || [];
            setAppointments(appointmentsData);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    const fetchExistingAppointments = async (branchId) => {
        try {
            // Fetch appointments for this branch
            const response = await axios.get(`${API_BASE}/appointments/get-all-appointments/?branch=${branchId}`);
            const appointmentsData = response.data.data || [];
            setExistingAppointments(appointmentsData);
        } catch (error) {
            console.error("Error fetching existing appointments:", error);
            setExistingAppointments([]);
        }
    };

    const fetchServices = async (branchId) => {
        try {
            let url = `${API_BASE}/service/services/`;
            if (branchId) {
                url = `${API_BASE}/service/services/?branch_id=${branchId}`;
            }
            const response = await axios.get(url);
            const servicesData = response.data.data || response.data.results || [];
            setServices(servicesData);
        } catch (error) {
            console.error("Error fetching services:", error);
            setServices([]);
        }
    };

    const fetchPackages = async (branchId) => {
        try {
            const url = `${API_BASE}/service/packages/?branch=${branchId}`;
            const response = await axios.get(url);
            const packagesData = response.data.data || [];
            setPackages(packagesData);
        } catch (error) {
            console.error("Error fetching packages:", error);
            setPackages([]);
        }
    };

    const fetchStaff = async (branchId) => {
        try {
            const url = `${API_BASE}/staff/bookable/?branch_id=${branchId}`;
            const response = await axios.get(url);
            setStaff(response.data.data || []);
        } catch (error) {
            console.error("Error fetching staff:", error);
            setStaff([]);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await axios.get(`${API_BASE}/branches/get-all-branches/`);
            const branchesData = response.data.data || response.data.branches || response.data.results || [];
            setBranches(branchesData);
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    const generateAvailableTimeSlots = () => {
        setLoadingTimeSlots(true);

        try {
            // Get business hours for the selected date
            const selectedDate = new Date(formData.date);
            const dayOfWeek = selectedDate.getDay();

            let openingTime, closingTime;

            // Check for special hours
            const specialHours = selectedBranchStatus?.special_hours || [];
            const specialDay = specialHours.find(sh => sh.date === formData.date);

            if (specialDay && specialDay.is_open) {
                openingTime = specialDay.opening_time;
                closingTime = specialDay.closing_time;
            } else {
                // Check daily hours
                const dailyHours = selectedBranchStatus?.daily_hours || [];
                const hoursForDay = dailyHours.find(dh => dh.day_of_week === dayOfWeek);

                if (hoursForDay) {
                    openingTime = hoursForDay.opening_time;
                    closingTime = hoursForDay.closing_time;
                } else {
                    openingTime = selectedBranchStatus?.opening_time;
                    closingTime = selectedBranchStatus?.closing_time;
                }
            }

            if (!openingTime || !closingTime) {
                setAvailableTimeSlots([]);
                setLoadingTimeSlots(false);
                return;
            }

            // Generate time slots in 30-minute intervals
            const slots = [];
            const start = parseTimeToMinutes(openingTime);
            const end = parseTimeToMinutes(closingTime);
            const interval = 30; // 30 minutes interval

            for (let time = start; time < end; time += interval) {
                const timeSlot = minutesToTimeString(time);
                slots.push(timeSlot);
            }

            // Filter out booked slots based on existing appointments
            const bookedSlots = getBookedSlotsForStaffAndDate();
            const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));

            setAvailableTimeSlots(availableSlots);

            // Clear time selection if current time is not available
            if (formData.time && !availableSlots.includes(formData.time)) {
                setFormData(prev => ({ ...prev, time: "" }));
                if (availableSlots.length > 0) {
                    Swal.fire({
                        icon: "warning",
                        title: "Time Unavailable",
                        text: "The selected time is no longer available. Please select another time.",
                        confirmButtonColor: "#dba627",
                    });
                }
            }
        } catch (error) {
            console.error("Error generating time slots:", error);
            setAvailableTimeSlots([]);
        } finally {
            setLoadingTimeSlots(false);
        }
    };

    const parseTimeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const minutesToTimeString = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const getBookedSlotsForStaffAndDate = () => {
        const bookedSlots = [];

        // Filter appointments for selected staff and date
        const staffAppointments = existingAppointments.filter(apt =>
            apt.staff === parseInt(formData.staff) &&
            apt.date === formData.date &&
            apt.status !== 'cancelled' // Don't consider cancelled appointments
        );

        // Calculate total duration of selected services
        const totalDuration = calculateTotalDuration();

        staffAppointments.forEach(apt => {
            const aptStartTime = parseTimeToMinutes(apt.time);
            const aptDuration = apt.total_duration || 30; // Default 30 minutes if not specified
            const aptEndTime = aptStartTime + aptDuration;

            // Mark the start time as booked
            bookedSlots.push(apt.time);

            // Also mark subsequent slots that would overlap
            const interval = 30;
            for (let time = aptStartTime + interval; time < aptEndTime; time += interval) {
                bookedSlots.push(minutesToTimeString(time));
            }
        });

        return [...new Set(bookedSlots)]; // Remove duplicates
    };

    const calculateTotalDuration = () => {
        let totalDuration = 0;
        selectedServices.forEach(item => {
            const service = getServiceDetails(item.service);
            if (service) {
                totalDuration += getDurationMinutes(service.duration);
            }
        });
        return totalDuration;
    };

    const checkBranchStatus = async (branchId) => {
        try {
            // Fetch branch details to check status
            const response = await axios.get(`${API_BASE}/branches/${branchId}/`);
            const branchData = response.data.data || response.data;

            setSelectedBranchStatus(branchData);
            setBranchSchedule({
                opening_time: branchData.opening_time,
                closing_time: branchData.closing_time,
                weekly_off: branchData.weekly_off || []
            });

            // Check if branch is ACTIVE (not permanently inactive)
            let isActive = true;
            let reason = "";

            // ONLY block if branch is permanently inactive
            if (branchData.active === false) {
                isActive = false;
                reason = "This branch is permanently inactive and cannot accept any appointments.";
            }

            setIsBranchActive(isActive);
            setBranchInactiveReason(reason);

            if (!isActive) {
                Swal.fire({
                    icon: "error",
                    title: "Branch Unavailable",
                    text: reason,
                    confirmButtonColor: "#dba627",
                });
                // Reset branch selection
                setFormData(prev => ({ ...prev, branch: "" }));
            }

            return isActive;
        } catch (error) {
            console.error("Error checking branch status:", error);
            setIsBranchActive(true);
            setBranchInactiveReason("");
            return true;
        }
    };

    const checkBranchOpenOnDate = () => {
        if (!selectedBranchStatus || !formData.date) return;

        const selectedDate = new Date(formData.date);
        const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Check if branch is closed on this day of week (weekly off)
        const weeklyOff = selectedBranchStatus.weekly_off || [];
        const isWeeklyOff = weeklyOff.includes(dayOfWeek);

        // Check if branch has special holiday hours
        const specialHours = selectedBranchStatus.special_hours || [];
        const specialDay = specialHours.find(sh => sh.date === formData.date);

        let isClosed = false;
        let reason = "";

        if (specialDay) {
            if (!specialDay.is_open) {
                isClosed = true;
                reason = specialDay.reason || "Branch is closed on this date for special occasion.";
            }
        } else if (isWeeklyOff) {
            isClosed = true;
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            reason = `Branch is closed on ${dayNames[dayOfWeek]}s. Please select another date.`;
        }

        setIsBranchClosedOnSelectedDate(isClosed);

        if (isClosed) {
            Swal.fire({
                icon: "warning",
                title: "Branch Closed on Selected Date",
                text: reason,
                confirmButtonColor: "#dba627",
            });
            setFormData(prev => ({ ...prev, date: "", time: "" }));
        }

        return !isClosed;
    };

    const isTimeWithinBusinessHours = (time, date) => {
        if (!selectedBranchStatus) return true;

        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();

        // Check for special hours on this date
        const specialHours = selectedBranchStatus.special_hours || [];
        const specialDay = specialHours.find(sh => sh.date === date);

        let openingTime, closingTime;

        if (specialDay && specialDay.is_open) {
            openingTime = specialDay.opening_time;
            closingTime = specialDay.closing_time;
        } else {
            // Check daily hours
            const dailyHours = selectedBranchStatus.daily_hours || [];
            const hoursForDay = dailyHours.find(dh => dh.day_of_week === dayOfWeek);

            if (hoursForDay) {
                openingTime = hoursForDay.opening_time;
                closingTime = hoursForDay.closing_time;
            } else {
                openingTime = selectedBranchStatus.opening_time;
                closingTime = selectedBranchStatus.closing_time;
            }
        }

        if (!openingTime || !closingTime) return true;

        const timeMinutes = parseTimeToMinutes(time);
        const openMinutes = parseTimeToMinutes(openingTime);
        const closeMinutes = parseTimeToMinutes(closingTime);

        return timeMinutes >= openMinutes && timeMinutes < closeMinutes;
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleBranchChange = async (e) => {
        const branchId = e.target.value;
        setFormData(prev => ({ ...prev, branch: branchId, date: "", time: "" }));

        if (branchId) {
            // Check if branch is active (not permanently inactive)
            const isActive = await checkBranchStatus(branchId);
            if (!isActive) {
                setFormData(prev => ({ ...prev, branch: "" }));
            }
        }
    };

    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setFormData(prev => ({ ...prev, date: selectedDate, time: "" }));
        setIsBranchClosedOnSelectedDate(false);
    };

    const handlePackageChange = (e) => {
        const packageId = e.target.value;
        setSelectedPackage(packageId);

        if (packageId) {
            const selectedPkg = packages.find(pkg => pkg.id === parseInt(packageId));
            if (selectedPkg && selectedPkg.services) {
                // Add all services from the package
                const packageServiceItems = selectedPkg.services.map(serviceId => ({ service: serviceId }));
                setSelectedServices(packageServiceItems);
                setPackageServices(packageServiceItems);

                Swal.fire({
                    icon: "success",
                    title: "Package Applied!",
                    text: `${selectedPkg.name} package services have been added. You can still add more services if needed.`,
                    confirmButtonColor: "#dba627",
                    timer: 2000,
                    showConfirmButton: true
                });
            }
        } else {
            // If package is deselected, only remove services that came from package
            if (packageServices.length > 0) {
                const currentServicesNotFromPackage = selectedServices.filter(
                    service => !packageServices.some(pkgService => pkgService.service === service.service)
                );
                setSelectedServices(currentServicesNotFromPackage);
                setPackageServices([]);
            }
        }
    };

    const addService = () => {
        if (serviceInput) {
            const service = services.find(s => s.id === parseInt(serviceInput));
            if (service) {
                if (selectedServices.some(s => s.service === service.id)) {
                    Swal.fire({
                        icon: "warning",
                        title: "Duplicate Service",
                        text: "This service has already been added",
                        confirmButtonColor: "#dba627",
                    });
                    return;
                }

                setSelectedServices([...selectedServices, { service: service.id }]);
                setServiceInput("");
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "No Service Selected",
                text: "Please select a service from the dropdown",
                confirmButtonColor: "#dba627",
            });
        }
    };

    const removeService = (indexToRemove) => {
        const serviceToRemove = selectedServices[indexToRemove];

        // Check if this service came from a package
        const isFromPackage = packageServices.some(
            pkgService => pkgService.service === serviceToRemove.service
        );

        if (isFromPackage) {
            Swal.fire({
                icon: "warning",
                title: "Package Service",
                text: "This service is part of a package. Either remove the package or keep the service.",
                confirmButtonColor: "#dba627",
            });
            return;
        }

        setSelectedServices(selectedServices.filter((_, index) => index !== indexToRemove));
    };

    const resetForm = () => {
        setFormData({
            branch: "",
            staff: "",
            date: "",
            time: "",
            appointment_type: "appointment",
            notes: "",
        });
        setSelectedServices([]);
        setServiceInput("");
        setSelectedPackage("");
        setPackageServices([]);
        setSelectedBranchStatus(null);
        setIsBranchActive(true);
        setBranchInactiveReason("");
        setBranchSchedule(null);
        setAvailableTimeSlots([]);
        setIsBranchClosedOnSelectedDate(false);
    };

    const validateDateTime = () => {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if date is in the past
        if (selectedDate < today) {
            Swal.fire({
                icon: "error",
                title: "Invalid Date",
                text: "Cannot book appointments for past dates. Please select a future date.",
                confirmButtonColor: "#dba627",
            });
            return false;
        }

        // Check if branch is closed on selected date
        if (isBranchClosedOnSelectedDate) {
            Swal.fire({
                icon: "error",
                title: "Branch Closed",
                text: "This branch is closed on the selected date. Please choose another date.",
                confirmButtonColor: "#dba627",
            });
            return false;
        }

        // Check if selected time is available
        if (!availableTimeSlots.includes(formData.time)) {
            Swal.fire({
                icon: "error",
                title: "Time Unavailable",
                text: "The selected time is not available. Please select an available time slot.",
                confirmButtonColor: "#dba627",
            });
            return false;
        }

        // Check business hours for the selected date
        if (!isTimeWithinBusinessHours(formData.time, formData.date)) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = new Date(formData.date).getDay();

            // Get business hours for that day
            let businessHours = "";
            if (selectedBranchStatus) {
                const dailyHours = selectedBranchStatus.daily_hours || [];
                const hoursForDay = dailyHours.find(dh => dh.day_of_week === dayOfWeek);
                if (hoursForDay) {
                    businessHours = `${hoursForDay.opening_time} - ${hoursForDay.closing_time}`;
                } else {
                    businessHours = `${selectedBranchStatus.opening_time} - ${selectedBranchStatus.closing_time}`;
                }
            }

            Swal.fire({
                icon: "error",
                title: "Outside Business Hours",
                text: `Please select a time within business hours for ${dayNames[dayOfWeek]} (${businessHours}).`,
                confirmButtonColor: "#dba627",
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Double-check branch is ACTIVE (not permanently inactive)
        if (formData.branch) {
            const isActive = await checkBranchStatus(formData.branch);
            if (!isActive) {
                Swal.fire({
                    icon: "error",
                    title: "Cannot Create Appointment",
                    text: branchInactiveReason || "This branch is permanently inactive and cannot accept appointments.",
                    confirmButtonColor: "#dba627",
                });
                return;
            }
        }

        if (selectedServices.length === 0) {
            Swal.fire({
                icon: "error",
                title: "Validation Error",
                text: "Please add at least one service to the appointment",
                confirmButtonColor: "#dba627",
            });
            return;
        }

        if (!formData.branch || !formData.staff || !formData.date || !formData.time) {
            Swal.fire({
                icon: "error",
                title: "Validation Error",
                text: "Please fill in all required fields",
                confirmButtonColor: "#dba627",
            });
            return;
        }

        // Check if branch is closed on selected date
        if (isBranchClosedOnSelectedDate) {
            Swal.fire({
                icon: "error",
                title: "Branch Closed",
                text: "This branch is closed on the selected date. Please choose another date.",
                confirmButtonColor: "#dba627",
            });
            return;
        }

        // Validate date and time
        if (!validateDateTime()) {
            return;
        }

        setModalLoading(true);

        const payload = {
            branch: parseInt(formData.branch),
            staff: parseInt(formData.staff),
            date: formData.date,
            time: formData.time,
            appointment_type: formData.appointment_type,
            notes: formData.notes,
            items: selectedServices,
            package_id: selectedPackage ? parseInt(selectedPackage) : null,
        };

        try {
            const response = await axios.post(`${API_BASE}/appointment/create-appointment/`, payload);

            if (response.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: "Appointment created successfully!",
                    confirmButtonColor: "#dba627",
                });
                resetForm();
                setShowModal(false);
                fetchAppointments();
                // Refresh existing appointments for the branch
                if (formData.branch) {
                    fetchExistingAppointments(formData.branch);
                }
            } else {
                throw new Error(response.data.message || "Failed to create appointment");
            }
        } catch (error) {
            console.error("Error creating appointment:", error);

            // Check if error is due to branch being inactive
            if (error.response?.status === 400) {
                const errorMessage = error.response?.data?.message || "";
                if (errorMessage.includes("inactive") || errorMessage.includes("permanently")) {
                    Swal.fire({
                        icon: "error",
                        title: "Branch Inactive",
                        text: "This branch is permanently inactive and cannot accept appointments.",
                        confirmButtonColor: "#dba627",
                    });
                } else if (errorMessage.includes("time") || errorMessage.includes("slot")) {
                    Swal.fire({
                        icon: "error",
                        title: "Time Unavailable",
                        text: errorMessage || "The selected time slot is no longer available. Please choose another time.",
                        confirmButtonColor: "#dba627",
                    });
                    // Refresh available time slots
                    generateAvailableTimeSlots();
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: errorMessage || "Failed to create appointment",
                        confirmButtonColor: "#dba627",
                    });
                }
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.response?.data?.message || error.message || "Failed to create appointment",
                    confirmButtonColor: "#dba627",
                });
            }
        } finally {
            setModalLoading(false);
        }
    };

    const isFormValid = () => {
        return formData.branch && formData.staff && formData.date && formData.time && selectedServices.length > 0 && isBranchActive && !isBranchClosedOnSelectedDate;
    };

    const getDurationMinutes = (duration) => {
        if (!duration) return 0;
        if (typeof duration === "number") return duration;
        if (typeof duration === "string") {
            const parsed = parseInt(duration);
            if (!isNaN(parsed)) return parsed;
        }
        return 0;
    };

    const getServiceDetails = (serviceId) => {
        return services.find(s => s.id === serviceId);
    };

    const calculateTotal = () => {
        let totalPrice = 0;
        let totalDuration = 0;
        selectedServices.forEach(item => {
            const service = getServiceDetails(item.service);
            if (service) {
                totalPrice += parseFloat(service.price || 0);
                totalDuration += getDurationMinutes(service.duration);
            }
        });
        return { totalPrice, totalDuration };
    };

    const { totalPrice, totalDuration } = calculateTotal();

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getBranchStatusColor = (branch) => {
        if (branch.active === false) return 'text-red-600 bg-red-50';
        if (branch.currently_open === false) return 'text-orange-600 bg-orange-50';
        return 'text-green-600 bg-green-50';
    };

    const getBranchStatusText = (branch) => {
        if (branch.active === false) return 'Inactive';
        if (branch.currently_open === false) return 'Closed Now';
        return 'Open Now';
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAppointments = appointments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(appointments.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <DashboardLayout>
            <div className="bg-gray-50 py-4 px-3 min-h-screen">
                <div className="">
                    {/* Header with Title and Button */}
                    <div className="flex justify-between items-center mb-6 border-b-2 border-[#dba627] pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-black tracking-tight">
                                My <span className="text-[#dba627]">Appointments</span>
                            </h1>
                            <p className="text-gray-500 mt-1">View and manage your appointments</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 h-11 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Book Appointment
                        </button>
                    </div>

                    {/* Top Show All Branches Section */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-black mb-3">
                            All <span className="text-[#dba627]">Branches</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {branches.map((branch) => (
                                <div key={branch.id} className={`bg-white rounded-lg border p-4  ${branch.active === false
                                        ? 'border-red-200 opacity-75'
                                        : 'border-gray-200'
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-gray-900 text-lg">{branch.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBranchStatusColor(branch)}`}>
                                            {getBranchStatusText(branch)}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-1">{branch.address}</p>
                                    <p className="text-gray-500 text-xs mt-2">{branch.city}</p>
                                    {branch.phone && <p className="text-gray-500 text-xs mt-1">📞 +91{branch.phone}</p>}
                                    {branch.opening_time && branch.closing_time && (
                                        <p className="text-gray-500 text-xs mt-1">
                                            🕐 {branch.opening_time} - {branch.closing_time}
                                        </p>
                                    )}
                                    {branch.active === false && (
                                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Branch inactive - Not accepting appointments
                                        </p>
                                    )}
                                    {branch.active !== false && branch.currently_open === false && (
                                        <p className="text-orange-500 text-xs mt-2 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Currently closed - Can book for future dates
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Appointments Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Services</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentAppointments.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                                                No appointments found. Click Book Appointment to schedule one.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentAppointments.map((appointment, index) => (
                                            <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-500">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{appointment.branch_name}</div>
                                                    <div className="text-xs text-gray-500">{appointment.branch_city}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{appointment.staff_name}</td>
                                                
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{appointment.date}</div>
                                                    <div className="text-xs text-gray-500">{appointment.time}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm capitalize">{appointment.appointment_type}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(appointment.status)}`}>
                                                        {appointment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">₹{appointment.total_amount}</div>
                                                    <div className="text-xs text-gray-500">{appointment.total_duration} min</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {appointment.items && appointment.items.length > 0 ? (
                                                            appointment.items.map((item, idx) => (
                                                                <div key={idx} className="text-xs text-gray-600">
                                                                    • {item.service_name}
                                                                    {item.price && <span className="text-gray-400 ml-1">(₹{item.price})</span>}
                                                                    {item.duration && <span className="text-gray-400 ml-1">- {item.duration} min</span>}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">No services</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {appointments.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(indexOfLastItem, appointments.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{appointments.length}</span> results
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentPage === 1
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer"
                                            }`}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            onClick={() => paginate(number)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentPage === number
                                                    ? "bg-[#dba627] text-white"
                                                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer"
                                                }`}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentPage === totalPages
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer"
                                            }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Booking Appointment - With Blur Effect */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Blur backdrop overlay */}
                    <div
                        className="fixed inset-0 backdrop-blur-sm bg-white/5 transition-all"
                        onClick={() => setShowModal(false)}
                    ></div>

                    {/* Modal container */}
                    <div className="relative z-50 flex items-center justify-center min-h-screen p-4">
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <h3 className="text-2xl font-bold text-black">
                                    Book <span className="text-[#dba627]">Appointment</span>
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Branch Selection */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Branch *
                                                </label>
                                                <select
                                                    name="branch"
                                                    value={formData.branch}
                                                    onChange={handleBranchChange}
                                                    required
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                >
                                                    <option value="">Select Branch</option>
                                                    {branches.map(branch => {
                                                        // Only disable PERMANENTLY INACTIVE branches
                                                        const isDisabled = branch.active === false;
                                                        return (
                                                            <option
                                                                key={branch.id}
                                                                value={branch.id}
                                                                disabled={isDisabled}
                                                                className={isDisabled ? "text-gray-400" : "text-gray-800"}
                                                            >
                                                                {branch.name} - {branch.city}
                                                                {isDisabled ? " (Inactive)" : branch.currently_open === false ? " (Closed Now - Book for future)" : ""}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                {formData.branch && !isBranchActive && (
                                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {branchInactiveReason || "This branch is permanently inactive"}
                                                    </p>
                                                )}
                                                {selectedBranchStatus && selectedBranchStatus.currently_open === false && formData.branch && (
                                                    <p className="text-orange-500 text-xs mt-1 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Branch is currently closed, but you can book for future dates
                                                    </p>
                                                )}
                                            </div>

                                            {/* Staff Selection */}
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
                                                    disabled={!formData.branch || !isBranchActive}
                                                >
                                                    <option value="">
                                                        {!formData.branch
                                                            ? "Please select a branch first"
                                                            : !isBranchActive
                                                                ? "Branch not available"
                                                                : staff.length === 0
                                                                    ? "No bookable staff available"
                                                                    : "Select Staff Member"}
                                                    </option>
                                                    {staff.map(member => (
                                                        <option key={member.id} value={member.id}>
                                                            {member.name || `${member.first_name} ${member.last_name}`}
                                                            {member.job_title_name && ` - ${member.job_title_name}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Package Selection - Optional */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Package (Optional)
                                                </label>
                                                <select
                                                    value={selectedPackage}
                                                    onChange={handlePackageChange}
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                                    disabled={!formData.branch || !isBranchActive}
                                                >
                                                    <option value="">Select a package (optional)</option>
                                                    {packages.map(pkg => (
                                                        <option key={pkg.id} value={pkg.id}>
                                                            {pkg.name} - ₹{pkg.package_price} (Valid for {pkg.validity_days} days)
                                                        </option>
                                                    ))}
                                                </select>
                                                {packages.length === 0 && formData.branch && isBranchActive && (
                                                    <p className="text-xs text-gray-500 mt-1">No packages available for this branch</p>
                                                )}
                                            </div>

                                            {/* Date */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Appointment Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleDateChange}
                                                    required
                                                    disabled={!isBranchActive}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                />
                                                {isBranchClosedOnSelectedDate && formData.date && (
                                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Branch is closed on this date. Please select another date.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Time */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Appointment Time *
                                                </label>
                                                <select
                                                    name="time"
                                                    value={formData.time}
                                                    onChange={handleInputChange}
                                                    required
                                                    disabled={!formData.date || !formData.staff || loadingTimeSlots || availableTimeSlots.length === 0 || isBranchClosedOnSelectedDate}
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">
                                                        {!formData.date
                                                            ? "Please select a date first"
                                                            : !formData.staff
                                                                ? "Please select staff first"
                                                                : isBranchClosedOnSelectedDate
                                                                    ? "Branch closed on this date"
                                                                    : loadingTimeSlots
                                                                        ? "Loading available times..."
                                                                        : availableTimeSlots.length === 0
                                                                            ? "No available time slots"
                                                                            : "Select Time"}
                                                    </option>
                                                    {availableTimeSlots.map(slot => (
                                                        <option key={slot} value={slot}>
                                                            {slot}
                                                        </option>
                                                    ))}
                                                </select>
                                                {formData.date && formData.staff && availableTimeSlots.length === 0 && !loadingTimeSlots && !isBranchClosedOnSelectedDate && (
                                                    <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        No available time slots for this date. Please try another date or staff member.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Appointment Type */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Appointment Type *
                                                </label>
                                                <select
                                                    name="appointment_type"
                                                    value={formData.appointment_type}
                                                    onChange={handleInputChange}
                                                    disabled={!isBranchActive}
                                                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="walkin">Walk-in</option>
                                                    <option value="appointment">Appointment</option>
                                                </select>
                                            </div>

                                            {/* Notes */}
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Additional Notes
                                                </label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    rows="2"
                                                    disabled={!isBranchActive}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    placeholder="Any special requests or notes..."
                                                />
                                            </div>

                                            {/* Services Selection */}
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                                    Services *
                                                </label>
                                                <div className="flex gap-2 mb-3">
                                                    <select
                                                        value={serviceInput}
                                                        onChange={(e) => setServiceInput(e.target.value)}
                                                        className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        disabled={!formData.branch || !isBranchActive || services.length === 0}
                                                    >
                                                        <option value="">
                                                            {!formData.branch
                                                                ? "Please select a branch first"
                                                                : !isBranchActive
                                                                    ? "Branch not available"
                                                                    : services.length === 0
                                                                        ? "No services available for this branch"
                                                                        : "Select Service"}
                                                        </option>
                                                        {services.map(service => (
                                                            <option key={service.id} value={service.id}>
                                                                {service.name} - ₹{service.price} ({getDurationMinutes(service.duration)} min)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={addService}
                                                        disabled={!formData.branch || !isBranchActive || services.length === 0}
                                                        className={`px-5 h-10 rounded-lg text-white text-sm font-semibold transition-colors ${!formData.branch || !isBranchActive || services.length === 0
                                                                ? "bg-gray-400 cursor-not-allowed"
                                                                : "bg-black hover:bg-gray-800 cursor-pointer"
                                                            }`}
                                                    >
                                                        Add
                                                    </button>
                                                </div>

                                                {selectedServices.length > 0 && (
                                                    <>
                                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-sm text-green-700">
                                                                    ✓ {selectedServices.length} service(s) added
                                                                    {selectedPackage && (
                                                                        <span className="ml-2 text-xs text-green-600">
                                                                            (Package applied)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-sm font-semibold text-green-700">
                                                                    Total: ₹{totalPrice} ({totalDuration} min)
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                                                            {selectedServices.map((item, index) => {
                                                                const service = getServiceDetails(item.service);
                                                                const isFromPackage = packageServices.some(
                                                                    pkgService => pkgService.service === item.service
                                                                );
                                                                return (
                                                                    <div key={index} className="p-3 flex justify-between items-center">
                                                                        <div>
                                                                            <span className="text-sm font-medium text-gray-900">
                                                                                {service?.name || `Service #${item.service}`}
                                                                            </span>
                                                                            {service && (
                                                                                <span className="text-xs text-gray-500 ml-2">
                                                                                    ₹{service.price} - {service.duration} min
                                                                                </span>
                                                                            )}
                                                                            {isFromPackage && (
                                                                                <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                                                                    Package
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeService(index)}
                                                                            className={`text-sm font-medium ${isFromPackage
                                                                                    ? "text-gray-400 cursor-not-allowed"
                                                                                    : "text-red-600 hover:text-red-800 cursor-pointer"
                                                                                }`}
                                                                            disabled={isFromPackage}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalLoading || !isFormValid()}
                                        className={`px-5 h-10 rounded-lg text-white text-sm font-semibold transition-colors ${modalLoading || !isFormValid()
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-black hover:bg-gray-800 cursor-pointer"
                                            }`}
                                    >
                                        {modalLoading ? "Creating..." : "Create Appointment"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}