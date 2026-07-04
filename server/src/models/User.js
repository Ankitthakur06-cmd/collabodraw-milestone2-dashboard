import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Schema shape + validation, per the finalized architecture (Section 4).
// Password hashing happens in the register route (authRoutes.js);
// comparePassword() below is used by the login route to verify it.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, "Please enter a valid email address"],
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

// Never leak the password hash (or __v) in any API response.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

export default mongoose.model("User", userSchema);
