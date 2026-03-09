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

export const sendTicketEmail = async (to: string, tickets: any[], eventDetails: any) => {
    try {
        const attachments = await Promise.all(
            tickets.map(async (ticket) => {
                // Generate QR code buffer as a PNG image
                const qrBuffer = await QRCode.toBuffer(ticket.qrData, {
                    type: 'png' as any,
                    margin: 4,
                    width: 300
                });

                return {
                    filename: `ticket_${ticket.ticketId}.png`,
                    content: qrBuffer,
                };
            })
        );

        const mailOptions = {
            from: `"StagePass" <${process.env.SMTP_USER}>`,
            to,
            subject: `Your Tickets for ${eventDetails.name}`,
            text: `Thank you for your purchase!\n\nEvent: ${eventDetails.name}\nDate: ${eventDetails.date ? new Date(eventDetails.date).toDateString() : ''}\nVenue: ${eventDetails.venue || ''}\n\nPlease find your tickets with QR codes attached.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Thank you for your purchase!</h2>
                    <p>You have successfully purchased tickets for <strong>${eventDetails.name}</strong>.</p>
                    <p><strong>Date:</strong> ${eventDetails.date ? new Date(eventDetails.date).toDateString() : ''}</p>
                    <p><strong>Venue:</strong> ${eventDetails.venue || ''}</p>
                    <p>Please find your ticket QR codes attached to this email. You will need to show these at the entry gate.</p>
                    <br/>
                    <p>Best regards,<br/>StagePass Team</p>
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
