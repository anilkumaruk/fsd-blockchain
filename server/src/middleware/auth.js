import jwt from 'jsonwebtoken';

// Protects institution-admin routes (issue / revoke / own registry).
// Expects "Authorization: Bearer <token>"; sets req.institutionId.
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Sign in required.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.institutionId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired — please sign in again.' });
  }
}
