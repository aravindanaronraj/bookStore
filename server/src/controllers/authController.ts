import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

import { sendAdminRegistrationEmail, sendPasswordResetOtp, sendPasswordResetSuccess, sendVerificationEmail } from "../services/emailService";
import { isValidEmail, isValidPhone, validatePassword } from "../utils/validators";
import generateToken from "../utils/generateToken";
import { AuthRequest } from "../middleware/protect";

import {
  hashVerificationValue,
  generateVerificationToken,
  generateVerificationOtp,
} from "../utils/verification";

interface RegisterRequestBody {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export const registerUser = async (
  req: Request<{}, {}, RegisterRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
      return;
    }

    if (!isValidEmail(email)) {
  res.status(400).json({
    success: false,
    message: "Please provide a valid email address",
  });
  return;
}

if (!isValidPhone(phone)) {
  res.status(400).json({
    success: false,
    message: "Please provide a valid 10-digit phone number",
  });
  return;
}

const passwordCheck = validatePassword(password);
if (!passwordCheck.valid) {
  res.status(400).json({
    success: false,
    message: passwordCheck.message,
  });
  return;
}

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate raw values
    const verificationToken = generateVerificationToken();
    const verificationOtp = generateVerificationOtp();

    // Hash before storing in database
    const tokenHash = hashVerificationValue(verificationToken);
    const otpHash = hashVerificationValue(verificationOtp);

    // Token expires in 15 minutes
    const tokenExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // OTP expires in 10 minutes
    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,

      isEmailVerified: false,

      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpires: tokenExpires,

      emailVerificationOtpHash: otpHash,
      emailVerificationOtpExpires: otpExpires,

      emailVerificationOtpAttempts: 0,

      emailVerificationLastSentAt: new Date(),
    });

    // Send RAW values only through email
try {
  await sendVerificationEmail(
    user.email,
    user.name,
    verificationToken,
    verificationOtp
  );
} catch (emailError) {
  console.error("Send Verification Email Error:", emailError);
  // swallow — account exists regardless, don't 500 the registration
}
    try {
      await sendAdminRegistrationEmail({ name: user.name, email: user.email, phone: user.phone });
    } catch (emailError) {
      console.error("Send Admin Registration Email Error:", emailError);
    }
    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const verifyEmail = async (
  req: Request<{ token: string }>,
  res: Response
): Promise<void> =>{
  try {
    const { token } = req.params;

    if (!token || typeof token !== "string") {
      res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
      return;
    }

    // Hash token received from URL
    const tokenHash = hashVerificationValue(token);

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpires: {
        $gt: new Date(),
      },
      isEmailVerified: false,
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
      return;
    }

    user.isEmailVerified = true;

    // Remove token and OTP
    // This makes the verification link SINGLE-USE
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpires = undefined;

    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpExpires = undefined;
    user.emailVerificationOtpAttempts = 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify Email Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

interface VerifyEmailOtpBody {
  email: string;
  otp: string;
}

export const verifyEmailOtp = async (
  req: Request<{}, {}, VerifyEmailOtpBody>,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
      isEmailVerified: false,
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid verification request",
      });
      return;
    }

    // Maximum 5 attempts
    if (user.emailVerificationOtpAttempts >= 5) {
      res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new verification code.",
      });
      return;
    }

    // Check expiry
    if (
      !user.emailVerificationOtpExpires ||
      user.emailVerificationOtpExpires < new Date()
    ) {
      res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new code.",
      });
      return;
    }

    // Hash submitted OTP
    const otpHash = hashVerificationValue(otp);

    // Compare hash
    if (otpHash !== user.emailVerificationOtpHash) {
      user.emailVerificationOtpAttempts += 1;

      await user.save();

      res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining:
          5 - user.emailVerificationOtpAttempts,
      });

      return;
    }

    // OTP correct
    user.isEmailVerified = true;

    // Remove verification data
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpires = undefined;

    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpExpires = undefined;
    user.emailVerificationOtpAttempts = 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


interface ResendVerificationBody {
  email: string;
}

export const resendVerificationEmail = async (
  req: Request<{}, {}, ResendVerificationBody>,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
      isEmailVerified: false,
    });

    // Don't reveal whether email exists
    if (!user) {
      res.status(200).json({
        success: true,
        message:
          "If the account exists, a verification email has been sent.",
      });
      return;
    }

    // 60-second resend cooldown
    if (user.emailVerificationLastSentAt) {
      const secondsSinceLastSent =
        (Date.now() -
          user.emailVerificationLastSentAt.getTime()) /
        1000;

      if (secondsSinceLastSent < 60) {
        res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            60 - secondsSinceLastSent
          )} seconds before requesting another code.`,
        });
        return;
      }
    }

    const verificationToken = generateVerificationToken();
    const verificationOtp = generateVerificationOtp();

    const tokenHash = hashVerificationValue(verificationToken);
    const otpHash = hashVerificationValue(verificationOtp);

    const tokenExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationTokenExpires = tokenExpires;

    user.emailVerificationOtpHash = otpHash;
    user.emailVerificationOtpExpires = otpExpires;

    // Reset attempts for new OTP
    user.emailVerificationOtpAttempts = 0;

    user.emailVerificationLastSentAt = new Date();

    await user.save();

    await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
      verificationOtp
    );

    res.status(200).json({
      success: true,
      message: "A new verification email has been sent.",
    });
  } catch (error) {
    console.error("Resend Verification Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// A precomputed dummy hash so bcrypt.compare always runs, even when
// the user doesn't exist — keeps response timing consistent and
// avoids leaking account existence via a fast-path early return.
const DUMMY_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8pQ5c3XY0F/0i0R2NfF5DlfQZALy0S";

export const loginUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    // 3. Compare password — always, even if user doesn't exist,
    //    so timing and response shape are identical either way.
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user ? user.password : DUMMY_HASH
    );

    if (!user || !isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // 4. Only now check verification — the caller has already proven
    //    they know the correct password, so it's safe to be specific.
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
      return;
    }

    // 5. Generate JWT
    const token = generateToken(user._id.toString());

    // 6. Store JWT in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/", 
    });

    // 7. Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        staffApproval: user.staffApproval,
        permissions: user.permissions,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMe = async (
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

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Get Me Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logoutUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!isValidEmail(email)) { res.status(400).json({ success: false, message: "சரியான மின்னஞ்சலை உள்ளிடவும்" }); return; }
    const user = await User.findOne({ email });
    if (user) {
      const otp = generateVerificationOtp();
      user.passwordResetOtpHash = hashVerificationValue(otp);
      user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.passwordResetOtpAttempts = 0;
      await user.save();
      await sendPasswordResetOtp(user.email, user.name, otp);
    }
    res.json({ success: true, message: "கணக்கு இருந்தால் மீட்டமைப்புக் குறியீடு மின்னஞ்சலுக்கு அனுப்பப்பட்டுள்ளது" });
  } catch (error) { console.error("Forgot password error:", error); res.status(500).json({ success: false, message: "மீட்டமைப்புக் குறியீட்டை அனுப்ப முடியவில்லை" }); }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim(); const otp = String(req.body.otp || ""); const password = String(req.body.password || "");
    const passwordCheck = validatePassword(password);
    if (!email || !/^\d{6}$/.test(otp) || !passwordCheck.valid) { res.status(400).json({ success: false, message: passwordCheck.message || "மின்னஞ்சல் மற்றும் 6 இலக்கக் குறியீடு தேவை" }); return; }
    const user = await User.findOne({ email });
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) { res.status(400).json({ success: false, message: "குறியீடு தவறானது அல்லது காலாவதியானது" }); return; }
    if (user.passwordResetOtpAttempts >= 5) { res.status(429).json({ success: false, message: "அதிக முயற்சிகள். புதிய குறியீட்டைக் கோரவும்" }); return; }
    if (hashVerificationValue(otp) !== user.passwordResetOtpHash) { user.passwordResetOtpAttempts += 1; await user.save(); res.status(400).json({ success: false, message: "தவறான குறியீடு" }); return; }
    user.password = await bcrypt.hash(password, 10); user.passwordResetOtpHash = undefined; user.passwordResetOtpExpires = undefined; user.passwordResetOtpAttempts = 0; await user.save();
    void sendPasswordResetSuccess(user.email, user.name).catch((emailError) => console.error("Password reset confirmation email failed:", emailError));
    res.json({ success: true, message: "கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது" });
  } catch (error) { console.error("Reset password error:", error); res.status(500).json({ success: false, message: "கடவுச்சொல்லை மீட்டமைக்க முடியவில்லை" }); }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentPassword = String(req.body.currentPassword || ""); const newPassword = String(req.body.newPassword || "");
    const check = validatePassword(newPassword); if (!check.valid) { res.status(400).json({ success: false, message: check.message }); return; }
    const user = await User.findById(req.user?.id); if (!user || !(await bcrypt.compare(currentPassword, user.password))) { res.status(400).json({ success: false, message: "தற்போதைய கடவுச்சொல் தவறானது" }); return; }
    if (await bcrypt.compare(newPassword, user.password)) { res.status(400).json({ success: false, message: "புதிய கடவுச்சொல் பழைய கடவுச்சொல்லிலிருந்து வேறுபட வேண்டும்" }); return; }
    user.password = await bcrypt.hash(newPassword, 10); await user.save(); res.json({ success: true, message: "கடவுச்சொல் மாற்றப்பட்டது" });
  } catch (error) { console.error("Change password error:", error); res.status(500).json({ success: false, message: "கடவுச்சொல்லை மாற்ற முடியவில்லை" }); }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id); if (!user) { res.status(404).json({ success: false, message: "பயனர் கிடைக்கவில்லை" }); return; }
    const name = String(req.body.name || "").trim(); const phone = String(req.body.phone || "").trim(); const email = String(req.body.email || "").toLowerCase().trim();
    if (name.length < 2 || name.length > 50 || !isValidPhone(phone) || !isValidEmail(email)) { res.status(400).json({ success: false, message: "சரியான பெயர், மின்னஞ்சல் மற்றும் 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்" }); return; }
    let verificationRequired = false;
    if (email !== user.email) {
      if (!req.body.currentPassword || !(await bcrypt.compare(String(req.body.currentPassword), user.password))) { res.status(400).json({ success: false, message: "மின்னஞ்சலை மாற்ற தற்போதைய கடவுச்சொல் தேவை" }); return; }
      if (await User.exists({ email, _id: { $ne: user._id } })) { res.status(409).json({ success: false, message: "இந்த மின்னஞ்சல் ஏற்கனவே பயன்படுத்தப்படுகிறது" }); return; }
      const token = generateVerificationToken(); const otp = generateVerificationOtp();
      user.email = email; user.isEmailVerified = false; user.emailVerificationTokenHash = hashVerificationValue(token); user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); user.emailVerificationOtpHash = hashVerificationValue(otp); user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000); user.emailVerificationOtpAttempts = 0; user.emailVerificationLastSentAt = new Date();
      await sendVerificationEmail(email, name, token, otp); verificationRequired = true;
    }
    user.name = name; user.phone = phone; await user.save();
    res.json({ success: true, message: verificationRequired ? "சுயவிவரம் புதுப்பிக்கப்பட்டது. புதிய மின்னஞ்சலை OTP மூலம் உறுதிசெய்யவும்" : "சுயவிவரம் புதுப்பிக்கப்பட்டது", verificationRequired, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, staffApproval: user.staffApproval, permissions: user.permissions, subscription: user.subscription } });
  } catch (error) { console.error("Update profile error:", error); res.status(500).json({ success: false, message: "சுயவிவரத்தைப் புதுப்பிக்க முடியவில்லை" }); }
};
