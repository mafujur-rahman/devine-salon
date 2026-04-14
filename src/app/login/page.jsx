"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdPhone, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import Image from "next/image";
import axios from "axios";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        phone: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            console.log("Sending POST request to server with JSON:", formData);

            const response = await axios.post(
                "https://saloon.mrshakil.com/api/user/login/",
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Server response:", response.data);

            const data = response.data;

            // Store token and role in localStorage
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);

                // Store branch_id if available in response
                // Try different possible response structures
                if (data.branch_id) {
                    localStorage.setItem("branch_id", data.branch_id);
                    console.log("Branch ID stored:", data.branch_id);
                } else if (data.branch && data.branch.id) {
                    localStorage.setItem("branch_id", data.branch.id);
                    console.log("Branch ID stored from branch object:", data.branch.id);
                } else if (data.user && data.user.branch_id) {
                    localStorage.setItem("branch_id", data.user.branch_id);
                    console.log("Branch ID stored from user object:", data.user.branch_id);
                } else if (data.branchId) {
                    localStorage.setItem("branch_id", data.branchId);
                    console.log("Branch ID stored:", data.branchId);
                } else {
                    console.warn("No branch_id found in login response:", data);
                }

                // Set default authorization header for all future axios requests
                axios.defaults.headers.common['Authorization'] = `Token ${data.token}`;

                console.log("Token stored and axios default header set");
            }

            // Redirect based on role
            if (data.role === "superadmin") {
                router.push("/dashboard/admin");
            } else if (data.role === "manager") {
                router.push("/dashboard/manager");
            } else if (data.role === "customer") {
                router.push("/dashboard/user");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            console.log("ERROR OBJECT:", err);
            console.log("RESPONSE:", err.response);
            console.log("REQUEST:", err.request);
            console.log("MESSAGE:", err.message);

            if (err.response) {
                setError(err.response.data.message || "Login failed.");
            } else if (err.request) {
                setError("No response from server.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#dba627]/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#dba627]/10 rounded-full blur-3xl"></div>
            </div>

            {/* Login Form */}
            <div className="relative w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-sm border border-[#dba627]/20 rounded-2xl shadow-2xl p-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#dba627] rounded-xl blur-lg opacity-50"></div>
                                <div className="relative w-14 h-14 bg-white rounded-xl overflow-hidden shadow-lg">
                                    <Image
                                        src="/logo/devine-logo-golden.png"
                                        alt="Devine Logo"
                                        fill
                                        className="object-contain p-1"
                                        priority
                                    />
                                </div>
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Devine</h1>
                                <p className="text-xs text-[#dba627] font-medium">Salon Management System</p>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-offwhite/60 text-sm">Please login to your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Phone */}
                        <div>
                            <label className="block text-offwhite/80 text-sm font-medium mb-2">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="text-offwhite/40 text-sm flex items-center gap-1">
                                        <span className="text-base">🇮🇳</span>
                                        <span>+91</span>
                                    </span>
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="9876543210"
                                    required
                                    className="w-full pl-16 pr-4 py-3 bg-white/5 border border-[#dba627]/20 rounded-lg text-white placeholder-offwhite/30 focus:outline-none focus:border-[#dba627] focus:ring-1 focus:ring-[#dba627] transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-offwhite/80 text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-offwhite/40" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-[#dba627]/20 rounded-lg text-white placeholder-offwhite/30 focus:outline-none focus:border-[#dba627] focus:ring-1 focus:ring-[#dba627] transition-all duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-offwhite/40 hover:text-[#dba627] transition-colors"
                                >
                                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#dba627] to-[#c4941f] text-black font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-[#dba627]/20 transition-all duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-offwhite/40 text-xs">© 2026 Devine. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}