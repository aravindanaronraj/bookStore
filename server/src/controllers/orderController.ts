import crypto from "crypto";
import CouponUsage from "../models/CouponUsage";
import Coupon from "../models/Coupon";
import { Response } from "express";
import mongoose from "mongoose";

import Order from "../models/Order";
import Cart from "../models/Cart";
import Address from "../models/Address";
import { AuthRequest } from "../middleware/protect";
import razorpay from "../config/razorpay";
import Book from "../models/Book";
import { sendOrderConfirmationEmails } from "../services/emailService";

export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { addressId, couponCode } = req.body;

    // 1. Validate address ID
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
      return;
    }

    // 2. Get user's cart
    const cart = await Cart.findOne({
      user: req.user.id,
    }).populate("cartItems.book");

    if (cart) {
      const validItems = cart.cartItems.filter((item) => Boolean(item.book));
      if (validItems.length !== cart.cartItems.length) {
        cart.cartItems.splice(0, cart.cartItems.length, ...validItems);
        await cart.save();
      }
    }

    if (!cart || cart.cartItems.length === 0) {
      res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
      return;
    }

    // 3. Get user's address
    const address = await Address.findOne({
      _id: addressId,
      user: req.user.id,
    });

    if (!address) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    // 4. Calculate subtotal
    let subtotal = 0;

    const orderItems = cart.cartItems.map((item) => {
      const book = item.book as any;

      if (!book) throw new Error("Your cart contains an unavailable book");
      // Legacy books created before isActive was introduced may not have the field.
      // Only an explicitly hidden book must be blocked from checkout.
      if (book.isActive === false) throw new Error(`${book.title} is currently unavailable`);

      if (
        book.bookType !== "ebook" &&
        book.stock < item.quantity
      ) {
        throw new Error(
          `${book.title} does not have enough stock`
        );
      }

      const price =
        book.salePrice && book.salePrice > 0
          ? book.salePrice
          : book.price;

      subtotal += price * item.quantity;

      return {
        book: book._id,
        title: book.title,
        quantity: item.quantity,
        price,
        image: book.images?.[0]?.url,
      };
    });

    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      if (typeof couponCode !== "string") {
        res.status(400).json({
          success: false,
          message: "Coupon code must be a string",
        });
        return;
      }

  const normalizedCode = couponCode.trim().toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
    isActive: true,
  });

  if (!coupon) {
    res.status(400).json({
      success: false,
      message: "Invalid coupon",
    });
    return;
  }

  // Check expiry
  if (coupon.expiresAt <= new Date()) {
    res.status(400).json({
      success: false,
      message: "Coupon has expired",
    });
    return;
  }

  // Check total usage limit
  if (
    coupon.usageLimit !== undefined &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    res.status(400).json({
      success: false,
      message: "Coupon usage limit reached",
    });
    return;
  }

  // Check minimum order amount
  if (subtotal < coupon.minimumOrderAmount) {
    res.status(400).json({
      success: false,
      message: `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
    });
    return;
  }

  // Check user's previous usage
  const userUsageCount = await CouponUsage.countDocuments({
    coupon: coupon._id,
    user: req.user.id,
  });

  if (userUsageCount >= coupon.perUserLimit) {
    res.status(400).json({
      success: false,
      message: "You have already used this coupon",
    });
    return;
  }

  // Calculate discount
  if (coupon.discountType === "percentage") {
    discount = (subtotal * coupon.discountValue) / 100;

    if (
      coupon.maximumDiscountAmount !== undefined &&
      discount > coupon.maximumDiscountAmount
    ) {
      discount = coupon.maximumDiscountAmount;
    }
  } else {
    discount = coupon.discountValue;
  }

  // Never allow discount to exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }

      appliedCoupon = coupon;
    }

    // 5. Shipping
    const shippingFee = subtotal >= 1000 ? 0 : 50;

    // 6. Final amount
    const totalAmount =
      subtotal - discount + shippingFee;

    if (totalAmount <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
      return;
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      res.status(503).json({
        success: false,
        message: "Payment gateway is not configured",
      });
      return;
    }

    // 7. Create MongoDB order
    const order = await Order.create({
      user: req.user.id,

      items: orderItems,

      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
      coupon: appliedCoupon?._id,
      subtotal,
      discount,
      shippingFee,
      totalAmount,

      paymentMethod: "razorpay",
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    let razorpayOrder;

    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
        notes: { userId: req.user.id },
      });
    } catch (paymentError) {
      await Order.findByIdAndDelete(order._id);
      throw paymentError;
    }

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
      },
      razorpay: {
        key: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const verifyPayment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // 1. Check required payment details
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
      return;
    }

    // 2. Find the order
    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user.id,
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // 3. Create signature
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET!
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    // 4. Compare signatures
    const expectedSignature = Buffer.from(generatedSignature, "hex");
    const receivedSignature = Buffer.from(String(razorpay_signature), "hex");
    const signatureMatches =
      expectedSignature.length === receivedSignature.length &&
      crypto.timingSafeEqual(expectedSignature, receivedSignature);

    if (!signatureMatches) {
      order.paymentStatus = "failed";

      await order.save();

      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });

      return;
    }

    // 5. Prevent duplicate processing
    if (order.paymentStatus === "paid") {
      res.status(200).json({
        success: true,
        message: "Payment already verified",
        order,
      });

      return;
    }

    // 6. Atomically claim finalization so duplicate callbacks cannot deduct
    // stock twice. Compensation keeps standalone MongoDB deployments safe.
    const claimedOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $in: ["pending", "failed"] } },
      { $set: { paymentStatus: "processing", razorpayPaymentId: razorpay_payment_id } },
      { returnDocument: "after" }
    );

    if (!claimedOrder) {
      const currentOrder = await Order.findById(order._id);
      res.status(currentOrder?.paymentStatus === "paid" ? 200 : 409).json({
        success: currentOrder?.paymentStatus === "paid",
        message: currentOrder?.paymentStatus === "paid" ? "Payment already verified" : "Payment verification is already in progress",
        order: currentOrder,
      });
      return;
    }

    const deductedItems: { bookId: mongoose.Types.ObjectId; quantity: number }[] = [];
    let couponUsageCreated = false;
    let couponCountIncremented = false;

    try {
      for (const item of claimedOrder.items) {
        const book = await Book.findById(item.book);
        if (!book) throw new Error(`Book not found: ${item.title}`);
        if (book.bookType === "ebook") continue;

        const stockUpdate = await Book.updateOne(
          { _id: book._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        if (stockUpdate.modifiedCount !== 1) throw new Error(`Not enough stock for ${book.title}`);
        deductedItems.push({ bookId: book._id, quantity: item.quantity });
      }

      if (claimedOrder.coupon) {
        await CouponUsage.create({ coupon: claimedOrder.coupon, user: req.user.id, order: claimedOrder._id });
        couponUsageCreated = true;
        await Coupon.findByIdAndUpdate(claimedOrder.coupon, { $inc: { usedCount: 1 } });
        couponCountIncremented = true;
      }

      claimedOrder.paymentStatus = "paid";
      claimedOrder.orderStatus = "confirmed";
      claimedOrder.paidAt = new Date();
      await claimedOrder.save();
      await Cart.findOneAndUpdate({ user: req.user.id }, { $set: { cartItems: [] } });
    } catch (finalizationError) {
      await Promise.all(deductedItems.map((item) => Book.updateOne({ _id: item.bookId }, { $inc: { stock: item.quantity } })));
      if (couponUsageCreated) await CouponUsage.deleteOne({ order: claimedOrder._id });
      if (couponCountIncremented && claimedOrder.coupon) {
        await Coupon.findByIdAndUpdate(claimedOrder.coupon, { $inc: { usedCount: -1 } });
      }

      let failedPaymentStatus: "failed" | "refunded" = "failed";
      try {
        await razorpay.payments.refund(razorpay_payment_id, {
          amount: Math.round(claimedOrder.totalAmount * 100),
          notes: { reason: "Order finalization failed" },
        });
        failedPaymentStatus = "refunded";
      } catch (refundError) {
        console.error("Automatic Refund Error:", refundError);
      }

      await Order.findByIdAndUpdate(claimedOrder._id, {
        $set: { paymentStatus: failedPaymentStatus },
      });
      throw finalizationError;
    }

    const verifiedOrder = await Order.findById(order._id);

    let emailWarning: string | undefined;
    if (verifiedOrder) {
      try {
        await sendOrderConfirmationEmails({
        id: verifiedOrder._id.toString(),
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone,
        items: verifiedOrder.items.map((item) => ({ title: item.title, quantity: item.quantity, price: item.price })),
        subtotal: verifiedOrder.subtotal,
        discount: verifiedOrder.discount,
        shippingFee: verifiedOrder.shippingFee,
        totalAmount: verifiedOrder.totalAmount,
        shippingAddress: verifiedOrder.shippingAddress,
        });
      } catch (emailError) {
        console.error("Order confirmation email failed:", emailError);
        emailWarning = "Payment succeeded, but one or more confirmation emails could not be delivered. Please contact support if you do not receive your receipt.";
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: verifiedOrder,
      ...(emailWarning ? { emailWarning } : {}),
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMyOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const orders = await Order.find({
      user: req.user.id,
    })
      .populate(
        "items.book",
        "title images author"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getMyOrderById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
      return;
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user.id,
    }).populate(
      "items.book",
      "title images author"
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
