import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-portfolio-2026';

export function verifyAdminToken(request: Request): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/admin_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) return false;

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
    return decoded && decoded.role === 'admin';
  } catch {
    return false;
  }
}
