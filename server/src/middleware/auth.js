import jwt from 'jsonwebtoken';

// Protects registrar-only routes (issue / revoke). Expects "Authorization: Bearer <token>".
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Sign in required.' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Session expired — please sign in again.' });
  }
}
