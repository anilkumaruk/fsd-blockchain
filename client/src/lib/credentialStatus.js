// The statuses an institution can set on a credential it issued, with what
// each one means for verifiers. Shared by the client and the server.
export const CREDENTIAL_STATUSES = [
  {
    id: 'valid',
    label: 'Valid',
    meaning: 'Genuine and active. Verifiers see it as Verified.',
  },
  {
    id: 'revoked',
    label: 'Revoked',
    meaning: 'It was valid, but the institution has withdrawn it. Verifiers see it as Revoked, with your reason.',
  },
  {
    id: 'invalid',
    label: 'Invalid',
    meaning:
      'The institution does not recognise it as ever having been valid. Verifiers see it as Invalid, with your reason.',
  },
];

export function isCredentialStatus(id) {
  return CREDENTIAL_STATUSES.some((s) => s.id === id);
}

export function statusLabel(id) {
  return CREDENTIAL_STATUSES.find((s) => s.id === id)?.label || id;
}
