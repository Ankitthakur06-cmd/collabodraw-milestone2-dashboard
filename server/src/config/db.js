import mongoose from "mongoose";

// MongoDB Atlas connection. Called once from server.js on boot.
// No query/model logic lives here — just the connection itself.

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not set. Copy .env.example to .env and fill it in.");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

export default connectDB;
