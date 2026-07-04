import mongoose from "mongoose";

// Schema shape only, per the finalized architecture (Section 4).
// drawEvents are NOT a separate collection — shapes live directly
// in `elements`. $push / $pull logic on this field is implemented
// in Phase 4 — Real-Time Sync.

const elementSchema = new mongoose.Schema(
  {
    shapeId: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const boardSchema = new mongoose.Schema(
  {
    title: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shareId: { type: String, unique: true },
    elements: [elementSchema],
  },
  { timestamps: true }
);

boardSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Board", boardSchema);
