import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import initSockets from "./sockets/index.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

console.log("✅ NEW SERVER FILE IS RUNNING");
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check — useful for verifying the scaffold boots correctly.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

app.use(errorHandler);

const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL },
});
initSockets(io);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
