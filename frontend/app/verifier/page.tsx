"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { QrCode, CheckCircle2, XCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function VerifierDashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [scanResult, setScanResult] = useState<any>(null);

    const validateMutation = useMutation({
        mutationFn: async (qrData: string) => {
            const response = await api.post("/tickets/validate", { qrData });
            return response.data;
        },
        onSuccess: (data) => {
            setScanResult({
                success: true,
                message: data.message,
                ticket: data.data,
            });
            toast.success(data.message);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
            setScanResult({
                success: false,
                message: err.response?.data?.message || "Invalid QR Code",
            });
            toast.error(err.response?.data?.message || "Invalid QR Code");
        }
    });

    useEffect(() => {
        // Initialize exactly one instance of the scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        const onScanSuccess = (decodedText: string) => {
            // Prevent rapid consecutive scans while one is validating or we just showed a result
            if (!validateMutation.isPending && !scanResult) {
                validateMutation.mutate(decodedText);
            }
        };

        const onScanFailure = () => {
            // Usually fails constantly when no QR is in view, we ignore generic failures
        };

        scanner.render(onScanSuccess, onScanFailure);

        // Cleanup scanner on component unmount
        return () => {
            scanner.clear().catch(console.error);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scanResult]); // Re-initialize only if scanResult changes to re-mount logic if needed

    const resetScanner = () => {
        setScanResult(null);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <QrCode className="h-8 w-8 text-indigo-600" /> Gate Scanner
                </h1>
                <p className="text-slate-500 mt-2">Point camera at attendee QR codes to validate entry.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Scanner Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 font-semibold text-slate-700">
                        Live Camera Feed
                    </div>
                    <div className="p-4 relative">
                        {/* HTML5-QRCode auto-injects the video element here */}
                        <div id="reader" className="w-full h-full rounded-lg overflow-hidden border-2 border-dashed border-slate-300"></div>

                        {validateMutation.isPending && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center m-4 rounded-lg z-10">
                                <div className="text-indigo-600 font-bold animate-pulse">Validating Server Signature...</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 font-semibold text-slate-700">
                        Validation Result
                    </div>

                    <div className="p-6 flex-grow flex flex-col items-center justify-center text-center">
                        {!scanResult ? (
                            <div className="text-slate-400 p-8">
                                <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Waiting for scan...</p>
                            </div>
                        ) : scanResult.success ? (
                            <div className="p-6 w-full animate-in zoom-in-95 duration-300 rounded-xl bg-emerald-50 border border-emerald-100">
                                <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-emerald-700 mb-2">ACCESS GRANTED</h3>
                                <p className="text-emerald-600 font-medium">{scanResult.message}</p>
                                <div className="mt-6 pt-6 border-t border-emerald-200/50 text-emerald-800 text-sm grid grid-cols-2 gap-2 text-left bg-white/50 p-4 rounded-lg">
                                    <span className="font-semibold text-emerald-900 border-b border-emerald-100 pb-1 col-span-2">Ticket Info</span>
                                    <span>ID: <code className="bg-emerald-100 px-1 rounded">{scanResult.ticket?.ticketId.substring(0, 8)}</code></span>
                                    <span>Status: <strong>{scanResult.ticket?.status}</strong></span>
                                </div>
                                <button onClick={resetScanner} className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-sm">
                                    Scan Next Ticket
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 w-full animate-in zoom-in-95 duration-300 rounded-xl bg-red-50 border border-red-100">
                                <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-red-700 mb-2">ACCESS DENIED</h3>
                                <p className="text-red-600 font-medium">{scanResult.message}</p>
                                <button onClick={resetScanner} className="mt-8 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition shadow-sm">
                                    Acknowledge & Reset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
