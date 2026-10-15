import { Ban } from 'lucide-react';
import { getRevocationReason } from '../lib/revocation';

/**
 * The one place a revoked credential's reason is shown — used by the
 * verifier result, the Student Portal and the Credential Center, so every
 * screen tells the same story: when, by whom, why, and what that means.
 */
export default function RevocationNotice({ revocation, issuer, className = '' }) {
  if (!revocation) return null;
  const category = getRevocationReason(revocation.category);
  const revokedBy = revocation.revokedBy || issuer;

  return (
    <div className={`bg-revoked-soft text-revoked rounded-md px-3.5 py-3 ${className}`}>
      <p className="text-xs font-semibold flex items-center gap-1.5">
        <Ban size={13} className="shrink-0" aria-hidden="true" />
        Revoked on {revocation.date}
        {revokedBy && ` by ${revokedBy}`}
      </p>
      <p className="text-xs mt-1.5">
        <span className="font-semibold">Reason: </span>
        {category ? category.label : revocation.reason}
      </p>
      {category && (
        <>
          <p className="text-xs mt-1.5 text-ink">
            <span className="font-semibold">What this means: </span>
            {category.meaning}
          </p>
          {revocation.reason && (
            <p className="text-xs mt-1.5 text-ink-soft">
              <span className="font-semibold">Institution’s note: </span>
              {revocation.reason}
            </p>
          )}
        </>
      )}
    </div>
  );
}
