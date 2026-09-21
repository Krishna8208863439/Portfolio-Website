import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), 'public', 'Krishna_Resume.pdf'),
      path.join(process.cwd(), 'Krishna_Resume.pdf'),
      path.join(process.cwd(), 'public', 'resume.pdf'),
    ];
    let filePath = '';
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return NextResponse.json({ message: 'Resume file not found.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Krishna_Resume.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving resume:', error);
    return NextResponse.json({ message: 'Failed to retrieve resume' }, { status: 500 });
  }
}
