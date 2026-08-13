import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Visitor } from '@/lib/models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, status } = body;

    if (!status || !['identified', 'skipped'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status parameter' }, { status: 400 });
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';

    const db = await connectToDatabase();

    let visitorDoc = null;
    if (db) {
      visitorDoc = await Visitor.create({
        name: status === 'identified' ? name || 'Anonymous' : null,
        role: status === 'identified' ? role || 'Not Specified' : null,
        status,
        ipAddress,
        userAgent,
        referrer,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Visitor logged successfully',
        visitor: visitorDoc,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error logging visitor:', error);
    return NextResponse.json(
      { message: 'Failed to log visitor', error: String(error) },
      { status: 500 }
    );
  }
}
