import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = Router();

function sessionFor(admin) {
  const token = jwt.sign(
    { sub: admin._id.toString(), username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token, admin: { username: admin.username, displayName: admin.displayName } };
}

// POST /api/auth/register  { username, password, displayName } -> { token, admin }
// The plain-text password is hashed with bcrypt here; only the hash is stored.
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, displayName } = req.body || {};
    const name = username?.trim().toLowerCase();
    if (!name || !password) {
      return res.status(400).json({ message: 'Enter both a username and password.' });
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(name)) {
      return res.status(400).json({ message: 'Username must be 3–30 letters, numbers, dots, dashes or underscores.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (await Admin.exists({ username: name })) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }

    const admin = await Admin.create({
      username: name,
      passwordHash: await Admin.hashPassword(password),
      displayName: displayName?.trim() || 'Registrar',
    });
    res.status(201).json(sessionFor(admin));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That username is already taken.' });
    next(err);
  }
});

// POST /api/auth/login  { username, password } -> { token, admin }
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username?.trim() || !password) {
      return res.status(400).json({ message: 'Enter both a username and password.' });
    }

    const admin = await Admin.findOne({ username: username.trim().toLowerCase() });
    if (!admin || !(await admin.checkPassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    res.json(sessionFor(admin));
  } catch (err) {
    next(err);
  }
});

export default router;
