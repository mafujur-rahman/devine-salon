"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (token && role) {
            setUser({ token, role });
        } else {
            setUser(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Protect routes
        if (!loading && !user && pathname?.startsWith("/dashboard")) {
            router.push("/login");
        }
    }, [user, loading, pathname, router]);

    const login = (token, role) => {
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        setUser({ token, role });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    // if (!context) {
    //     throw new Error("useAuth must be used within an AuthProvider");
    // }
    return context;
}