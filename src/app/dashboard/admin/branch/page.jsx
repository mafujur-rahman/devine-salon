"use client"
import React, { useState } from 'react';
import DashboardLayout from '@/app/page';
import CreateBranch from '@/components/dashboard/admin/branch/CreateBranch';
import DisplayBranches from '@/components/dashboard/admin/branch/DisplayBranches';


const Branches = () => {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleBranchChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-white">
                <div className="px-3">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-10 border-b-2 border-[#dba627] pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-black tracking-tight">
                                Our <span className="text-[#dba627]">Branches</span>
                            </h1>
                            <p className="text-gray-500 mt-1">Manage all branch</p>
                        </div>
                        <CreateBranch onBranchCreated={handleBranchChange} />
                    </div>

                    {/* Display Branches */}
                    <DisplayBranches refreshTrigger={refreshKey} />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Branches;