import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { ContactMessage } from '@/lib/models';
import { getContactMessages, deleteContactMessage } from '@/lib/contactStore';

function verifyAdminToken(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-portfolio-2026';
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    let messages: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      subject?: string;
      message: string;
      createdAt: string;
    }> = [];

    // Try fetching from MongoDB first
    try {
      const db = await connectToDatabase();
      if (db) {
        const dbMsgs = await ContactMessage.find().sort({ createdAt: -1 }).lean();
        if (dbMsgs && dbMsgs.length > 0) {
          messages = dbMsgs.map((m) => ({
            id: String(m._id),
            name: m.name,
            email: m.email,
            phone: m.phone || undefined,
            subject: m.subject || undefined,
            message: m.message,
            createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
          }));
        }
      }
    } catch (dbErr) {
      console.warn('MongoDB message fetch skipped:', dbErr);
    }

    // Combine with memoryStore if DB is empty or fallback
    if (messages.length === 0) {
      messages = getContactMessages();
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing message ID' }, { status: 400 });
    }

    deleteContactMessage(id);

    try {
      const db = await connectToDatabase();
      if (db) {
        await ContactMessage.findByIdAndDelete(id);
      }
    } catch {
      // Ignore DB errors if not connected
    }

    return NextResponse.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
