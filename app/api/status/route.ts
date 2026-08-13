import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminConfig } from '@/lib/models';
import { verifyAdminToken } from '@/lib/auth';

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ availableForHire: true }, { status: 200 });
    }

    let config = await AdminConfig.findOne();
    if (!config) {
      config = await AdminConfig.create({ availableForHire: true });
    }

    return NextResponse.json({ availableForHire: config.availableForHire }, { status: 200 });
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json({ availableForHire: true }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { availableForHire } = body;

    const db = await connectToDatabase();
    if (db) {
      let config = await AdminConfig.findOne();
      if (!config) {
        config = await AdminConfig.create({ availableForHire: Boolean(availableForHire) });
      } else {
        config.availableForHire = Boolean(availableForHire);
        config.updatedAt = new Date();
        await config.save();
      }
    }

    return NextResponse.json({ success: true, availableForHire: Boolean(availableForHire) }, { status: 200 });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ message: 'Failed to update status' }, { status: 500 });
  }
}
