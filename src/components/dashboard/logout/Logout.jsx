// components/dashboard/logout/Logout.jsx
"use client";
import { useRouter } from "next/navigation";
import { MdLogout } from "react-icons/md";

export default function LogoutButton({ collapsed = false }) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        router.push("/login");
    };

    return (
        <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-2.5 text-offwhite/70 hover:text-red-500 hover:bg-white/5 rounded-xl transition-all duration-300 group w-full ${collapsed ? 'justify-center px-2' : ''}`}
        >
            <MdLogout size={20} className="text-offwhite/50 group-hover:text-red-500 transition-colors" />
            {!collapsed && <span className="text-[14px] font-medium">Logout</span>}
        </button>
    );
}