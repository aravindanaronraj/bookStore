import mongoose, { Document, Schema } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  
  discountType: "percentage" | "fixed";
  discountValue: number;

  minimumOrderAmount: number;
  maximumDiscountAmount?: number;

  usageLimit?: number;
  usedCount: number;

  perUserLimit: number;

  expiresAt: Date;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maximumDiscountAmount: {
      type: Number,
      min: 0,
    },

    usageLimit: {
      type: Number,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model<ICoupon>(
  "Coupon",
  couponSchema
);

export default Coupon;