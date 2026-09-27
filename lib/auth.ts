import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-portfolio-2026';

export function verifyAdminToken(request: Request, fallbackToken?: string): boolean {
  try {
    let token = fallbackToken;

    if (!token) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    }

    if (!token) {
      try {
        const { searchParams } = new URL(request.url);
        token = searchParams.get('token') || searchParams.get('admin_token') || null;
      } catch {
        // ignore url parsing error
      }
    }

    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/admin_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) return false;

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
    return !!(decoded && decoded.role === 'admin');
  } catch {
    return false;
  }
}
