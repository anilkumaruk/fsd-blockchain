import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Institution from '../models/Institution.js';

const router = Router();

function sessionFor(institution) {
  const token = jwt.sign(
    { sub: institution._id.toString(), role: 'institution', username: institution.username },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token, institution: institution.toJSON() };
}

// POST /api/auth/register -> register a new college / university with its admin login.
// { name, code, city, email, username, password } -> { token, institution }
router.post('/register', async (req, res, next) => {
  try {
    const { name, code, city, email, username, password } = req.body || {};
    const instName = name?.trim();
    const instCode = code?.trim().toUpperCase();
    const user = username?.trim().toLowerCase();

    if (!instName || !instCode || !user || !password) {
      return res.status(400).json({ message: 'Institution name, code, admin username and password are required.' });
    }
    if (!/^[A-Z0-9]{2,12}$/.test(instCode)) {
      return res.status(400).json({ message: 'Institution code must be 2–12 letters or numbers (e.g. AU).' });
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(user)) {
      return res.status(400).json({ message: 'Username must be 3–30 letters, numbers, dots, dashes or underscores.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const nameTaken = await Institution.exists({ name: new RegExp(`^${instName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (nameTaken) return res.status(409).json({ message: 'This institution is already registered.' });
    if (await Institution.exists({ code: instCode })) {
      return res.status(409).json({ message: 'That institution code is already in use.' });
    }
    if (await Institution.exists({ username: user })) {
      return res.status(409).json({ message: 'That admin username is already taken.' });
    }

    const institution = await Institution.create({
      name: instName,
      code: instCode,
      city: city?.trim() || '',
      email: email?.trim() || '',
      username: user,
      passwordHash: await Institution.hashPassword(password),
    });
    res.status(201).json(sessionFor(institution));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'This institution is already registered.' });
    next(err);
  }
});

// POST /api/auth/login  { username, password } -> { token, institution }
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username?.trim() || !password) {
      return res.status(400).json({ message: 'Enter both a username and password.' });
    }

    const institution = await Institution.findOne({ username: username.trim().toLowerCase() });
    if (!institution || !(await institution.checkPassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    res.json(sessionFor(institution));
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/institutions -> public list of registered institutions
router.get('/institutions', async (_req, res, next) => {
  try {
    res.json(await Institution.find().sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
});

export default router;
