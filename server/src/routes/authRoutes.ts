import { Router } from "express";
import { protect } from "../middleware/protect";

import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  verifyEmailOtp,
  resendVerificationEmail,
  getMe,
} from "../controllers/authController";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get(
  "/verify-email/:token",
  verifyEmail
);

router.post(
  "/verify-email-otp",
  verifyEmailOtp
);

router.post(
  "/resend-verification",
  resendVerificationEmail
);

router.get("/me", protect, getMe);
router.post("/logout", logoutUser);


export default router;