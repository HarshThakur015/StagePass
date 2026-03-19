"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Ticket, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";

export default function Navbar() {
    const router = useRouter();
    // We use local state to track user so the Navbar updates without full reloads
    const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // On mount, check if user is stored in cookies to hydrate Auth state
        const savedUser = Cookies.get("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogout = async () => {
        try {
            // Call backend to clear server-side considerations if any exist
            await api.post("/auth/logout");

            // Clean up client-side persistence
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
            Cookies.remove("user");
            setUser(null);

            toast.success("Logged out successfully");
            router.push("/login"); // Redirect to login page
        } catch {
            toast.error("Logout failed. Please try again.");
        }
    };

    // Avoid hydration mismatch by waiting for mount
    if (!isMounted) return null;

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between items-center">

                    {/* Logo / Home Link */}
                    <Link href="/" className="flex items-center space-x-2">
                        <Ticket className="h-6 w-6 text-indigo-600" />
                        <span className="font-bold text-xl tracking-tight">StagePass</span>
                    </Link>

                    {/* Right side navigation items depending on auth state */}
                    <div className="flex items-center space-x-4">
                        {!user ? (
                            // Unauthenticated Links
                            <>
                                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                                    Login
                                </Link>
                                <Link href="/register" className="inline-flex h-9 items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-slate-50 shadow transition-colors hover:bg-indigo-700">
                                    Register
                                </Link>
                            </>
                        ) : (
                            // Authenticated Links
                            <>
                                {/* Dynamically route to right dashboard depending on role */}
                                <Link
                                    href={
                                        user.role === "admin" ? "/admin" :
                                            user.role === "organizer" ? "/organizer" :
                                                user.role === "verifier" ? "/verifier" : "/dashboard"
                                    }
                                    className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                                >
                                    Dashboard
                                </Link>

                                <div className="h-8 w-px bg-slate-200 mx-2" />

                                <div className="flex items-center space-x-2 mr-2">
                                    <UserIcon className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm text-slate-500">{user.email}</span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
