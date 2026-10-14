import crypto from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// One student login across every institution. The email is the unique login
// and is what institutions enter when issuing, so credentials from any college
// link to this one account. College roll numbers (studentId) stay on each credential.
const studentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    // Public, unguessable id used in the shareable profile link (/profile/:profileId).
    profileId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(5).toString('hex'),
    },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

studentSchema.methods.checkPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

studentSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

export default mongoose.model('Student', studentSchema);
