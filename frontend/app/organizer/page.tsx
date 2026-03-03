"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Calendar, Users, MapPin, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface EventData {
    _id: string;
    name: string;
    date: string;
    venue: string;
    capacity: number;
    price: number;
}

export default function OrganizerDashboard() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        venue: "",
        capacity: 100,
        price: 0,
    });

    // Fetch all events. Ideally, an organizer dashboard should have a specific endpoint like /events/my-events
    // But due to spec lacking it, we'll fetch all and they'll visually see them all. In prod, filter by ID or build specific endpoint.
    const { data, isLoading } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await api.get("/events");
            return response.data;
        },
    });

    // Mutation to create new event
    const createMutation = useMutation({
        mutationFn: async (newEvent: any) => {
            const response = await api.post("/events", newEvent);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Event created successfully!");
            setFormData({ name: "", date: "", venue: "", capacity: 100, price: 0 });
            setIsModalOpen(false);
            // Invalidate the cache to force refetch
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to create event");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const events = data?.data || [];

    return (
        <div className="space-y-8 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organizer Dashboard</h1>
                    <p className="text-slate-500 mt-2">Manage your events and track capacities.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-20 animate-pulse text-slate-400">Loading events...</div>
            ) : events.length === 0 ? (
                <div className="bg-white border rounded-lg p-12 text-center shadow-sm">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No events found</h3>
                    <p className="text-slate-500 mt-1">Get started by creating your first event.</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-900">Event Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-900">Date & Time</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-900">Venue</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-900">Capacity</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-900">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.map((event: EventData) => (
                                <tr key={event._id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4 font-medium text-slate-900">{event.name}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {format(new Date(event.date), "MMM d, yyyy h:mm a")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            {event.venue}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-slate-400" />
                                            {event.capacity}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-slate-400" />
                                            {event.price === 0 ? "Free" : event.price}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Simple Modal overlay for Creating Event */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Create New Event</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                                <input
                                    type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                                <input
                                    type="datetime-local" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Venue</label>
                                <input
                                    type="text" required value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                                    <input
                                        type="number" min="1" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ticket Price ($)</label>
                                    <input
                                        type="number" min="0" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 rounded-md transition border">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition disabled:opacity-50">
                                    {createMutation.isPending ? "Saving..." : "Create Event"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
