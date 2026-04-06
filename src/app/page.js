"use client";
import { useAuth } from "@/components/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({ children }) {
  // const { user, loading } = useAuth();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push("/login");
  //   }
  // }, [user, loading, router]);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-black flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-16 h-16 border-4 border-[#dba627]/20 border-t-[#dba627] rounded-full animate-spin mx-auto mb-4"></div>
  //         <p className="text-white">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return null;
  // }

  return (
    <div className="flex h-screen bg-white">
      {/* <Sidebar userRole={user.role} /> */}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <Topbar user={user} /> */}
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 ">
          {children}
        </main>
      </div>
    </div>
  );
}