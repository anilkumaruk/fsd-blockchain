// API client for "Chain of Record" — talks to the Express + MongoDB backend
// in ../server. Function names and return shapes match the old in-browser
// mock exactly, so the pages and components did not need to change.
//
// Document hashing is done by the server using the same certificate
// generator as the browser, so uploading a downloaded certificate on the
// Verification screen produces a real SHA-256 match against MongoDB.

const API_BASE = import.meta.env.VITE_API_URL || '/api';
// Institution-admin and student sessions are stored separately, so both
// portals can be signed in at once (e.g. during a demo).
const SESSION_KEYS = { institution: 'cor-institution-session', student: 'cor-student-session' };

const HEX = '0123456789abcdef';

function randomHex(len) {
  let out = '';
  for (let i = 0; i < len; i++) out += HEX[Math.floor(Math.random() * 16)];
  return out;
}

// Used by the Admin issuance UI to generate a candidate credential ID and
// ledger reference up front for its review-before-issuing step, then pass
// those same values to issueCredential() — so the preview hash matches the
// hash the server stores.
export function fakeTxHash() {
  return '0x' + randomHex(64);
}

export function fakeCredentialId() {
  const year = new Date().getFullYear();
  return `COR-${year}-${randomHex(6).toUpperCase()}`;
}

// ---- sessions (JWT + signed-in institution or student) -------------------

export function getSession(role = 'institution') {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEYS[role]);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(role, session) {
  try {
    if (session) window.sessionStorage.setItem(SESSION_KEYS[role], JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_KEYS[role]);
  } catch {
    // storage unavailable — login just won't survive a refresh
  }
}

// ---- fetch helper --------------------------------------------------------

// `auth` is the session to send: 'institution', 'student', or false for public calls.
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getSession(auth)?.token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the API running?');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) setSession(auth, null);
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---- API -----------------------------------------------------------------

/** Institution admin login. Returns the institution. */
export async function login(username, password) {
  const data = await request('/auth/login', { method: 'POST', body: { username, password } });
  setSession('institution', data);
  return data.institution;
}

/** Registers a new college / university with its single admin login. */
export async function registerInstitution({ name, code, city, email, username, password }) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: { name, code, city, email, username, password },
  });
  setSession('institution', data);
  return data.institution;
}

export function logout() {
  setSession('institution', null);
}

/** Student login with email + password (one login across every institution). */
export async function studentLogin(email, password) {
  const data = await request('/student/login', { method: 'POST', body: { email, password } });
  setSession('student', data);
  return data.student;
}

/** One-time student sign-up with name, email and password. */
export async function studentRegister({ name, email, password }) {
  const data = await request('/student/register', {
    method: 'POST',
    body: { name, email, password },
  });
  setSession('student', data);
  return data.student;
}

export function studentLogout() {
  setSession('student', null);
}

/** Public Academic Passport: { profileId, name, credentials }, or null if not found. */
export async function getPublicProfile(profileId) {
  try {
    return await request(`/student/profile/${encodeURIComponent(profileId)}`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/** Credentials issued to the signed-in student, from every institution. */
export function getMyCredentials() {
  return request('/student/me/credentials', { auth: 'student' });
}

export function getInstitutions() {
  return request('/auth/institutions');
}

/**
 * `credentialId` and `txHash` are optional — the Admin review step passes in
 * the values it used to compute its preview hash; otherwise the server
 * generates fresh ones.
 */
export function issueCredential({
  studentName,
  studentId,
  studentEmail,
  credentialType,
  issueDate,
  credentialId,
  txHash,
}) {
  return request('/credentials', {
    method: 'POST',
    auth: 'institution',
    body: { studentName, studentId, studentEmail, credentialType, issueDate, credentialId, txHash },
  });
}

export function getAllCredentials() {
  return request('/credentials');
}

/** Credentials issued by the logged-in institution only. */
export function getInstitutionCredentials() {
  return request('/my/credentials', { auth: 'institution' });
}

export function revokeCredential(credentialId, reason) {
  return request(`/credentials/${encodeURIComponent(credentialId)}/revoke`, {
    method: 'PATCH',
    auth: 'institution',
    body: { reason },
  });
}

/** Verify a credential either by ID or by a client-computed file hash. */
export function verifyCredential({ credentialId, fileHash }) {
  return request('/verify', { method: 'POST', body: { credentialId, fileHash } });
}

export async function getCredentialById(credentialId) {
  try {
    return await request(`/credentials/${encodeURIComponent(credentialId.trim())}`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}
