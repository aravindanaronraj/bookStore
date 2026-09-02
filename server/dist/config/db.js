"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const connectDB = async () => {
    let mongoURI = process.env.MONGO_URI;
    try {
        if (!mongoURI) {
            console.log("MONGO_URI not set. Starting in-memory MongoDB for development...");
            const memoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            mongoURI = memoryServer.getUri();
        }
        await mongoose_1.default.connect(mongoURI);
        console.log("✅ MongoDB Connected");
    }
    catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        try {
            const memoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            await mongoose_1.default.connect(memoryServer.getUri());
            console.log("✅ MongoDB Connected via in-memory fallback");
        }
        catch (fallbackError) {
            console.error("❌ MongoDB Fallback Failed:", fallbackError);
            process.exit(1);
        }
    }
};
exports.default = connectDB;
