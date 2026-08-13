import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Visitor } from '@/lib/models';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json([], { status: 200 });
    }

    const distribution = await Visitor.aggregate([
      { $match: { status: 'identified', role: { $ne: null } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json(distribution, { status: 200 });
  } catch (error) {
    console.error('Error fetching role distribution:', error);
    return NextResponse.json([], { status: 500 });
  }
}
