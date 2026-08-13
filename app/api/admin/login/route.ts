import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@portfolio.com';
// Default password fallback: 'admin123'
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-portfolio-2026';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ message: 'Invalid admin credentials.' }, { status: 401 });
    }

    const isValidPassword =
      bcrypt.compareSync(password, ADMIN_PASSWORD_HASH) ||
      password === (process.env.ADMIN_PASSWORD || 'admin123');

    if (!isValidPassword) {
      return NextResponse.json({ message: 'Invalid admin credentials.' }, { status: 401 });
    }

    const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, {
      expiresIn: '24h',
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Admin authentication successful.',
        token,
      },
      { status: 200 }
    );

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error during admin login.' },
      { status: 500 }
    );
  }
}
