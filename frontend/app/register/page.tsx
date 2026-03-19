"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { api } from "@/lib/axios";
import { Ticket } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");

    // React Query mutation to handle Registration API interaction
    const registerMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post("/auth/register", { email, password, role });
            return response.data;
        },
        onSuccess: (data) => {
            // 1. Store tokens immediately so user is logged in
            Cookies.set("accessToken", data.data.accessToken);
            Cookies.set("refreshToken", data.data.refreshToken);
            Cookies.set("user", JSON.stringify(data.data.user));

            toast.success("Registration successful!");

            // 2. Direct user to appropriate view by querying the role they requested
            const createdRole = data.data.user.role;
            if (createdRole === "admin") router.push("/admin");
            else if (createdRole === "organizer") router.push("/organizer");
            else if (createdRole === "verifier") router.push("/verifier");
            else router.push("/dashboard");

            // Reload global layout
            router.refresh();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            // Map out possible Zod validation errors to toast (if an array is returned)
            // Otherwise fallback to single message
            if (error.response?.data?.errors) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error.response.data.errors.forEach((err: any) => toast.error(err.message));
            } else {
                const msg = error.response?.data?.message || "Registration failed";
                toast.error(msg);
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        registerMutation.mutate();
    };

    return (
        <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-indigo-600">
                    <Ticket className="h-12 w-12" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Create an Account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{" "}
                    <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        sign in to your existing account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Must be at least 6 characters long.</p>
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Account Type
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-slate-50 border"
                            >
                                <option value="user">Attendant (Buy Tickets)</option>
                                <option value="organizer">Event Organizer</option>
                                <option value="verifier">Gate Verifier</option>
                                <option value="admin">Platform Admin</option>
                            </select>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={registerMutation.isPending}
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {registerMutation.isPending ? "Creating Account..." : "Register"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
