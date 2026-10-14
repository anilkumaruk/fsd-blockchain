import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Credential from '../models/Credential.js';
import { requireStudent } from '../middleware/auth.js';

const router = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEWEST_FIRST = { createdAt: -1, _id: -1 };

function sessionFor(student) {
  const token = jwt.sign(
    { sub: student._id.toString(), role: 'student', email: student.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token, student: student.toJSON() };
}

// POST /api/student/register  { name, email, password } -> { token, student }
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    const mail = email?.trim().toLowerCase();
    if (!name?.trim() || !mail || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (!EMAIL_PATTERN.test(mail)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (await Student.exists({ email: mail })) {
      return res.status(409).json({ message: 'An account already exists for this email. Please sign in.' });
    }

    const student = await Student.create({
      name: name.trim(),
      email: mail,
      passwordHash: await Student.hashPassword(password),
    });
    res.status(201).json(sessionFor(student));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'An account already exists for this email.' });
    next(err);
  }
});

// POST /api/student/login  { email, password } -> { token, student }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Enter both your email and password.' });
    }
    const student = await Student.findOne({ email: email.trim().toLowerCase() });
    if (!student || !(await student.checkPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    res.json(sessionFor(student));
  } catch (err) {
    next(err);
  }
});

// GET /api/student/me/credentials  (student) -> credentials from every institution
// that issued to this student's email
router.get('/me/credentials', requireStudent, async (req, res, next) => {
  try {
    res.json(await Credential.find({ studentEmail: req.studentEmail }).sort(NEWEST_FIRST));
  } catch (err) {
    next(err);
  }
});

// GET /api/student/profile/:profileId  (public) -> shareable Academic Passport.
// Never exposes the student's email.
router.get('/profile/:profileId', async (req, res, next) => {
  try {
    const student = await Student.findOne({ profileId: req.params.profileId });
    if (!student) return res.status(404).json({ message: 'Profile not found' });
    const credentials = await Credential.find({ studentEmail: student.email })
      .select('-studentEmail')
      .sort(NEWEST_FIRST);
    res.json({ profileId: student.profileId, name: student.name, credentials });
  } catch (err) {
    next(err);
  }
});

export default router;
