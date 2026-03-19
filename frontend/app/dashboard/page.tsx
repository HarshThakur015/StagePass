"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { format } from "date-fns";
import { Ticket as TicketIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface TicketData {
    _id: string;
    ticketId: string;
    eventId: {
        _id: string;
        name: string;
        venue: string;
        date: string;
        price: number;
    };
    status: "valid" | "used" | "expired";
    qrData: string;
    createdAt: string;
}

export default function UserDashboard() {
    // Fetch user's tickets
    const { data, isLoading, isError } = useQuery({
        queryKey: ["myTickets"],
        queryFn: async () => {
            const response = await api.get("/tickets/my-tickets");
            return response.data;
        },
    });

    if (isLoading) {
        return <div className="text-center mt-20 text-indigo-600 font-medium animate-pulse">Loading your tickets...</div>;
    }

    if (isError) {
        return <div className="text-center mt-20 text-red-500 font-medium">Failed to load tickets. Ensure you are logged in.</div>;
    }

    const tickets = data?.data || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <TicketIcon className="h-8 w-8 text-indigo-600" /> My Tickets
                </h1>
                <p className="text-slate-500 mt-2">Manage your purchased tickets and view your QR codes for entry.</p>
            </div>

            {tickets.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
                    <TicketIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No tickets found</h3>
                    <p className="text-slate-500 mt-2">You haven&apos;t purchased any tickets yet.</p>
                    <a href="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition">
                        Browse Events
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket: TicketData) => (
                        <div key={ticket._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-200 flex flex-col">
                            {/* Event Details Header */}
                            <div className="bg-indigo-600 p-6 text-white text-center">
                                <h3 className="font-bold text-xl truncate" title={ticket.eventId?.name || "Unknown Event"}>
                                    {ticket.eventId?.name || "Event Unavailable"}
                                </h3>
                                <p className="text-indigo-100 text-sm mt-1">
                                    {ticket.eventId?.date ? format(new Date(ticket.eventId.date), "MMMM d, yyyy • h:mm a") : "TBA"}
                                </p>
                                <p className="text-indigo-200 text-xs mt-1 truncate">{ticket.eventId?.venue || "TBA"}</p>
                            </div>

                            {/* QR Code Body */}
                            <div className="p-8 flex flex-col items-center flex-grow bg-slate-50/50">
                                <div className={`p-4 bg-white rounded-xl shadow-sm border ${ticket.status === 'valid' ? 'border-indigo-100' : 'border-red-100 opacity-50 grayscale'}`}>
                                    {/* The actual dynamic QR code generation based on our secure backend hash string */}
                                    <QRCodeSVG
                                        value={ticket.qrData}
                                        size={160}
                                        level="H" // High error correction
                                        includeMargin={false}
                                    />
                                </div>

                                <div className="mt-6 text-center w-full">
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                        <span className="font-mono bg-slate-100 px-2 py-1 rounded">ID: {ticket.ticketId.substring(0, 8)}</span>
                                        <span className={`px-2 py-1 rounded-full font-bold uppercase ${ticket.status === 'valid' ? 'bg-emerald-100 text-emerald-700' :
                                                ticket.status === 'used' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
