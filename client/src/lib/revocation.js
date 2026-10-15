// The reasons an institution can give when it revokes a credential.
// Shared by the client (revoke form, reason display) and the server
// (validation), so both always agree on the list.
export const REVOCATION_REASONS = [
  { id: 'issued_in_error', label: 'Issued in error' },
  { id: 'incorrect_details', label: 'Incorrect details — corrected credential issued' },
  { id: 'duplicate', label: 'Duplicate record' },
  { id: 'requirements_not_met', label: 'Programme requirements not met' },
  { id: 'academic_misconduct', label: 'Academic misconduct' },
  { id: 'fraud', label: 'Obtained using false information' },
  { id: 'other', label: 'Other' },
];

export function isRevocationReason(id) {
  return REVOCATION_REASONS.some((r) => r.id === id);
}

/** Label for a stored category, or null for records revoked before categories existed. */
export function revocationReasonLabel(id) {
  return REVOCATION_REASONS.find((r) => r.id === id)?.label || null;
}
