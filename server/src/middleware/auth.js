import jwt from 'jsonwebtoken';

function readToken(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: 'Sign in required.' });
    return null;
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401).json({ message: 'Session expired — please sign in again.' });
    return null;
  }
}

// Institution-admin routes (issue / revoke / own registry). Sets req.institutionId.
export function requireAdmin(req, res, next) {
  const payload = readToken(req, res);
  if (!payload) return;
  // Tokens issued before roles existed have no role; they were all institution tokens.
  if (payload.role && payload.role !== 'institution') {
    return res.status(403).json({ message: 'Institution admin access only.' });
  }
  req.institutionId = payload.sub;
  next();
}

// Student routes. Sets req.studentId (the student's academic ID, e.g. RGIT21CS014).
export function requireStudent(req, res, next) {
  const payload = readToken(req, res);
  if (!payload) return;
  if (payload.role !== 'student') return res.status(403).json({ message: 'Student access only.' });
  req.studentId = payload.studentId;
  next();
}
