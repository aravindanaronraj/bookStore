import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const connectDB = async (): Promise<void> => {
  let mongoURI = process.env.MONGO_URI;

  try {
    if (!mongoURI) {
      console.log("MONGO_URI not set. Starting in-memory MongoDB for development...");
      const memoryServer = await MongoMemoryServer.create();
      mongoURI = memoryServer.getUri();
    }

    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);

    try {
      const memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri());
      console.log("✅ MongoDB Connected via in-memory fallback");
    } catch (fallbackError) {
      console.error("❌ MongoDB Fallback Failed:", fallbackError);
      process.exit(1);
    }
  }
};

export default connectDB;