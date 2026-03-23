"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Users, Calendar, Ticket, DollarSign, Activity, ShieldAlert, Trash2, ShieldCheck, Copy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import toast from "react-hot-toast";

interface AdminUser {
    _id: string;
    email: string;
    role: "admin" | "organizer" | "verifier" | "user";
    createdAt: string;
}

interface EventData {
    _id: string;
    name: string;
    date: string;
    venue: string;
    capacity: number;
    price: number;
}

interface TicketData {
    _id: string;
    ticketId: string;
    status: "valid" | "used" | "expired";
    eventId: { name: string; date: string; venue: string } | null;
    userId: { email: string; role: string } | null;
    createdAt: string;
}

export default function AdminDashboard() {
    const queryClient = useQueryClient();

    // Fetch platform analytics
    const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
        queryKey: ["adminAnalytics"],
        queryFn: async () => (await api.get("/admin/analytics")).data,
    });

    // Fetch users list
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ["adminUsers"],
        queryFn: async () => (await api.get("/admin/users")).data,
    });

    // Fetch events list
    const { data: eventsData, isLoading: eventsLoading } = useQuery({
        queryKey: ["adminEvents"],
        queryFn: async () => (await api.get("/admin/events")).data,
    });

    // Fetch tickets list
    const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
        queryKey: ["adminTickets"],
        queryFn: async () => (await api.get("/admin/tickets")).data,
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => await api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            toast.success("User deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            queryClient.invalidateQueries({ queryKey: ["adminAnalytics"] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || "Failed to delete user"),
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string; role: string }) => await api.put(`/admin/users/${id}/role`, { role }),
        onSuccess: () => {
            toast.success("Role explicitly updated");
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || "Failed to update role"),
    });

    const deleteEventMutation = useMutation({
        mutationFn: async (id: string) => await api.delete(`/admin/events/${id}`),
        onSuccess: () => {
            toast.success("Event forcefully deleted");
            queryClient.invalidateQueries({ queryKey: ["adminEvents"] });
            queryClient.invalidateQueries({ queryKey: ["adminAnalytics"] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || "Failed to delete event"),
    });

    const analytics = analyticsData?.data;
    const users = usersData?.data || [];
    const events = eventsData?.data || [];
    const tickets = ticketsData?.data || [];

    const isLoading = analyticsLoading || usersLoading || eventsLoading || ticketsLoading;

    if (isLoading) {
        return <div className="text-center mt-20 text-indigo-600 font-medium animate-pulse">Loading Platform Data...</div>;
    }

    const chartData = [
        { name: "Total Users", value: analytics?.totalUsers || 0 },
        { name: "Events Host", value: analytics?.totalEvents || 0 },
        { name: "Tickets Sold", value: analytics?.totalTickets || 0 },
        { name: "Scanned at Gate", value: analytics?.usedTickets || 0 },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="h-8 w-8 text-indigo-600" /> Platform Administration
                </h1>
                <p className="text-slate-500 mt-2">Metrics overview and system user management.</p>
            </div>

            {/* Metric Cards KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg"><Users className="text-blue-600 h-6 w-6" /></div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Users</p>
                        <h3 className="text-2xl font-bold text-slate-900">{analytics?.totalUsers || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-lg"><Calendar className="text-purple-600 h-6 w-6" /></div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Live Events</p>
                        <h3 className="text-2xl font-bold text-slate-900">{analytics?.totalEvents || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-lg"><Ticket className="text-indigo-600 h-6 w-6" /></div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Tickets Sold</p>
                        <h3 className="text-2xl font-bold text-slate-900">{analytics?.totalTickets || 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-4 ring-1 ring-emerald-500/10">
                    <div className="bg-emerald-100 p-3 rounded-lg"><DollarSign className="text-emerald-600 h-6 w-6" /></div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Platform Volume</p>
                        <h3 className="text-2xl font-bold text-emerald-700">${(analytics?.totalRevenue || 0).toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recharts Data Visualization */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Engagement Overview</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Info panel */}
                <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-sm flex flex-col justify-between">
                    <div>
                        <ShieldAlert className="h-10 w-10 text-indigo-300 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Admin Security Model</h3>
                        <p className="text-indigo-200 text-sm leading-relaxed mb-4">
                            You are viewing sensitive platform metrics. Your role has unconditional access to DELETE events, fetch lists of all tickets, and audit platform security keys.
                        </p>
                    </div>
                    <div className="pt-4 border-t border-indigo-500/50">
                        <p className="text-xs text-indigo-300">Logged in with elevated JWT token. Expires in 15m.</p>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">User Identity Directory</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((u: AdminUser) => (
                                <tr key={u._id} className="hover:bg-slate-50 transition group">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{u._id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                            u.role === 'organizer' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'verifier' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {u.role !== 'admin' && (
                                            <>
                                                <select 
                                                    className="text-xs border-slate-200 rounded p-1 outline-none text-slate-600 bg-transparent text-right"
                                                    value={u.role}
                                                    onChange={(e) => updateRoleMutation.mutate({ id: u._id, role: e.target.value })}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="organizer">Organizer</option>
                                                    <option value="verifier">Verifier</option>
                                                </select>
                                                <button onClick={() => {
                                                    if (window.confirm("Are you sure you want to permanently delete this user?")) deleteUserMutation.mutate(u._id)
                                                }} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-md transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Events Management Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Platform Event Directory</h3>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Venue</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.map((e: EventData) => (
                                <tr key={e._id} className="hover:bg-slate-50 transition group">
                                    <td className="px-6 py-4 font-medium text-slate-900">{e.name}</td>
                                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{e.venue}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(e.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <button onClick={() => {
                                            if (window.confirm("DELETE EVENT FOREVER?")) deleteEventMutation.mutate(e._id)
                                        }} className="text-red-500 inline-flex hover:text-red-700 bg-red-50 p-2 rounded-md transition-colors opacity-0 group-hover:opacity-100 relative z-0">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Global Ticket Ledger Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Global Ticket Ledger</h3>
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-50 border-b border-slate-200 shadow-sm">
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket ID</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tickets.map((t: TicketData) => (
                                <tr key={t._id} className="hover:bg-slate-50 transition group">
                                    <td className="px-6 py-4 font-mono text-xs text-indigo-500 font-bold group/ticket relative">
                                        <div className="flex items-center gap-2">
                                            <span>{t.ticketId.substring(0, 12)}...</span>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(t.ticketId);
                                                    toast.success("Full ticket ID copied to clipboard!");
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-200 shadow-sm"
                                                title="Copy full ID"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-medium truncate max-w-[200px]">{t.eventId ? t.eventId.name : "DELETED EVENT"}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{t.userId ? t.userId.email : "UNKNOWN USER"}</td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <span className={`px-2 py-1 rounded outline outline-1 text-xs font-bold uppercase ${t.status === 'valid' ? 'bg-emerald-50 text-emerald-700 outline-emerald-200' :
                                                t.status === 'used' ? 'bg-amber-50 text-amber-700 outline-amber-200' :
                                                    'bg-red-50 text-red-700 outline-red-200'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
