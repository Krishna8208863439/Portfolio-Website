import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'resume.pdf');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'Resume file not found.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Final_Resume.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving resume:', error);
    return NextResponse.json({ message: 'Failed to retrieve resume' }, { status: 500 });
  }
}
