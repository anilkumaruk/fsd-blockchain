// Re-uses the client's certificate generator so the server computes exactly the
// same SHA-256 the browser computes when a downloaded certificate is uploaded
// for verification. One source of truth = hashes can never drift apart.
import { buildCertificateBytes, computeSha256Hex } from '../../client/src/lib/generateCertificatePdf.js';
import { REFERENCE_INSTITUTION } from '../../client/src/lib/institution.js';

export const ISSUER_NAME = REFERENCE_INSTITUTION.name;

export async function hashCertificate(fields) {
  return computeSha256Hex(buildCertificateBytes(fields));
}
