import { Request, Response } from "express";
import mongoose from "mongoose";
import Coupon from "../models/Coupon";
import CouponUsage from "../models/CouponUsage";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// ===============================
// ADMIN - CREATE COUPON
// ===============================
export const createCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      expiresAt,
      isActive,
    } = req.body;

    if (
      !code ||
      !discountType ||
      discountValue === undefined
    ) {
      res.status(400).json({
        success: false,
        message: "Code, discount type and discount value are required",
      });
      return;
    }

    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (existingCoupon) {
      res.status(400).json({
        success: false,
        message: "Coupon already exists",
      });
      return;
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minimumOrderAmount: minOrderAmount || 0,
      maximumDiscountAmount: maxDiscount,
      usageLimit,
      perUserLimit: perUserLimit || 1,
      expiresAt,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
    });
  }
};

// ===============================
// GET ALL COUPONS - ADMIN
// ===============================
export const getCoupons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("Get coupons error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
    });
  }
};

// ===============================
// GET SINGLE COUPON
// ===============================
export const getCouponById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
      return;
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Get coupon error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
    });
  }
};

// ===============================
// ADMIN - UPDATE COUPON
// ===============================
export const updateCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
      return;
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
      return;
    }

    const {
      
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      expiresAt,
      isActive,
    } = req.body;

    if (discountType !== undefined) {
      coupon.discountType = discountType;
    }

    if (discountValue !== undefined) {
      coupon.discountValue = discountValue;
    }

    

    if (minOrderAmount !== undefined) {
      coupon.minimumOrderAmount = minOrderAmount;
    }

    if (maxDiscount !== undefined) {
      coupon.maximumDiscountAmount = maxDiscount;
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit = usageLimit;
    }

    if (perUserLimit !== undefined) {
      coupon.perUserLimit = perUserLimit;
    }

    if (expiresAt !== undefined) {
      coupon.expiresAt = expiresAt;
    }

    if (isActive !== undefined) {
      coupon.isActive = isActive;
    }

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
};

// ===============================
// ADMIN - DELETE COUPON
// ===============================
export const deleteCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
      return;
    }

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
      return;
    }

    // Optional: remove usage records
    await CouponUsage.deleteMany({
      coupon: id,
    });

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete coupon error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};

// ===============================
// USER - APPLY / VALIDATE COUPON
// ===============================
export const applyCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!code || orderAmount === undefined) {
      res.status(400).json({
        success: false,
        message: "Coupon code and order amount are required",
      });
      return;
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      res.status(404).json({
        success: false,
        message: "Invalid or inactive coupon",
      });
      return;
    }

    // Check expiry
    if (
      coupon.expiresAt &&
      new Date(coupon.expiresAt) < new Date()
    ) {
      res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
      return;
    }

    // Minimum order amount
    if (
      coupon.minimumOrderAmount !== undefined &&
      orderAmount < coupon.minimumOrderAmount
    ) {
      res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
      });
      return;
    }

    // Total usage limit
    if (coupon.usageLimit !== undefined) {
      const totalUsage = await CouponUsage.countDocuments({
        coupon: coupon._id,
      });

      if (totalUsage >= coupon.usageLimit) {
        res.status(400).json({
          success: false,
          message: "Coupon usage limit reached",
        });
        return;
      }
    }

    // Per-user usage
    const userUsage = await CouponUsage.countDocuments({
      coupon: coupon._id,
      user: userId,
    });

    if (
      coupon.perUserLimit !== undefined &&
      userUsage >= coupon.perUserLimit
    ) {
      res.status(400).json({
        success: false,
        message: "You have already used this coupon",
      });
      return;
    }

    // Calculate discount
    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount =
        (orderAmount * coupon.discountValue) / 100;

      if (
        coupon.maximumDiscountAmount !== undefined &&
        discount > coupon.maximumDiscountAmount
      ) {
        discount = coupon.maximumDiscountAmount;
      }
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    // Never allow discount greater than order amount
    discount = Math.min(discount, orderAmount);

    const finalAmount = orderAmount - discount;

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        id: coupon._id,
        code: coupon.code,
      },
      orderAmount,
      discount,
      finalAmount,
    });
  } catch (error) {
    console.error("Apply coupon error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to apply coupon",
    });
  }
};
