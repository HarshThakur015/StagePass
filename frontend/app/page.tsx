"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Search } from "lucide-react";
import { useState } from "react";

interface EventData {
  _id: string;
  name: string;
  date: string;
  venue: string;
  price: number;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["publicEvents"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data;
    },
  });

  const events = data?.data || [];

  // Basic client-side filtering
  const filteredEvents = events.filter((e: EventData) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white shadow-xl px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Find Your Next Experience
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
            Secure, verifiable, dynamic QR-based tickets to the best concerts, workshops, and gatherings worldwide.
          </p>

          <div className="mt-8 max-w-xl mx-auto bg-white/10 p-2 rounded-xl backdrop-blur-md flex shadow-sm border border-white/20 focus-within:ring-2 focus-within:ring-white transition">
            <Search className="h-6 w-6 text-indigo-100 my-auto ml-3" />
            <input
              type="text"
              placeholder="Search artists, venues, or events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none text-white placeholder-indigo-200 focus:ring-0 px-4 py-3 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Upcoming Events</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No events found</h3>
            <p className="text-slate-500">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event: EventData) => (
              <Link href={`/events/${event._id}`} key={event._id} className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {/* Abstract placeholder gradient based on ID characters */}
                  <div className="absolute inset-0 opacity-80" style={{
                    background: `linear-gradient(45deg, #${event._id.substring(0, 3)}000, #${event._id.substring(3, 6)}000)`
                  }}></div>
                  <Calendar className="h-16 w-16 text-white mix-blend-overlay z-10" />

                  {/* Price Tag Overlay */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-slate-900 font-bold px-3 py-1 rounded-full shadow-sm z-10">
                    {event.price === 0 ? "FREE" : `$${event.price}`}
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {event.name}
                    </h3>

                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        <span>{format(new Date(event.date), "EEE, MMM d • h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-500" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-600 group-hover:underline">View tickets →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
