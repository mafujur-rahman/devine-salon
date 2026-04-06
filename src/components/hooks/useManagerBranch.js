// hooks/useManagerBranch.js
import { useState, useEffect } from 'react';

const API_BASE = "https://saloon.mrshakil.com/api";

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
            ...options.headers,
        },
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
    }
    
    return response.json();
}

export function useManagerBranch() {
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        fetchManagerData();
    }, []);

    const fetchManagerData = async () => {
        setLoading(true);
        try {
            // Step 1: Get manager's profile
            const profileResponse = await apiFetch('/user/profile/');
            
            if (!profileResponse.success) {
                throw new Error(profileResponse.message || "Failed to fetch profile");
            }
            
            const userProfile = profileResponse.data;
            setProfile(userProfile);
            
            console.log("Manager Profile:", userProfile);
            
            // Step 2: Check if manager has a managed branch
            if (!userProfile.managed_branch_id) {
                setError("No branch assigned to this manager account. Please contact admin.");
                setLoading(false);
                return;
            }
            
            // Step 3: Fetch branch details (manager endpoint automatically filters to their branch)
            const branchesResponse = await apiFetch('/branches/get-all-branches/');
            const branches = branchesResponse.data || branchesResponse.branches || branchesResponse.results || [];
            
            console.log("Branches from API:", branches);
            
            if (branches.length === 0) {
                setError("Branch not found. Please contact admin.");
                setLoading(false);
                return;
            }
            
            // The API should return only the manager's branch
            setBranch(branches[0]);
            
        } catch (err) {
            console.error('Error fetching manager data:', err);
            setError(err.message || "Failed to load branch information");
        } finally {
            setLoading(false);
        }
    };

    const refetch = () => {
        fetchManagerData();
    };

    return { branch, loading, error, profile, refetch };
}