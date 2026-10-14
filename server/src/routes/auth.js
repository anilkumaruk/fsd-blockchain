import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = Router();

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

    const token = jwt.sign(
      { sub: admin._id.toString(), username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, admin: { username: admin.username, displayName: admin.displayName } });
  } catch (err) {
    next(err);
  }
});

export default router;
