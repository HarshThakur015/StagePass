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

// Helper: format a Date to "YYYY-MM-DDTHH:MM" for datetime-local input
function toDatetimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function OrganizerDashboard() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        venue: "",
        capacity: 100,
        price: 0,
    });

    // --- Date restriction bounds ---
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3); // at least 3 days from now

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // at most 3 months from now

    const minDateStr = toDatetimeLocal(minDate);
    const maxDateStr = toDatetimeLocal(maxDate);
    // --------------------------------

    const { data, isLoading } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await api.get("/events");
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newFormData: FormData) => {
            // Do NOT set explicit Content-Type header. Axios automatically sets it with the correct boundary for FormData!
            const response = await api.post("/events", newFormData);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Event created successfully!");
            setFormData({ name: "", date: "", venue: "", capacity: 100, price: 0 });
            setSelectedFiles([]);
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to create event");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedFiles.length < 1 || selectedFiles.length > 3) {
            toast.error("Please select between 1 and 3 photos for the event.");
            return;
        }

        const submissionData = new FormData();
        submissionData.append("name", formData.name);
        submissionData.append("date", formData.date);
        submissionData.append("venue", formData.venue);
        submissionData.append("capacity", formData.capacity.toString());
        submissionData.append("price", formData.price.toString());

        selectedFiles.forEach((file) => {
            submissionData.append("images", file);
        });

        createMutation.mutate(submissionData);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            setSelectedFiles(prev => {
                const combined = [...prev, ...newFiles];
                if (combined.length > 3) {
                    toast.error("Maximum 3 photos allowed. Extra files were ignored.");
                    return combined.slice(0, 3);
                }
                return combined;
            });

            // Output value cleared so user can select another file seamlessly
            e.target.value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
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

                            {/* FIX: min = today+3days, max = today+3months */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    min={minDateStr}
                                    max={maxDateStr}
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 border focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">Must be between 3 days and 3 months from today.</p>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Event Photos (1-3 Required)
                                    {selectedFiles.length > 0 && (
                                        <span className="ml-2 text-indigo-600 font-bold">{selectedFiles.length} selected</span>
                                    )}
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-slate-50 transition">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                <span>Upload files</span>
                                                {/* FIX: removed required, validation is handled in handleSubmit via JS */}
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                                    </div>
                                </div>

                                {/* Preview selected files with remove option */}
                                {selectedFiles.length > 0 && (
                                    <ul className="mt-3 space-y-1">
                                        {selectedFiles.map((file, idx) => (
                                            <li key={idx} className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
                                                <span className="truncate max-w-[80%]">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx)}
                                                    className="text-red-400 hover:text-red-600 font-bold ml-2"
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
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