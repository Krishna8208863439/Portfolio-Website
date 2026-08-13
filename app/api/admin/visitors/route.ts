import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Visitor } from '@/lib/models';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ visitors: [], totalPages: 0, totalCount: 0, page }, { status: 200 });
    }

    const [visitors, totalCount] = await Promise.all([
      Visitor.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Visitor.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json(
      {
        visitors,
        totalPages,
        totalCount,
        page,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching visitor logs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch visitor logs', error: String(error) },
      { status: 500 }
    );
  }
}
