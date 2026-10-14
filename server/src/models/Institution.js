import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// A registered college / university. Each institution has exactly one admin
// login (username + password) stored on the institution itself.
const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    city: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
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

institutionSchema.methods.checkPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

institutionSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

export default mongoose.model('Institution', institutionSchema);
