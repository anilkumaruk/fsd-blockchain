import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Credential from '../models/Credential.js';
import { requireStudent } from '../middleware/auth.js';

const router = Router();

// Student IDs are matched case-insensitively against credential records.
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

function sessionFor(student) {
  const token = jwt.sign(
    { sub: student._id.toString(), role: 'student', studentId: student.studentId },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token, student: student.toJSON() };
}

// POST /api/student/register  { studentId, credentialId, email, password } -> { token, student }
// The student proves who they are with a Credential ID their institution issued to them.
router.post('/register', async (req, res, next) => {
  try {
    const { studentId, credentialId, email, password } = req.body || {};
    const sid = studentId?.trim().toUpperCase();
    const cid = credentialId?.trim().toUpperCase();
    if (!sid || !cid || !password) {
      return res.status(400).json({ message: 'Student ID, Credential ID and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const credential = await Credential.findOne({ credentialId: cid });
    if (!credential || credential.studentId.toUpperCase() !== sid) {
      return res.status(400).json({ message: 'That Credential ID was not issued to this Student ID.' });
    }
    if (await Student.exists({ studentId: sid })) {
      return res.status(409).json({ message: 'An account already exists for this Student ID. Please sign in.' });
    }

    const student = await Student.create({
      studentId: sid,
      name: credential.studentName,
      email: email?.trim() || '',
      passwordHash: await Student.hashPassword(password),
    });
    res.status(201).json(sessionFor(student));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'An account already exists for this Student ID.' });
    next(err);
  }
});

// POST /api/student/login  { studentId, password } -> { token, student }
router.post('/login', async (req, res, next) => {
  try {
    const { studentId, password } = req.body || {};
    if (!studentId?.trim() || !password) {
      return res.status(400).json({ message: 'Enter both your Student ID and password.' });
    }
    const student = await Student.findOne({ studentId: studentId.trim().toUpperCase() });
    if (!student || !(await student.checkPassword(password))) {
      return res.status(401).json({ message: 'Invalid Student ID or password.' });
    }
    res.json(sessionFor(student));
  } catch (err) {
    next(err);
  }
});

// GET /api/student/me/credentials  (student) -> the signed-in student's credentials
router.get('/me/credentials', requireStudent, async (req, res, next) => {
  try {
    const list = await Credential.find({ studentId: req.studentId })
      .collation(CASE_INSENSITIVE)
      .sort({ createdAt: -1, _id: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

export default router;
