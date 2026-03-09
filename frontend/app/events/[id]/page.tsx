"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Info, ChevronLeft, Ticket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function EventDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [quantity, setQuantity] = useState(1);

    // Check login state to decide UI flow (Buy vs Login)
    const isLogged = !!Cookies.get("accessToken");

    // Fetch Event Details
    const { data, isLoading, isError } = useQuery({
        queryKey: ["event", params.id],
        queryFn: async () => {
            const response = await api.get(`/events/${params.id}`);
            return response.data;
        },
    });

    // Purchase Mutation
    const purchaseMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post("/tickets/purchase", {
                eventId: params.id,
                quantity,
            });
            return response.data;
        },
        onSuccess: (data) => {
            if (data.emailSent === false) {
                toast.error("Tickets purchased and available in your dashboard, but we couldn't send the email.", { duration: 6000 });
            } else {
                toast.success(data.message);
            }
            // Force refresh on My Tickets if they navigate to dashboard
            queryClient.invalidateQueries({ queryKey: ["myTickets"] });
            router.push("/dashboard");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to purchase tickets");
        }
    });

    const handlePurchase = () => {
        if (!isLogged) {
            toast.error("You must be logged in to buy tickets.");
            router.push("/login");
            return;
        }

        // Prevent accidental double clicks
        if (purchaseMutation.isPending) return;

        purchaseMutation.mutate();
    };

    if (isLoading) return <div className="text-center py-32 animate-pulse text-slate-500 font-medium tracking-wide">Retrieving event info...</div>;

    if (isError || !data?.data) return (
        <div className="text-center py-32">
            <h2 className="text-2xl font-bold text-slate-800">Event Not Found</h2>
            <p className="text-slate-500 mt-2">The event you are looking for does not exist or has been removed.</p>
            <Link href="/" className="text-indigo-600 hover:underline mt-4 inline-block font-medium">← Back to discovery</Link>
        </div>
    );

    const event = data.data;
    const totalPrice = event.price * quantity;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to all events
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Main Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-64 sm:h-96 relative overflow-hidden rounded-2xl shadow-lg bg-slate-900 group">
                        {event.images && event.images.length > 0 ? (
                            <img
                                src={`http://localhost:5000${event.images[0]}`}
                                alt={event.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-900 to-purple-900" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                        {/* Text Overlay for dramatic effect */}
                        <div className="absolute bottom-8 left-8 right-8">
                            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                Official Event
                            </span>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-4 drop-shadow-md leading-tight">
                                {event.name}
                            </h1>
                        </div>
                    </div>

                    {event.images && event.images.length > 1 && (
                        <div className="grid grid-cols-2 gap-4">
                            {event.images.slice(1, 3).map((imgUrl: string, idx: number) => (
                                <div key={idx} className="h-40 sm:h-48 rounded-2xl overflow-hidden shadow-sm">
                                    <img
                                        src={`http://localhost:5000${imgUrl}`}
                                        alt={`Event photo ${idx + 2}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">About this Event</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                    <Calendar className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">Date and Time</h4>
                                    <p className="text-slate-600 mt-1">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>
                                    <p className="text-slate-500 text-sm">{format(new Date(event.date), "h:mm a")}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                    <MapPin className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">Location</h4>
                                    <p className="text-slate-600 mt-1 leading-relaxed">{event.venue}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 sm:col-span-2">
                                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                    <Users className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">Event Capacity</h4>
                                    <p className="text-slate-600 mt-1">Strictly limited to {event.capacity} total attendees to ensure security and comfort.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 text-slate-600 text-sm leading-relaxed space-y-4">
                            <p>
                                Ensure you have your QR code ready on your device when arriving at the venue. The gate verifiers will quickly scan your StagePass digital ticket for seamless entry.
                            </p>
                            <div className="flex p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <Info className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
                                <p className="text-amber-800 text-xs font-medium">Please note that all ticket sales are final. Screenshots of QR codes are valid as long as they belong strictly to you and haven't been scanned prior.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Checkout Panel */}
                <div className="lg:col-span-1 border-l-0 lg:border-l border-slate-200 pl-0 lg:pl-8">
                    <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-6">Select Tickets</h3>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                            <span className="font-medium text-slate-700">General Admission</span>
                            <span className="font-bold text-xl text-slate-900">{event.price === 0 ? "Free" : `$${event.price}`}</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-slate-700 mb-2 font-semibold">Quantity (Max 10)</label>
                                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden h-12">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="w-12 h-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition flex items-center justify-center border-r border-slate-300 cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center font-bold text-lg text-slate-900 bg-white">
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={() => setQuantity(q => Math.min(event.ticketsLeft > 0 ? Math.min(10, event.ticketsLeft) : 10, q + 1))}
                                        disabled={quantity >= event.ticketsLeft}
                                        className="w-12 h-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition flex items-center justify-center border-l border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="text-center mt-3">
                                {event.ticketsLeft > 0 ? (
                                    <span className="inline-flex items-center text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                        <Ticket className="h-4 w-4 mr-1.5" />
                                        Only {event.ticketsLeft} tickets left!
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                                        Sold Out!
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Subtotal</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Fees</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between items-center font-bold text-lg text-slate-900 pt-4 border-t border-slate-200">
                                <span>Total</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePurchase}
                            disabled={purchaseMutation.isPending || event.ticketsLeft === 0}
                            className="mt-8 w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {purchaseMutation.isPending ? (
                                "Processing..."
                            ) : event.ticketsLeft === 0 ? (
                                "Sold Out"
                            ) : (
                                <>
                                    <Ticket className="h-5 w-5 mr-2" />
                                    {isLogged ? "Checkout" : "Sign in to Buy"}
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-4">Safe & Encrypted Transaction via StagePass</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
