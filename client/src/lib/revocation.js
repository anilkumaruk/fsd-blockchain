// The reasons an institution can give when it revokes a credential, each with
// a plain-language meaning shown to verifiers and students. Shared by the
// client (revoke form, reason display) and the server (validation), so both
// always agree on the list.
export const REVOCATION_REASONS = [
  {
    id: 'issued_in_error',
    label: 'Issued in error',
    meaning: 'The institution issued this credential by mistake; the student was not meant to receive it.',
  },
  {
    id: 'incorrect_details',
    label: 'Incorrect details — corrected credential issued',
    meaning:
      'This credential had wrong details, such as the name, course or date. The institution issued a corrected credential to replace it, so this copy is no longer valid.',
  },
  {
    id: 'duplicate',
    label: 'Duplicate record',
    meaning:
      'The same credential was issued more than once to the same student. This extra copy was cancelled so that only one valid record remains; the student still holds the other, valid credential.',
  },
  {
    id: 'requirements_not_met',
    label: 'Programme requirements not met',
    meaning:
      'When this credential was issued, the student had not completed all requirements of the programme, such as credits, examinations or fees.',
  },
  {
    id: 'academic_misconduct',
    label: 'Academic misconduct',
    meaning:
      'The institution withdrew this credential after finding academic misconduct, such as plagiarism or cheating in examinations.',
  },
  {
    id: 'fraud',
    label: 'Obtained using false information',
    meaning: 'This credential was obtained using false documents or information.',
  },
  {
    id: 'other',
    label: 'Other',
    meaning: 'The reason does not fit the categories above; see the institution’s note.',
  },
];

export function isRevocationReason(id) {
  return REVOCATION_REASONS.some((r) => r.id === id);
}

/** The reason for a stored category, or null for records revoked before categories existed. */
export function getRevocationReason(id) {
  return REVOCATION_REASONS.find((r) => r.id === id) || null;
}
