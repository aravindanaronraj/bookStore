"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const couponController_1 = require("../controllers/couponController");
const protect_1 = require("../middleware/protect");
const admin_1 = require("../middleware/admin");
const router = express_1.default.Router();
// ===============================
// ADMIN
// ===============================
router.post("/", protect_1.protect, admin_1.admin, couponController_1.createCoupon);
router.get("/", protect_1.protect, admin_1.admin, couponController_1.getCoupons);
router.get("/:id", protect_1.protect, admin_1.admin, couponController_1.getCouponById);
router.put("/:id", protect_1.protect, admin_1.admin, couponController_1.updateCoupon);
router.delete("/:id", protect_1.protect, admin_1.admin, couponController_1.deleteCoupon);
// ===============================
// USER
// ===============================
router.post("/apply", protect_1.protect, couponController_1.applyCoupon);
exports.default = router;
