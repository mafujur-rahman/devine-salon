"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    MdOutlineGridView,
    MdCalendarToday,
    MdPersonOutline,
    MdPeopleOutline,
    MdQueue,
    MdPayment,
    MdBarChart,
    MdStore,
    MdSettings,
    MdAdd,
    MdKeyboardArrowRight,
    MdContentCut,
    MdHistory,
    MdStar,
    MdDesignServices,
    MdInventory2,
    MdShoppingBag,
} from "react-icons/md";
import LogoutButton from "./logout/Logout";
import Profile from "./profile/Profile";

// Role-based menu configuration
const roleMenus = {
    superadmin: [
        { name: "Dashboard", icon: MdOutlineGridView, path: "/dashboard/admin", hasSub: false },
        { name: "Appointments", icon: MdCalendarToday, path: "/dashboard/admin/appointments", hasSub: false },
        { name: "Services", icon: MdContentCut, path: "/dashboard/admin/services", hasSub: false },
        { name: "Staff", icon: MdPeopleOutline, path: "/dashboard/admin/staff", hasSub: false },
        { name: "Branch", icon: MdQueue, path: "/dashboard/admin/branch", hasSub: false },
        { name: "Packages", icon: MdInventory2, path: "/dashboard/admin/packages", hasSub: false },
        { name: "Products", icon: MdShoppingBag, path: "/dashboard/admin/products", hasSub: false },
        { name: "Payments", icon: MdPayment, path: "/dashboard/admin/payments", hasSub: false },
    ],
    manager: [
        { name: "Dashboard", icon: MdOutlineGridView, path: "/dashboard/manager", hasSub: false },
        { name: "Appointments", icon: MdCalendarToday, path: "/dashboard/manager/appointment", hasSub: false },
        { name: "Services", icon: MdDesignServices, path: "/dashboard/manager/service", hasSub: false },
        { name: "Packages", icon: MdInventory2, path: "/dashboard/manager/package", hasSub: false },
        { name: "Products", icon: MdShoppingBag, path: "/dashboard/manager/product", hasSub: false },
        { name: "Staff", icon: MdPeopleOutline, path: "/dashboard/manager/staff", hasSub: false },
        { name: "Customers", icon: MdPersonOutline, path: "/dashboard/manager/customer", hasSub: false },
        { name: "Payments", icon: MdPayment, path: "/dashboard/manager/billing", hasSub: false },
        { name: "Branch Info", icon: MdStore, path: "/dashboard/manager/branch-info", hasSub: false },
    ],
    customer: [
        { name: "Dashboard", icon: MdOutlineGridView, path: "/dashboard/user", hasSub: false },
        { name: "Appointments", icon: MdCalendarToday, path: "/dashboard/user/appointments", hasSub: false },
    ]
};

export default function Sidebar({ sidebarCollapsed = false, userRole = "manager" }) {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = useState({});
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userData, setUserData] = useState(null);

    const currentMenu = roleMenus[userRole] || roleMenus.manager;

    const toggleSubMenu = (itemName) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemName]: !prev[itemName]
        }));
    };

    const handleSettingsClick = (e) => {
        e.preventDefault();
        setShowProfileModal(true);
    };

    return (
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} h-screen bg-black text-white flex flex-col transition-all duration-300 fixed left-0 top-0 z-50`}>
            {/* Logo Section */}
            <div className={`px-6 pt-8 pb-6 border-b border-[#dba627]/20 ${sidebarCollapsed ? 'px-2' : ''}`}>
                <div  className={`flex items-center gap-3 group ${sidebarCollapsed ? 'justify-center' : ''}`}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#dba627] rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg bg-white">
                            <Image
                                src="/logo/devine-logo-golden.png"
                                alt="Devine Logo"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </div>
                    </div>
                    {!sidebarCollapsed && (
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Devine</h1>
                            <p className="text-xs text-[#dba627] font-medium mt-0.5">Salon Management</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Role Badge */}
            {!sidebarCollapsed && (
                <div className="px-6 py-4 border-b border-[#dba627]/20">
                    <div className="bg-white/5 rounded-lg px-3 py-2 backdrop-blur-sm border border-[#dba627]/10">
                        <p className="text-offwhite/60 text-xs font-medium uppercase tracking-wider">Logged in as</p>
                        <p className="text-[#dba627] text-sm font-semibold mt-0.5 capitalize">{userRole}</p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <div className="space-y-1.5">
                    {currentMenu.map((item) => {
                        const isActive = pathname === item.path;
                        const Icon = item.icon;
                        const isExpanded = expandedItems[item.name];

                        return (
                            <div key={item.name}>
                                <Link
                                    href={item.path}
                                    onClick={(e) => {
                                        if (item.hasSub) {
                                            e.preventDefault();
                                            toggleSubMenu(item.name);
                                        }
                                    }}
                                    className={`group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive
                                            ? "bg-[#dba627]/10 text-white border border-[#dba627]/30 shadow-lg shadow-[#dba627]/5"
                                            : "text-offwhite/70 hover:text-white hover:bg-white/5"
                                        } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                                >
                                    <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                                        <div className={`transition-colors ${isActive ? "text-[#dba627]" : "text-offwhite/50 group-hover:text-[#dba627]"}`}>
                                            <Icon size={22} />
                                        </div>
                                        {!sidebarCollapsed && (
                                            <span className="text-[14px] font-medium tracking-wide">{item.name}</span>
                                        )}
                                    </div>

                                    {!sidebarCollapsed && item.hasSub && (
                                        <MdKeyboardArrowRight
                                            size={18}
                                            className={`transition-transform duration-300 text-offwhite/40 ${isExpanded ? "rotate-90 text-[#dba627]" : ""
                                                }`}
                                        />
                                    )}
                                </Link>

                                {/* Submenu Items */}
                                {!sidebarCollapsed && item.hasSub && isExpanded && (
                                    <div className="ml-9 mt-1 space-y-1 animate-slideDown">
                                        <Link
                                            href={`${item.path}/new`}
                                            className="flex items-center gap-3 px-4 py-2 rounded-lg text-offwhite/60 hover:text-white hover:bg-white/5 text-[13px] transition-all"
                                        >
                                            <MdAdd size={16} className="text-[#dba627]" />
                                            <span>New {item.name.slice(0, -1)}</span>
                                        </Link>
                                        <Link
                                            href={`${item.path}/list`}
                                            className="flex items-center gap-3 px-4 py-2 rounded-lg text-offwhite/60 hover:text-white hover:bg-white/5 text-[13px] transition-all"
                                        >
                                            <span>All {item.name}</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className="px-4 py-6 border-t border-[#dba627]/20 space-y-1.5">
                {userRole !== "customer" && !sidebarCollapsed && (
                    <button
                        onClick={handleSettingsClick}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-offwhite/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 group"
                    >
                        <MdSettings size={20} className="text-offwhite/50 group-hover:text-[#dba627] transition-colors" />
                        <span className="text-[14px] font-medium">Settings</span>
                    </button>
                )}

                <LogoutButton collapsed={sidebarCollapsed} />
            </div>

            {/* Profile Modal */}
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
                
                ::-webkit-scrollbar {
                    width: 6px;
                }
                
                ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #dba627;
                    border-radius: 10px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #c4941f;
                }
            `}</style>
        </div>
    );
}