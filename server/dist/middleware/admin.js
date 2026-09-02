"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.adminOrApprovedStaff = exports.admin = void 0;
const admin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Not authenticated",
        });
        return;
    }
    if (req.user.role !== "admin") {
        res.status(403).json({
            success: false,
            message: "Admin access required",
        });
        return;
    }
    next();
};
exports.admin = admin;
const adminOrApprovedStaff = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
    }
    if (req.user.role === "admin" || (req.user.role === "staff" && req.user.staffApproval === "approved")) {
        next();
        return;
    }
    res.status(403).json({ success: false, message: "Approved staff access required" });
};
exports.adminOrApprovedStaff = adminOrApprovedStaff;
const requirePermission = (permission) => (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.permissions.includes(permission)) {
        next();
        return;
    }
    res.status(403).json({ success: false, message: `${permission} permission required` });
};
exports.requirePermission = requirePermission;
