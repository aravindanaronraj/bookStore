"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        console.error("❌ MONGO_URI is not set");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(mongoURI);
        console.log("✅ MongoDB Connected");
    }
    catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        process.exit(1);
    }
};
exports.default = connectDB;
