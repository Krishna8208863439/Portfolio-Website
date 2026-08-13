import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Visitor, Project } from '@/lib/models';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        {
          totalVisitors: 0,
          identifiedVisitors: 0,
          skippedVisitors: 0,
          totalProjects: 0,
          databaseStatus: 'Disconnected',
        },
        { status: 200 }
      );
    }

    const [totalVisitors, identifiedVisitors, skippedVisitors, totalProjects] =
      await Promise.all([
        Visitor.countDocuments(),
        Visitor.countDocuments({ status: 'identified' }),
        Visitor.countDocuments({ status: 'skipped' }),
        Project.countDocuments(),
      ]);

    return NextResponse.json(
      {
        totalVisitors,
        identifiedVisitors,
        skippedVisitors,
        totalProjects,
        databaseStatus: 'Connected',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { message: 'Error fetching stats from MongoDB.', error: String(error) },
      { status: 500 }
    );
  }
}
