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
    const [selectedServices, setSelectedServices] = useState([]);
    const [serviceInput, setServiceInput] = useState("");

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
        fetchServices();
        fetchStaff();
        fetchBranches();
    }, []);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "customer") {
            router.push("/login");
        }
    };

    const fetchServices = async () => {
        try {
            const response = await axios.get(`${API_BASE}/service/services/`);
            setServices(response.data.data || []);
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await axios.get(`${API_BASE}/staff/get-all-staff/`);
            setStaff(response.data.data || []);
        } catch (error) {
            console.error("Error fetching staff:", error);
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

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

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

        setLoading(true);

        const payload = {
            branch: parseInt(formData.branch),
            staff: parseInt(formData.staff),
            date: formData.date,
            time: formData.time,
            appointment_type: formData.appointment_type,
            notes: formData.notes,
            items: selectedServices,
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
                router.push("/appointments");
            } else {
                throw new Error(response.data.message || "Failed to create appointment");
            }
        } catch (error) {
            console.error("Error creating appointment:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || error.message || "Failed to create appointment",
                confirmButtonColor: "#dba627",
            });
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = () => {
        return formData.branch && formData.staff && formData.date && formData.time && selectedServices.length > 0;
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

    return (
        <DashboardLayout>
            <div className=" bg-gray-50 py-4 px-4">
                <div className="">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-black tracking-tight">
                                Create <span className="text-[#dba627]">Appointment</span>
                            </h1>
                            <p className="text-gray-500 mt-1">Fill in the details to schedule a new appointment</p>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Branch Selection */}
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
                                        >
                                            <option value="">Select Staff</option>
                                            {staff.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name || `${member.first_name} ${member.last_name}`}
                                                </option>
                                            ))}
                                        </select>
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
                                            onChange={handleInputChange}
                                            required
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                        />
                                    </div>

                                    {/* Time */}
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

                                    {/* Appointment Type */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                                            Appointment Type *
                                        </label>
                                        <select
                                            name="appointment_type"
                                            value={formData.appointment_type}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
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
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
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
                                                className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#dba627]"
                                            >
                                                <option value="">Select Service</option>
                                                {services.map(service => (
                                                    <option key={service.id} value={service.id}>
                                                        {service.name} - ₹{service.price} ({getDurationMinutes(service.duration)} min)
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={addService}
                                                className="px-5 h-10 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
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
                                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                                    {selectedServices.map((item, index) => {
                                                        const service = getServiceDetails(item.service);
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
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeService(index)}
                                                                    className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
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

                            {/* Form Actions */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !isFormValid()}
                                    className={`px-5 h-10 rounded-lg text-white text-sm font-semibold transition-colors ${loading || !isFormValid()
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-black hover:bg-gray-800 cursor-pointer"
                                        }`}
                                >
                                    {loading ? "Creating..." : "Create Appointment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}