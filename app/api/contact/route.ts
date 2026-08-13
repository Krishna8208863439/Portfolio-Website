import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { connectToDatabase } from '@/lib/mongodb';
import { ContactMessage } from '@/lib/models';
import { addContactMessage } from '@/lib/contactStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Basic Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: 'Missing required fields (name, email, message).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    // Always store in memory store for local admin dashboard
    addContactMessage({ name, email, phone, subject, message });

    // Save copy to MongoDB if available
    try {
      const db = await connectToDatabase();
      if (db) {
        await ContactMessage.create({
          name,
          email,
          phone,
          subject,
          message,
        });
      }
    } catch (dbErr) {
      console.warn('Could not save contact message to DB:', dbErr);
    }

    // SMTP Nodemailer configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let emailSent = false;

    if (smtpHost && smtpUser && smtpPass && smtpPass !== 'app-password-here') {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: `"${name}" <${smtpUser}>`,
          to: process.env.CONTACT_RECEIVER_EMAIL || 'krishnadevadkar@gmail.com',
          replyTo: email,
          subject: subject ? `Portfolio Inquiry: ${subject}` : `New Portfolio Inquiry from ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2563eb;">New Portfolio Contact Request</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
              <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <h3 style="color: #1e293b;">Message:</h3>
              <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 8px;">${message}</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (mailErr) {
        console.warn('SMTP Email delivery failed (logging submission instead):', mailErr);
      }
    }

    if (!emailSent) {
      console.log('--- [CONTACT FORM SUBMISSION RECEIVED] ---');
      console.log(`From: ${name} (${email})`);
      console.log(`Phone: ${phone || 'N/A'}`);
      console.log(`Subject: ${subject || 'N/A'}`);
      console.log(`Message: ${message}`);
      console.log('-------------------------------------------');
    }

    return NextResponse.json(
      { success: true, message: 'Message received successfully!' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error while sending message.' },
      { status: 500 }
    );
  }
}
