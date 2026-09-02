"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserAccess = exports.getAdminUsers = exports.getPerformanceAnalytics = exports.getAdminCounts = exports.getAdminInventory = exports.updateOrderStatus = exports.getAdminOrders = exports.getDashboardOverview = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Book_1 = __importDefault(require("../models/Book"));
const Category_1 = __importDefault(require("../models/Category"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const Order_1 = __importDefault(require("../models/Order"));
const User_1 = __importDefault(require("../models/User"));
const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const getDashboardOverview = async (_req, res) => {
    try {
        const [bookCount, activeBookCount, categoryCount, customerCount, orderCount, lowStockCount, revenueResult, recentOrders, statusBreakdown] = await Promise.all([
            Book_1.default.countDocuments(),
            Book_1.default.countDocuments({ isActive: true }),
            Category_1.default.countDocuments({ isActive: true }),
            User_1.default.countDocuments({ role: "user" }),
            Order_1.default.countDocuments(),
            Book_1.default.countDocuments({ isActive: true, bookType: { $ne: "ebook" }, stock: { $lte: 5 } }),
            Order_1.default.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
            Order_1.default.find().populate("user", "name email").sort({ createdAt: -1 }).limit(6),
            Order_1.default.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
        ]);
        res.status(200).json({
            success: true,
            overview: {
                bookCount, activeBookCount, categoryCount, customerCount, orderCount, lowStockCount,
                revenue: revenueResult[0]?.total || 0,
                statusBreakdown: Object.fromEntries(statusBreakdown.map((item) => [item._id, item.count])),
            },
            recentOrders,
        });
    }
    catch (error) {
        console.error("Admin Overview Error:", error);
        res.status(500).json({ success: false, message: "Unable to load dashboard overview" });
    }
};
exports.getDashboardOverview = getDashboardOverview;
const getAdminOrders = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const filter = {};
        if (typeof req.query.status === "string" && orderStatuses.includes(req.query.status)) {
            filter.orderStatus = req.query.status;
        }
        const [orders, total] = await Promise.all([
            Order_1.default.find(filter).populate("user", "name email phone").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            Order_1.default.countDocuments(filter),
        ]);
        res.status(200).json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
    }
    catch (error) {
        console.error("Admin Orders Error:", error);
        res.status(500).json({ success: false, message: "Unable to load orders" });
    }
};
exports.getAdminOrders = getAdminOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid order ID" });
            return;
        }
        if (!orderStatuses.includes(status)) {
            res.status(400).json({ success: false, message: "Invalid order status" });
            return;
        }
        const order = await Order_1.default.findById(id);
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        if (order.orderStatus === "cancelled" || order.orderStatus === "delivered") {
            res.status(409).json({ success: false, message: "Completed or cancelled orders cannot be changed" });
            return;
        }
        order.orderStatus = status;
        await order.save();
        res.status(200).json({ success: true, message: "Order status updated", order });
    }
    catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ success: false, message: "Unable to update order status" });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getAdminInventory = async (_req, res) => {
    try {
        const books = await Book_1.default.find().populate("category", "name").sort({ stock: 1, createdAt: -1 }).limit(100);
        res.status(200).json({ success: true, books });
    }
    catch (error) {
        console.error("Admin Inventory Error:", error);
        res.status(500).json({ success: false, message: "Unable to load inventory" });
    }
};
exports.getAdminInventory = getAdminInventory;
const getAdminCounts = async (_req, res) => {
    const [coupons, categories] = await Promise.all([Coupon_1.default.countDocuments(), Category_1.default.countDocuments()]);
    res.status(200).json({ success: true, coupons, categories });
};
exports.getAdminCounts = getAdminCounts;
const getPerformanceAnalytics = async (_req, res) => {
    try {
        const since = new Date();
        since.setDate(since.getDate() - 29);
        since.setHours(0, 0, 0, 0);
        const [daily, topProducts, averageResult, paidOrders, failedOrders] = await Promise.all([
            Order_1.default.aggregate([
                { $match: { paymentStatus: "paid", paidAt: { $gte: since } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            Order_1.default.aggregate([
                { $match: { paymentStatus: "paid" } }, { $unwind: "$items" },
                { $group: { _id: "$items.book", title: { $first: "$items.title" }, units: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
                { $sort: { revenue: -1 } }, { $limit: 5 },
            ]),
            Order_1.default.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, average: { $avg: "$totalAmount" } } }]),
            Order_1.default.countDocuments({ paymentStatus: "paid" }),
            Order_1.default.countDocuments({ paymentStatus: "failed" }),
        ]);
        res.status(200).json({ success: true, analytics: { daily, topProducts, averageOrderValue: averageResult[0]?.average || 0, paidOrders, failedOrders } });
    }
    catch (error) {
        console.error("Performance Analytics Error:", error);
        res.status(500).json({ success: false, message: "Unable to load performance analytics" });
    }
};
exports.getPerformanceAnalytics = getPerformanceAnalytics;
const getAdminUsers = async (_req, res) => {
    try {
        const users = await User_1.default.find().select("name email phone role staffApproval permissions subscription isEmailVerified createdAt").sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    }
    catch (error) {
        console.error("Admin Users Error:", error);
        res.status(500).json({ success: false, message: "Unable to load users" });
    }
};
exports.getAdminUsers = getAdminUsers;
const updateUserAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, staffApproval, permissions } = req.body;
        if (typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid user ID" });
            return;
        }
        if (id === req.user?.id) {
            res.status(400).json({ success: false, message: "You cannot change your own access" });
            return;
        }
        const user = await User_1.default.findById(id);
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        if (role !== undefined) {
            if (!["user", "staff", "admin"].includes(role)) {
                res.status(400).json({ success: false, message: "Invalid role" });
                return;
            }
            user.role = role;
        }
        if (staffApproval !== undefined) {
            if (!["pending", "approved", "rejected"].includes(staffApproval)) {
                res.status(400).json({ success: false, message: "Invalid approval state" });
                return;
            }
            user.staffApproval = staffApproval;
        }
        if (permissions !== undefined) {
            const allowed = ["dashboard", "products", "orders", "customers"];
            if (!Array.isArray(permissions) || permissions.some((permission) => !allowed.includes(permission))) {
                res.status(400).json({ success: false, message: "Invalid permissions" });
                return;
            }
            user.permissions = permissions;
        }
        if (user.role !== "staff") {
            user.permissions = [];
        }
        await user.save();
        res.status(200).json({ success: true, message: "User access updated", user: { id: user._id, name: user.name, email: user.email, role: user.role, staffApproval: user.staffApproval, permissions: user.permissions } });
    }
    catch (error) {
        console.error("Update User Access Error:", error);
        res.status(500).json({ success: false, message: "Unable to update user access" });
    }
};
exports.updateUserAccess = updateUserAccess;
