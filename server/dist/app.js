"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const bookRoutes_1 = __importDefault(require("./routes/bookRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const addressRoutes_1 = __importDefault(require("./routes/addressRoutes"));
const couponRoutes_1 = __importDefault(require("./routes/couponRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const contentRoutes_1 = __importDefault(require("./routes/contentRoutes"));
const app = (0, express_1.default)();
// Middlewares
const allowedOrigins = [
    "http://localhost:5173",
    "https://book-store-ukx2llw1u-aravindan1.vercel.app",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin ||
            allowedOrigins.includes(origin) ||
            origin.endsWith(".vercel.app")) {
            callback(null, true);
        }
        else {
            callback(new Error("Origin is not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("dev"));
// Test Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "📚 Book Store API is Running...",
    });
});
app.use("/api/auth", authRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/books", bookRoutes_1.default);
app.use("/api/cart", cartRoutes_1.default);
app.use("/api/addresses", addressRoutes_1.default);
app.use("/api/coupons", couponRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/contact", contactRoutes_1.default);
app.use("/api/content", contentRoutes_1.default);
// Error handler for multer/cloudinary and other errors
app.use((err, req, res, next) => {
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
exports.default = app;
