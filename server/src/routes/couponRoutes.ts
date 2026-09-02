import express from "express";

import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "../controllers/couponController";

import { protect } from "../middleware/protect";
import { admin } from "../middleware/admin";

const router = express.Router();

// ===============================
// ADMIN
// ===============================

router.post(
  "/",
  protect,
  admin,
  createCoupon
);

router.get(
  "/",
  protect,
  admin,
  getCoupons
);

router.get(
  "/:id",
  protect,
  admin,
  getCouponById
);

router.put(
  "/:id",
  protect,
  admin,
  updateCoupon
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteCoupon
);

// ===============================
// USER
// ===============================

router.post(
  "/apply",
  protect,
  applyCoupon
);

export default router;