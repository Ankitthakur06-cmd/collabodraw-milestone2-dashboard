import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import authMiddleware from "../middleware/authMiddleware.js";

// Route + handler logic combined, per the finalized architecture
// (Section 3/5 — solo-dev flattening, no separate controller file).

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Server-side validation — mirrors the client-side checks but is
    // never trusted to have already run.
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });

    const token = generateToken({ id: user._id });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user,
    });
  } catch (err) {
    // Fallback in case two requests race past the findOne check above —
    // the schema's unique index still guarantees no duplicate is saved.
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Same generic message for "no such user" and "wrong password" —
    // avoids revealing which part of the credentials was wrong.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken({ id: user._id });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
});

export default router;
