"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}
const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.default.findById(decoded.userId).select("-password -emailVerificationTokenHash -emailVerificationOtpHash");
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User no longer exists",
            });
            return;
        }
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            staffApproval: user.staffApproval,
            permissions: user.permissions,
            subscription: user.subscription,
        };
        next();
    }
    catch (error) {
        console.error("Protect Middleware Error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication",
        });
    }
};
exports.protect = protect;
