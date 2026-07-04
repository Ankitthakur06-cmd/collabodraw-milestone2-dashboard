import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import Board from "../models/Board.js";
import authMiddleware from "../middleware/authMiddleware.js";

// Route + handler logic combined, per the finalized architecture
// (same flattened pattern as authRoutes.js). Every board route
// requires a logged-in user.

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ ownerId: req.user._id }, { collaborators: req.user._id }],
    })
      .select("title shareId ownerId createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, boards });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load boards" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Board title is required" });
    }

    const board = await Board.create({
      title: title.trim(),
      ownerId: req.user._id,
      shareId: uuidv4(),
    });

    return res.status(201).json({ success: true, board });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create board" });
  }
});

// Single-board fetch (with elements[] history hydration) and delete
// are Phase 4 work per the finalized architecture — left as stubs.

router.get("/:shareId", (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet — Phase 4" });
});

router.delete("/:id", (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented yet — Phase 4" });
});

export default router;
