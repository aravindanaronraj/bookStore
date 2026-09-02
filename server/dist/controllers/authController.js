"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logoutUser = exports.getMe = exports.loginUser = exports.resendVerificationEmail = exports.verifyEmailOtp = exports.verifyEmail = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const emailService_1 = require("../services/emailService");
const validators_1 = require("../utils/validators");
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const verification_1 = require("../utils/verification");
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            res.status(400).json({
                success: false,
                message: "Name, email, phone and password are required",
            });
            return;
        }
        if (!(0, validators_1.isValidEmail)(email)) {
            res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
            return;
        }
        if (!(0, validators_1.isValidPhone)(phone)) {
            res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit phone number",
            });
            return;
        }
        const passwordCheck = (0, validators_1.validatePassword)(password);
        if (!passwordCheck.valid) {
            res.status(400).json({
                success: false,
                message: passwordCheck.message,
            });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User_1.default.findOne({
            email: normalizedEmail,
        });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "User already exists with this email",
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Generate raw values
        const verificationToken = (0, verification_1.generateVerificationToken)();
        const verificationOtp = (0, verification_1.generateVerificationOtp)();
        // Hash before storing in database
        const tokenHash = (0, verification_1.hashVerificationValue)(verificationToken);
        const otpHash = (0, verification_1.hashVerificationValue)(verificationOtp);
        // Token expires in 15 minutes
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
        // OTP expires in 10 minutes
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        const user = await User_1.default.create({
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
            await (0, emailService_1.sendVerificationEmail)(user.email, user.name, verificationToken, verificationOtp);
        }
        catch (emailError) {
            console.error("Send Verification Email Error:", emailError);
            // swallow — account exists regardless, don't 500 the registration
        }
        try {
            await (0, emailService_1.sendAdminRegistrationEmail)({ name: user.name, email: user.email, phone: user.phone });
        }
        catch (emailError) {
            console.error("Send Admin Registration Email Error:", emailError);
        }
        res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email to verify your account.",
        });
    }
    catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.registerUser = registerUser;
const verifyEmail = async (req, res) => {
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
        const tokenHash = (0, verification_1.hashVerificationValue)(token);
        const user = await User_1.default.findOne({
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
    }
    catch (error) {
        console.error("Verify Email Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.verifyEmail = verifyEmail;
const verifyEmailOtp = async (req, res) => {
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
        const user = await User_1.default.findOne({
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
                message: "Too many incorrect attempts. Please request a new verification code.",
            });
            return;
        }
        // Check expiry
        if (!user.emailVerificationOtpExpires ||
            user.emailVerificationOtpExpires < new Date()) {
            res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new code.",
            });
            return;
        }
        // Hash submitted OTP
        const otpHash = (0, verification_1.hashVerificationValue)(otp);
        // Compare hash
        if (otpHash !== user.emailVerificationOtpHash) {
            user.emailVerificationOtpAttempts += 1;
            await user.save();
            res.status(400).json({
                success: false,
                message: "Invalid OTP",
                attemptsRemaining: 5 - user.emailVerificationOtpAttempts,
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
    }
    catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.verifyEmailOtp = verifyEmailOtp;
const resendVerificationEmail = async (req, res) => {
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
        const user = await User_1.default.findOne({
            email: normalizedEmail,
            isEmailVerified: false,
        });
        // Don't reveal whether email exists
        if (!user) {
            res.status(200).json({
                success: true,
                message: "If the account exists, a verification email has been sent.",
            });
            return;
        }
        // 60-second resend cooldown
        if (user.emailVerificationLastSentAt) {
            const secondsSinceLastSent = (Date.now() -
                user.emailVerificationLastSentAt.getTime()) /
                1000;
            if (secondsSinceLastSent < 60) {
                res.status(429).json({
                    success: false,
                    message: `Please wait ${Math.ceil(60 - secondsSinceLastSent)} seconds before requesting another code.`,
                });
                return;
            }
        }
        const verificationToken = (0, verification_1.generateVerificationToken)();
        const verificationOtp = (0, verification_1.generateVerificationOtp)();
        const tokenHash = (0, verification_1.hashVerificationValue)(verificationToken);
        const otpHash = (0, verification_1.hashVerificationValue)(verificationOtp);
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.emailVerificationTokenHash = tokenHash;
        user.emailVerificationTokenExpires = tokenExpires;
        user.emailVerificationOtpHash = otpHash;
        user.emailVerificationOtpExpires = otpExpires;
        // Reset attempts for new OTP
        user.emailVerificationOtpAttempts = 0;
        user.emailVerificationLastSentAt = new Date();
        await user.save();
        await (0, emailService_1.sendVerificationEmail)(user.email, user.name, verificationToken, verificationOtp);
        res.status(200).json({
            success: true,
            message: "A new verification email has been sent.",
        });
    }
    catch (error) {
        console.error("Resend Verification Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.resendVerificationEmail = resendVerificationEmail;
// A precomputed dummy hash so bcrypt.compare always runs, even when
// the user doesn't exist — keeps response timing consistent and
// avoids leaking account existence via a fast-path early return.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8pQ5c3XY0F/0i0R2NfF5DlfQZALy0S";
const loginUser = async (req, res) => {
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
        const user = await User_1.default.findOne({
            email: normalizedEmail,
        });
        // 3. Compare password — always, even if user doesn't exist,
        //    so timing and response shape are identical either way.
        const isPasswordCorrect = await bcryptjs_1.default.compare(password, user ? user.password : DUMMY_HASH);
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
        const token = (0, generateToken_1.default)(user._id.toString());
        // 6. Store JWT in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.loginUser = loginUser;
const getMe = async (req, res) => {
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
    }
    catch (error) {
        console.error("Get Me Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.getMe = getMe;
const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        });
        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }
    catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.logoutUser = logoutUser;
const forgotPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "").toLowerCase().trim();
        if (!(0, validators_1.isValidEmail)(email)) {
            res.status(400).json({ success: false, message: "சரியான மின்னஞ்சலை உள்ளிடவும்" });
            return;
        }
        const user = await User_1.default.findOne({ email });
        if (user) {
            const otp = (0, verification_1.generateVerificationOtp)();
            user.passwordResetOtpHash = (0, verification_1.hashVerificationValue)(otp);
            user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
            user.passwordResetOtpAttempts = 0;
            await user.save();
            await (0, emailService_1.sendPasswordResetOtp)(user.email, user.name, otp);
        }
        res.json({ success: true, message: "கணக்கு இருந்தால் மீட்டமைப்புக் குறியீடு மின்னஞ்சலுக்கு அனுப்பப்பட்டுள்ளது" });
    }
    catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: "மீட்டமைப்புக் குறியீட்டை அனுப்ப முடியவில்லை" });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "").toLowerCase().trim();
        const otp = String(req.body.otp || "");
        const password = String(req.body.password || "");
        const passwordCheck = (0, validators_1.validatePassword)(password);
        if (!email || !/^\d{6}$/.test(otp) || !passwordCheck.valid) {
            res.status(400).json({ success: false, message: passwordCheck.message || "மின்னஞ்சல் மற்றும் 6 இலக்கக் குறியீடு தேவை" });
            return;
        }
        const user = await User_1.default.findOne({ email });
        if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
            res.status(400).json({ success: false, message: "குறியீடு தவறானது அல்லது காலாவதியானது" });
            return;
        }
        if (user.passwordResetOtpAttempts >= 5) {
            res.status(429).json({ success: false, message: "அதிக முயற்சிகள். புதிய குறியீட்டைக் கோரவும்" });
            return;
        }
        if ((0, verification_1.hashVerificationValue)(otp) !== user.passwordResetOtpHash) {
            user.passwordResetOtpAttempts += 1;
            await user.save();
            res.status(400).json({ success: false, message: "தவறான குறியீடு" });
            return;
        }
        user.password = await bcryptjs_1.default.hash(password, 10);
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpires = undefined;
        user.passwordResetOtpAttempts = 0;
        await user.save();
        void (0, emailService_1.sendPasswordResetSuccess)(user.email, user.name).catch((emailError) => console.error("Password reset confirmation email failed:", emailError));
        res.json({ success: true, message: "கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது" });
    }
    catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "கடவுச்சொல்லை மீட்டமைக்க முடியவில்லை" });
    }
};
exports.resetPassword = resetPassword;
const changePassword = async (req, res) => {
    try {
        const currentPassword = String(req.body.currentPassword || "");
        const newPassword = String(req.body.newPassword || "");
        const check = (0, validators_1.validatePassword)(newPassword);
        if (!check.valid) {
            res.status(400).json({ success: false, message: check.message });
            return;
        }
        const user = await User_1.default.findById(req.user?.id);
        if (!user || !(await bcryptjs_1.default.compare(currentPassword, user.password))) {
            res.status(400).json({ success: false, message: "தற்போதைய கடவுச்சொல் தவறானது" });
            return;
        }
        if (await bcryptjs_1.default.compare(newPassword, user.password)) {
            res.status(400).json({ success: false, message: "புதிய கடவுச்சொல் பழைய கடவுச்சொல்லிலிருந்து வேறுபட வேண்டும்" });
            return;
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 10);
        await user.save();
        res.json({ success: true, message: "கடவுச்சொல் மாற்றப்பட்டது" });
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ success: false, message: "கடவுச்சொல்லை மாற்ற முடியவில்லை" });
    }
};
exports.changePassword = changePassword;
const updateProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?.id);
        if (!user) {
            res.status(404).json({ success: false, message: "பயனர் கிடைக்கவில்லை" });
            return;
        }
        const name = String(req.body.name || "").trim();
        const phone = String(req.body.phone || "").trim();
        const email = String(req.body.email || "").toLowerCase().trim();
        if (name.length < 2 || name.length > 50 || !(0, validators_1.isValidPhone)(phone) || !(0, validators_1.isValidEmail)(email)) {
            res.status(400).json({ success: false, message: "சரியான பெயர், மின்னஞ்சல் மற்றும் 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்" });
            return;
        }
        let verificationRequired = false;
        if (email !== user.email) {
            if (!req.body.currentPassword || !(await bcryptjs_1.default.compare(String(req.body.currentPassword), user.password))) {
                res.status(400).json({ success: false, message: "மின்னஞ்சலை மாற்ற தற்போதைய கடவுச்சொல் தேவை" });
                return;
            }
            if (await User_1.default.exists({ email, _id: { $ne: user._id } })) {
                res.status(409).json({ success: false, message: "இந்த மின்னஞ்சல் ஏற்கனவே பயன்படுத்தப்படுகிறது" });
                return;
            }
            const token = (0, verification_1.generateVerificationToken)();
            const otp = (0, verification_1.generateVerificationOtp)();
            user.email = email;
            user.isEmailVerified = false;
            user.emailVerificationTokenHash = (0, verification_1.hashVerificationValue)(token);
            user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            user.emailVerificationOtpHash = (0, verification_1.hashVerificationValue)(otp);
            user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
            user.emailVerificationOtpAttempts = 0;
            user.emailVerificationLastSentAt = new Date();
            await (0, emailService_1.sendVerificationEmail)(email, name, token, otp);
            verificationRequired = true;
        }
        user.name = name;
        user.phone = phone;
        await user.save();
        res.json({ success: true, message: verificationRequired ? "சுயவிவரம் புதுப்பிக்கப்பட்டது. புதிய மின்னஞ்சலை OTP மூலம் உறுதிசெய்யவும்" : "சுயவிவரம் புதுப்பிக்கப்பட்டது", verificationRequired, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, staffApproval: user.staffApproval, permissions: user.permissions, subscription: user.subscription } });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ success: false, message: "சுயவிவரத்தைப் புதுப்பிக்க முடியவில்லை" });
    }
};
exports.updateProfile = updateProfile;
