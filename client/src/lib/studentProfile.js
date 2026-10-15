// Derives an "Academic Passport" profile view from the existing credential
// records — no new fields are invented. Everything here is computed from
// data already present in api.js records, so this stays a thin view
// layer that keeps working unchanged once api.js is replaced by a real
// backend (same shape in, same shape out).

/**
 * @param {{profileId: string, name: string}} account - the student's one
 *   account across institutions (name comes from the account, not a credential).
 * @param {Array} credentials - every credential issued to this student, from
 *   any institution, newest first (index 0 is the "current" record).
 */
export function buildStudentProfile(account, credentials) {
  const byIssueDateAsc = [...credentials].sort(
    (a, b) => new Date(a.issueDate) - new Date(b.issueDate)
  );
  const byIssueDateDesc = [...byIssueDateAsc].reverse();

  // Identity fields are read from the same "representative" record the
  // original portal used (credentials[0]), not a date-sort — the seed data
  // has more than one differently-named student sharing the demo student ID,
  // and re-deriving "most recent" by date would silently swap the displayed
  // identity to a different person than before.
  const representative = credentials[0] || null;

  const institutions = [...new Set(credentials.map((c) => c.issuer))];
  // Each institution assigns its own roll number, so a student can have several.
  const studentIds = [...new Set(credentials.map((c) => c.studentId))];

  const total = credentials.length;
  const active = credentials.filter((c) => c.status === 'valid').length;
  // Revoked and invalid credentials both count as "not active".
  const revoked = credentials.filter((c) => c.status !== 'valid').length;

  return {
    profileId: account.profileId,
    studentIds,
    studentId: studentIds.join(' · '),
    studentName: account.name || representative?.studentName || null,
    // No separate "program" field exists on a credential — the
    // representative credential's type is used as the headline program,
    // the closest honest proxy available in the current data model.
    primaryProgram: representative?.credentialType || null,
    primaryInstitution: representative?.issuer || null,
    // Derived from the representative credential's issue year — not a
    // separate stored field, so it's presented as such in the UI.
    latestIssueYear: representative ? new Date(representative.issueDate).getFullYear() : null,
    allVerified: total > 0 && revoked === 0,
    stats: {
      total,
      active,
      revoked,
      institutions: institutions.length,
    },
    credentialsAsc: byIssueDateAsc,
    credentialsDesc: byIssueDateDesc,
  };
}

/** Groups credentials by issue year, most recent year first. */
export function groupCredentialsByYear(credentials) {
  const byYear = new Map();
  for (const c of credentials) {
    const year = new Date(c.issueDate).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(c);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => [
      year,
      [...items].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate)),
    ]);
}

export function buildProfileUrl(profileId) {
  return `${window.location.origin}/profile/${encodeURIComponent(profileId)}`;
}

/** "Student ID" or "Student IDs" depending on how many institutions issued. */
export function studentIdLabel(profile) {
  return profile.studentIds.length > 1 ? 'Student IDs' : 'Student ID';
}

/** Two-letter avatar initials from a display name. */
export function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * The profile-level verification state — distinct from any individual
 * credential's state, and never a "student quality" score. Four outcomes:
 * 'empty' (no credentials at all), 'none' (every credential is revoked),
 * 'attention' (some but not all revoked), or 'verified' (all active).
 */
export function getProfileVerificationState(stats) {
  if (stats.total === 0) return 'empty';
  if (stats.active === 0) return 'none';
  if (stats.revoked > 0) return 'attention';
  return 'verified';
}
