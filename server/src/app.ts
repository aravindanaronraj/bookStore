import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes";
import bookRoutes from "./routes/bookRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import cartRoutes from "./routes/cartRoutes";
import addressRoutes from "./routes/addressRoutes";
import couponRoutes from "./routes/couponRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminRoutes from "./routes/adminRoutes";
import contactRoutes from "./routes/contactRoutes";
import contentRoutes from "./routes/contentRoutes";

const app = express();

// Middlewares

const allowedOrigins = [
 
  process.env.FRONTEND_URL || "http://localhost:5173"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Origin is not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));


// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "📚 Book Store API is Running...",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/content", contentRoutes);


// Error handler for multer/cloudinary and other errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  // Handle Cloudinary/multer-storage-cloudinary unexpected responses (e.g. 403)
  if (err && (err.name === "UnexpectedResponse" || err.http_code)) {
    return res.status(502).json({
      success: false,
      message: err.message || "Upstream service error",
      http_code: err.http_code || 502,
    });
  }

  if (err && err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err && err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
