import { Router } from 'express';
import crypto from 'node:crypto';
import Credential from '../models/Credential.js';
import { requireAdmin } from '../middleware/auth.js';
import Institution from '../models/Institution.js';
import { hashCertificate } from '../certificate.js';
import { isRevocationReason } from '../../../client/src/lib/revocation.js';

const router = Router();

// Newest first — the Student Portal treats index 0 as the "current" record.
const NEWEST_FIRST = { createdAt: -1, _id: -1 };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const today = () => new Date().toISOString().slice(0, 10);
const normalizeId = (id) => String(id || '').trim().toUpperCase();

function newCredentialId() {
  return `COR-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function newTxHash() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

// GET /api/credentials            -> all credentials
// GET /api/credentials?studentId= -> one student's credentials
router.get('/credentials', async (req, res, next) => {
  try {
    const filter = req.query.studentId ? { studentId: String(req.query.studentId).trim() } : {};
    const list = await Credential.find(filter).sort(NEWEST_FIRST);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/my/credentials  (institution admin) -> only this institution's credentials
router.get('/my/credentials', requireAdmin, async (req, res, next) => {
  try {
    const list = await Credential.find({ institution: req.institutionId }).sort(NEWEST_FIRST);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/credentials/:credentialId
router.get('/credentials/:credentialId', async (req, res, next) => {
  try {
    const match = await Credential.findOne({ credentialId: normalizeId(req.params.credentialId) });
    if (!match) return res.status(404).json({ message: 'Credential not found' });
    res.json(match);
  } catch (err) {
    next(err);
  }
});

// POST /api/credentials  (institution admin) -> issue a credential from this institution
router.post('/credentials', requireAdmin, async (req, res, next) => {
  try {
    const institution = await Institution.findById(req.institutionId);
    if (!institution) return res.status(401).json({ message: 'Session expired — please sign in again.' });

    const { studentName, studentId, studentEmail, credentialType, issueDate, credentialId, txHash } = req.body || {};
    if (!studentName?.trim() || !studentId?.trim() || !credentialType?.trim()) {
      return res.status(400).json({ message: 'Student name, student ID and credential type are required.' });
    }
    const email = studentEmail?.trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: 'A valid student email is required.' });
    }

    // The admin review step generates the ID + tx ref up front so its preview hash
    // matches; honour those, otherwise generate fresh ones.
    const fields = {
      credentialId: credentialId ? normalizeId(credentialId) : newCredentialId(),
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      credentialType: credentialType.trim(),
      issueDate: issueDate || today(),
      issuer: institution.name,
      txHash: txHash || newTxHash(),
    };

    const hash = await hashCertificate(fields);
    const record = await Credential.create({
      ...fields,
      studentEmail: email,
      hash,
      institution: institution._id,
      status: 'valid',
      revocation: null,
    });

    res.status(201).json({
      credentialId: record.credentialId,
      hash: record.hash,
      txHash: record.txHash,
      qrPayload: record.credentialId,
      record,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A credential with this ID already exists.' });
    next(err);
  }
});

// PATCH /api/credentials/:credentialId/revoke  (institution admin, own credentials only)
// { category, reason } -> category from REVOCATION_REASONS, reason = the explanation shown to verifiers
router.patch('/credentials/:credentialId/revoke', requireAdmin, async (req, res, next) => {
  try {
    const { category, reason } = req.body || {};
    if (!isRevocationReason(category)) {
      return res.status(400).json({ message: 'Choose a reason for revoking this credential.' });
    }
    if (!reason?.trim() || reason.trim().length < 5) {
      return res.status(400).json({ message: 'Explain the reason in a few words (at least 5 characters).' });
    }

    const institution = await Institution.findById(req.institutionId);
    if (!institution) return res.status(401).json({ message: 'Session expired — please sign in again.' });

    const credentialId = normalizeId(req.params.credentialId);
    const updated = await Credential.findOneAndUpdate(
      { credentialId, institution: institution._id, status: 'valid' },
      {
        status: 'revoked',
        revocation: { category, reason: reason.trim(), date: today(), revokedBy: institution.name },
      },
      { new: true }
    );
    if (!updated) {
      const existing = await Credential.findOne({ credentialId, institution: institution._id });
      if (existing?.status === 'revoked') {
        return res.status(409).json({ message: 'This credential is already revoked.' });
      }
      return res.status(404).json({ message: 'Credential not found in your institution.' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/verify  { credentialId } | { fileHash }
router.post('/verify', async (req, res, next) => {
  try {
    const { credentialId, fileHash } = req.body || {};

    let match = null;
    if (credentialId) {
      match = await Credential.findOne({ credentialId: normalizeId(credentialId) });
    } else if (fileHash) {
      match = await Credential.findOne({ hash: String(fileHash).trim().toLowerCase() });
    }

    if (!match) {
      return res.json({
        status: 'invalid',
        details: {
          reason: credentialId
            ? `No credential found on-chain matching ID "${credentialId}".`
            : 'The computed document hash does not match any record on-chain. The file may have been altered, or was never issued through this system.',
          submittedId: credentialId || null,
          submittedHash: fileHash || null,
        },
      });
    }

    res.json({ status: match.status === 'revoked' ? 'revoked' : 'valid', details: match });
  } catch (err) {
    next(err);
  }
});

export default router;
