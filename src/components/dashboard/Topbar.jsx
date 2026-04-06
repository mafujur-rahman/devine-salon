"use client";
import { useState, useEffect } from "react";
import { 
    MdOutlineMenu, 
    MdSearch, 
    MdNotificationsNone, 
    MdKeyboardArrowDown, 
    MdCalendarToday,
    MdClose,
    MdFilterList
} from "react-icons/md";
import Profile from "./profile/Profile";

export default function Topbar({ onMenuToggle, sidebarCollapsed, userRole = "manager" }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("https://saloon.mrshakil.com/api/user/profile/", {
                headers: {
                    "Authorization": `Token ${token}`,
                },
            });
            const result = await response.json();
            if (result.success) {
                setUserData(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
        }
    };

    return (
        <>
            <div className="h-20 bg-black text-white border-b border-[#dba627]/20 flex items-center justify-between px-8">
                {/* Left: Hamburger and Date Picker */}
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onMenuToggle}
                        className="p-2.5 bg-white/5 rounded-lg text-offwhite/80 hover:bg-[#dba627]/10 hover:text-[#dba627] transition-all duration-300 border border-[#dba627]/20"
                    >
                        <MdOutlineMenu size={20} />
                    </button>

                    <div className="flex items-center gap-2 px-3 py-2 border border-[#dba627]/20 rounded-lg cursor-pointer hover:bg-[#dba627]/5 transition-all duration-300 bg-white/5">
                        <MdCalendarToday className="text-[#dba627]" size={18} />
                        <span className="text-sm font-medium text-offwhite/80">
                            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <MdKeyboardArrowDown className="text-offwhite/40" size={20} />
                    </div>
                </div>

                {/* Right: Search, Notifications, and Profile */}
                <div className="flex items-center gap-6">
                    {/* Search Field - Desktop */}
                    <div className="hidden md:flex items-center relative">
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-offwhite/40" size={20} />
                            <input
                                type="text"
                                placeholder="Search appointments, customers, services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-80 pl-10 pr-10 py-2 bg-white/5 border border-[#dba627]/20 rounded-lg text-offwhite/80 placeholder-offwhite/30 focus:outline-none focus:border-[#dba627] focus:ring-1 focus:ring-[#dba627] transition-all duration-300"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-offwhite/40 hover:text-[#dba627] transition-colors"
                                >
                                    <MdClose size={16} />
                                </button>
                            )}
                        </div>
                        <button className="ml-2 p-2 bg-[#dba627]/10 rounded-lg text-[#dba627] hover:bg-[#dba627]/20 transition-all duration-300 border border-[#dba627]/30">
                            <MdFilterList size={18} />
                        </button>
                    </div>

                    {/* Search Button - Mobile */}
                    <button 
                        onClick={() => setShowSearch(!showSearch)}
                        className="md:hidden p-2 text-offwhite/80 hover:text-[#dba627] transition-colors"
                    >
                        <MdSearch size={22} />
                    </button>

                    {/* Action Icons */}
                    <div className="flex items-center gap-4 border-r border-[#dba627]/20 pr-6">
                        <button className="p-1 text-offwhite/70 hover:text-[#dba627] transition-colors relative group">
                            <MdNotificationsNone size={24} />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#dba627] rounded-full border-2 border-black animate-pulse"></span>
                        </button>
                    </div>

                    {/* User Profile */}
                    <div 
                        onClick={() => setShowProfileModal(true)}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="relative">
                            <img
                                src={userData?.avatar || `https://ui-avatars.com/api/?name=${userData?.first_name || 'User'}&background=dba627&color=fff`}
                                alt={userData?.first_name || "User"}
                                className="w-10 h-10 rounded-full object-cover border-2 border-[#dba627]/30 group-hover:border-[#dba627] transition-all duration-300"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-tight">
                                {userData ? `${userData.first_name} ${userData.last_name || ''}` : "Loading..."}
                            </span>
                            <span className="text-[11px] font-medium text-[#dba627] uppercase tracking-wider">{userRole}</span>
                        </div>
                        <MdKeyboardArrowDown className="text-offwhite/40 group-hover:text-[#dba627] transition-colors" size={18} />
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {showSearch && (
                    <div className="absolute top-20 left-0 right-0 bg-black border-b border-[#dba627]/20 p-4 md:hidden animate-slideDown z-50">
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-offwhite/40" size={20} />
                            <input
                                type="text"
                                placeholder="Search appointments, customers, services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-[#dba627]/20 rounded-lg text-offwhite/80 placeholder-offwhite/30 focus:outline-none focus:border-[#dba627] focus:ring-1 focus:ring-[#dba627] transition-all duration-300"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-offwhite/40 hover:text-[#dba627] transition-colors"
                                >
                                    <MdClose size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Profile 
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onUserDataUpdate={setUserData}
            />

            <style jsx global>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }
            `}</style>
        </>
    );
}