import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

interface JwtPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: "user" | "staff" | "admin";
    staffApproval: "pending" | "approved" | "rejected";
    permissions: ("dashboard" | "products" | "orders" | "customers")[];
    subscription: {
      plan: "free" | "premium";
      startDate?: Date;
      endDate?: Date;
    };
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.userId).select(
      "-password -emailVerificationTokenHash -emailVerificationOtpHash"
    );

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
  } catch (error) {
    console.error("Protect Middleware Error:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication",
    });
  }
};
