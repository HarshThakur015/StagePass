// @ts-ignore
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Generate complete ticket as SVG
const generateTicketSVG = (ticket: any, eventDetails: any) => {
    const statusColor = ticket.status === 'valid' ? '#10b981' : ticket.status === 'used' ? '#f59e0b' : '#ef4444';
    
    return `
    <svg width="600" height="800" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="stubGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#f1f5f9;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.1"/>
            </filter>
        </defs>
        
        <!-- Background -->
        <rect width="600" height="800" fill="white" stroke="#e0e7ff" stroke-width="2" rx="16"/>
        
        <!-- Decorative corner holes -->
        <circle cx="-8" cy="-8" r="8" fill="#4f46e5"/>
        <circle cx="608" cy="-8" r="8" fill="#4f46e5"/>
        <circle cx="-8" cy="808" r="8" fill="#4f46e5"/>
        <circle cx="608" cy="808" r="8" fill="#4f46e5"/>
        
        <!-- Header with StagePass Branding -->
        <rect width="600" height="120" fill="url(#headerGradient)"/>
        <circle cx="550" cy="60" r="64" fill="rgba(255,255,255,0.1)"/>
        
        <!-- StagePass Logo Area -->
        <rect x="20" y="20" width="200" height="80" fill="rgba(255,255,255,0.2)" rx="8"/>
        <text x="30" y="45" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">StagePass</text>
        <text x="30" y="65" font-family="Arial, sans-serif" font-size="12" fill="#c7d2fe">Premium Event Access</text>
        
        <!-- Status Badge -->
        <rect x="480" y="25" width="100" height="30" fill="${statusColor}" rx="15"/>
        <text x="530" y="45" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">${ticket.status.toUpperCase()}</text>
        
        <!-- Event Details Section -->
        <rect y="120" width="600" height="250" fill="white"/>
        <rect y="120" width="600" height="250" fill="url(#bodyGradient)" opacity="0.5"/>
        
        <text x="30" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1e293b">${eventDetails.name || "Event Unavailable"}</text>
        
        <!-- Date Icon and Text -->
        <rect x="30" y="190" width="40" height="40" fill="#e0e7ff" rx="8"/>
        <text x="50" y="215" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#4f46e5">📅</text>
        <text x="80" y="205" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#1e293b">${eventDetails.date ? new Date(eventDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "TBA"}</text>
        <text x="80" y="225" font-family="Arial, sans-serif" font-size="12" fill="#64748b">${eventDetails.date ? new Date(eventDetails.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "TBA"}</text>
        
        <!-- Venue Icon and Text -->
        <rect x="30" y="250" width="40" height="40" fill="#f3e8ff" rx="8"/>
        <text x="50" y="275" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#7c3aed">📍</text>
        <text x="80" y="275" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#1e293b">${eventDetails.venue || "Venue TBA"}</text>
        
        <!-- QR Code Section -->
        <rect y="370" width="600" height="280" fill="white" stroke="#f1f5f9" stroke-width="1"/>
        
        <!-- QR Code Placeholder (will be replaced with actual QR) -->
        <rect x="30" y="390" width="150" height="150" fill="#f8fafc" rx="12"/>
        <text x="105" y="470" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#64748b">QR Code</text>
        
        <!-- Ticket ID -->
        <text x="30" y="560" font-family="monospace" font-size="12" fill="#64748b">Ticket ID: ${ticket.ticketId.substring(0, 12)}...</text>
        <text x="30" y="580" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">Scan for entry</text>
        
        <!-- Purchase Info -->
        <text x="420" y="420" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">PRICE</text>
        <text x="420" y="450" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#1e293b" text-anchor="middle">${eventDetails.price === 0 ? "FREE" : `$${eventDetails.price}`}</text>
        
        <text x="420" y="500" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">PURCHASED</text>
        <text x="420" y="525" font-family="Arial, sans-serif" font-size="14" fill="#475569" text-anchor="middle">${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</text>
        
        <!-- Ticket Stub -->
        <rect y="650" width="600" height="150" fill="url(#stubGradient)"/>
        <line x1="0" y1="650" x2="600" y2="650" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="5,5"/>
        
        <!-- StagePass Brand in Stub -->
        <rect x="30" y="680" width="120" height="30" fill="#4f46e5" rx="4"/>
        <text x="90" y="700" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">STAGEPASS</text>
        <text x="30" y="730" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Official Ticket</text>
        
        <!-- Ticket Number -->
        <text x="550" y="720" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle">#${ticket.ticketId.substring(0, 8).toUpperCase()}</text>
    </svg>
    `;
};

export const sendTicketEmail = async (to: string, tickets: any[], eventDetails: any) => {
    try {
        const attachments = await Promise.all(
            tickets.map(async (ticket) => {
                // Generate QR code as base64 for embedding in SVG
                const qrBuffer = await QRCode.toBuffer(ticket.qrData, {
                    type: 'png' as any,
                    margin: 1,
                    width: 150
                });
                const qrBase64 = qrBuffer.toString('base64');
                
                // Generate complete ticket SVG with embedded QR code
                const ticketSVG = generateTicketSVG(ticket, eventDetails).replace(
                    '<text x="105" y="470" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#64748b">QR Code</text>',
                    `<image x="30" y="390" width="150" height="150" href="data:image/png;base64,${qrBase64}"/>`
                );

                // Convert SVG to buffer
                const ticketBuffer = Buffer.from(ticketSVG, 'utf-8');

                return {
                    filename: `ticket_${ticket.ticketId}.svg`,
                    content: ticketBuffer,
                };
            })
        );

        const mailOptions = {
            from: `"StagePass" <${process.env.SMTP_USER}>`,
            to,
            subject: `Your Tickets for ${eventDetails.name}`,
            text: `Thank you for your purchase!\n\nEvent: ${eventDetails.name}\nDate: ${eventDetails.date ? new Date(eventDetails.date).toDateString() : ''}\nVenue: ${eventDetails.venue || ''}\n\nYour full aesthetic tickets are attached to this email.`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f8fafc;">
                    <div style="max-width: 800px; margin: 0 auto;">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="color: #1e293b; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">🎫 Your Tickets Are Ready!</h1>
                            <p style="color: #64748b; font-size: 18px; margin: 0;">Thank you for choosing StagePass for your event experience</p>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h3 style="color: #1e293b; margin: 0 0 16px 0;">Event Details</h3>
                            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 400px; margin: 0 auto;">
                                <p style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0 0 8px 0;">${eventDetails.name}</p>
                                <p style="color: #64748b; margin: 0 0 4px 0;">📅 ${eventDetails.date ? new Date(eventDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "TBA"}</p>
                                <p style="color: #64748b; margin: 0 0 4px 0;">🕐 ${eventDetails.date ? new Date(eventDetails.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "TBA"}</p>
                                <p style="color: #64748b; margin: 0 0 16px 0;">📍 ${eventDetails.venue || "Venue TBA"}</p>
                                <p style="font-size: 20px; font-weight: bold; color: #1e293b; margin: 0;">Price: ${eventDetails.price === 0 ? "FREE" : `$${eventDetails.price}`}</p>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 32px; padding: 24px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <h3 style="color: #1e293b; margin: 0 0 16px 0;">📧 Your Complete Tickets</h3>
                            <p style="color: #64748b; margin: 0 0 16px 0;">Your aesthetic tickets with QR codes are attached to this email as SVG files. You can open them on any device or print them.</p>
                            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                                <p style="color: #92400e; margin: 0; font-size: 14px;">
                                    <strong>Note:</strong> Please have your QR codes ready when arriving at the venue. All ticket sales are final.
                                </p>
                            </div>
                            <p style="color: #475569; margin: 0;">Best regards,<br/><strong>The StagePass Team</strong></p>
                        </div>
                    </div>
                </div>
            `,
            attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: ", info.messageId);
        return { success: true, info };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
};
