import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error("❌ MONGO_URI is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

export default connectDB;