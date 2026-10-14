// API client for "Chain of Record" — talks to the Express + MongoDB backend
// in ../server. Function names and return shapes match the old in-browser
// mock exactly, so the pages and components did not need to change.
//
// Document hashing is done by the server using the same certificate
// generator as the browser, so uploading a downloaded certificate on the
// Verification screen produces a real SHA-256 match against MongoDB.

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'cor-admin-token';

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

// The "logged in" demo student — used by the Student Portal.
export const DEMO_STUDENT_ID = 'RGIT21CS014';

// ---- auth token ----------------------------------------------------------

export function getToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable — login just won't survive a refresh
  }
}

// ---- fetch helper --------------------------------------------------------

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
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
    if (res.status === 401 && auth) setToken(null);
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---- API -----------------------------------------------------------------

export async function login(username, password) {
  const data = await request('/auth/login', { method: 'POST', body: { username, password } });
  setToken(data.token);
  return data.admin;
}

export async function register({ username, password, displayName }) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: { username, password, displayName },
  });
  setToken(data.token);
  return data.admin;
}

export function logout() {
  setToken(null);
}

/**
 * `credentialId` and `txHash` are optional — the Admin review step passes in
 * the values it used to compute its preview hash; otherwise the server
 * generates fresh ones.
 */
export function issueCredential({ studentName, studentId, credentialType, issueDate, credentialId, txHash }) {
  return request('/credentials', {
    method: 'POST',
    auth: true,
    body: { studentName, studentId, credentialType, issueDate, credentialId, txHash },
  });
}

export function getCredentialsForStudent(studentId) {
  return request(`/credentials?studentId=${encodeURIComponent(studentId)}`);
}

export function getAllCredentials() {
  return request('/credentials');
}

export function revokeCredential(credentialId, reason) {
  return request(`/credentials/${encodeURIComponent(credentialId)}/revoke`, {
    method: 'PATCH',
    auth: true,
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
