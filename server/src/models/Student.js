import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// A student login. Linked to credentials by studentId (case-insensitive).
const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
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
