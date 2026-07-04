import jwt from "jsonwebtoken";

// Thin wrapper around jsonwebtoken. Actually called from the
// register/login controllers in Phase 2.

export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export default generateToken;
