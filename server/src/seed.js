// Seeds MongoDB with the same demo credentials the design prototype shipped with,
// plus a registrar login. Safe to re-run: it resets the credentials collection.
//   npm run seed
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import Credential from './models/Credential.js';
import Admin from './models/Admin.js';
import { hashCertificate, ISSUER_NAME } from './certificate.js';

const txHash = () => '0x' + crypto.randomBytes(32).toString('hex');

const seedCredentials = [
  {
    credentialId: 'COR-2023-9F3A1C',
    studentName: 'Ananya Sharma',
    studentId: 'RGIT21CS014',
    credentialType: 'B.Tech in Computer Science & Engineering',
    issueDate: '2023-06-15',
    status: 'valid',
    txHash: txHash(),
    issuer: ISSUER_NAME,
    revocation: null,
  },
  {
    credentialId: 'COR-2023-4B7E22',
    studentName: 'Rohan Verma',
    studentId: 'RGIT21CS027',
    credentialType: 'B.Tech in Computer Science & Engineering',
    issueDate: '2023-06-15',
    status: 'revoked',
    txHash: txHash(),
    issuer: ISSUER_NAME,
    revocation: {
      reason: 'Issued in error — duplicate record for merged student file.',
      date: '2023-09-02',
    },
  },
  {
    credentialId: 'COR-2022-1A88D0',
    studentName: 'Priya Nair',
    studentId: 'RGIT19CS002',
    credentialType: 'B.Tech in Electronics & Communication Engineering',
    issueDate: '2022-05-30',
    status: 'valid',
    txHash: txHash(),
    issuer: ISSUER_NAME,
    revocation: null,
  },
  {
    credentialId: 'COR-2023-77C3E9',
    studentName: 'Karthik Iyer',
    studentId: 'RGIT21CS014',
    credentialType: 'M.Tech in Data Science',
    issueDate: '2023-11-20',
    status: 'valid',
    txHash: txHash(),
    issuer: ISSUER_NAME,
    revocation: null,
  },
  {
    credentialId: 'COR-2021-C51F6A',
    studentName: 'Sneha Reddy',
    studentId: 'RGIT18CS041',
    credentialType: 'B.Tech in Computer Science & Engineering',
    issueDate: '2021-06-10',
    status: 'valid',
    txHash: txHash(),
    issuer: ISSUER_NAME,
    revocation: null,
  },
  {
    credentialId: 'COR-2022-E20B4D',
    studentName: 'Aditya Kulkarni',
    studentId: 'RGIT19CS009',
    credentialType: 'B.Tech in Information Technology',
    issueDate: '2022-06-18',
    status: 'revoked',
    txHash: txHash(),
    issuer: ISSUER_NAME,
    revocation: {
      reason: 'Academic integrity violation confirmed after appeal process.',
      date: '2024-01-11',
    },
  },
  {
    credentialId: 'COR-2020-88A5F1',
    studentName: 'Meera Joshi',
    studentId: 'RGIT17CS003',
    credentialType: 'B.Tech in Computer Science & Engineering',
    issueDate: '2020-06-22',
    status: 'valid',
    txHash: txHash(),
    issuer: ISSUER_NAME,
    revocation: null,
  },
  {
    credentialId: 'COR-2024-3D6C90',
    studentName: 'Vikram Singh',
    studentId: 'RGIT20CS033',
    credentialType: 'B.Tech in Computer Science & Engineering',
    issueDate: '2024-06-05',
    status: 'valid',
    txHash: txHash(),
    issuer: ISSUER_NAME,
    revocation: null,
  },
];

async function seed() {
  await connectDB();

  await Credential.deleteMany({});
  const now = Date.now();
  const docs = [];
  for (const [i, c] of seedCredentials.entries()) {
    // Stagger createdAt so list order matches the prototype (first seed = newest).
    docs.push({ ...c, hash: await hashCertificate(c), createdAt: new Date(now - i * 1000) });
  }
  await Credential.insertMany(docs);
  console.log(`Inserted ${docs.length} credentials`);

  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const passwordHash = await Admin.hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
  await Admin.findOneAndUpdate(
    { username },
    { username, passwordHash, displayName: 'Registrar' },
    { upsert: true }
  );
  console.log(`Admin account ready: ${username}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
