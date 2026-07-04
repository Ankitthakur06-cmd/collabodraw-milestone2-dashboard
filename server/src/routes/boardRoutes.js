import { Router } from "express";
import mongoose from "mongoose";
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
    const rawTitle = typeof req.body.title === "string" ? req.body.title.trim() : "";

    if (rawTitle.length > 100) {
      return res.status(400).json({ success: false, message: "Board title cannot exceed 100 characters" });
    }

    const board = await Board.create({
      // Omit title entirely when blank so the schema's own
      // default ("Untitled Board", set in Step 1) applies.
      ...(rawTitle && { title: rawTitle }),
      ownerId: req.user._id,
      shareId: uuidv4(),
    });

    return res.status(201).json({ success: true, board });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create board" });
  }
});

// Fetch a board by its shareId. Any authenticated user who has the
// shareId can open it — if they're not the owner and not already a
// collaborator, they're added as one (this is the "join" flow).
// Full elements[] hydration is Phase 4 (canvas) work — not needed yet
// since there's no canvas to hydrate.
router.get("/:shareId", async (req, res) => {
  try {
    const board = await Board.findOne({ shareId: req.params.shareId }).select(
      "title shareId ownerId collaborators createdAt"
    );

    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    const userId = req.user._id.toString();
    const isOwner = board.ownerId.toString() === userId;

    if (!isOwner) {
      // $addToSet is atomic and a no-op if the user is already a
      // collaborator — duplicate participants are naturally impossible.
      await Board.updateOne({ _id: board._id }, { $addToSet: { collaborators: req.user._id } });
      if (!board.collaborators.some((collaboratorId) => collaboratorId.toString() === userId)) {
        board.collaborators.push(req.user._id);
      }
    }

    return res.status(200).json({ success: true, board });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load board" });
  }
});

// Only the board's owner can delete it.
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid board id" });
    }

    const board = await Board.findById(id);

    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    if (board.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the board owner can delete this board" });
    }

    await board.deleteOne();

    return res.status(200).json({ success: true, message: "Board deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete board" });
  }
});

export default router;
