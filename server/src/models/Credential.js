import mongoose from 'mongoose';

const revocationSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD, same format the UI renders
  },
  { _id: false }
);

const credentialSchema = new mongoose.Schema(
  {
    credentialId: { type: String, required: true, unique: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true, index: true },
    credentialType: { type: String, required: true, trim: true },
    issueDate: { type: String, required: true }, // YYYY-MM-DD
    issuer: { type: String, required: true },
    txHash: { type: String, required: true },
    // SHA-256 of the generated certificate PDF bytes, computed server-side.
    hash: { type: String, required: true, index: true },
    status: { type: String, enum: ['valid', 'revoked'], default: 'valid' },
    revocation: { type: revocationSchema, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      // Return the exact record shape the frontend already expects.
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model('Credential', credentialSchema);
