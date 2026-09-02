import mongoose, { Document, Schema } from "mongoose";

export interface ICouponUsage extends Document {
  coupon: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  usedAt: Date;
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },

    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Faster lookup for per-user coupon usage
couponUsageSchema.index({
  coupon: 1,
  user: 1,
});

couponUsageSchema.index({ order: 1 }, { unique: true, sparse: true });

const CouponUsage = mongoose.model<ICouponUsage>(
  "CouponUsage",
  couponUsageSchema
);

export default CouponUsage;
