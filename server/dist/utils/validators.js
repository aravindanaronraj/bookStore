"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.isValidPhone = exports.isValidEmail = void 0;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/; // adjust if you need country codes
const isValidEmail = (email) => EMAIL_REGEX.test(email.trim());
exports.isValidEmail = isValidEmail;
const isValidPhone = (phone) => PHONE_REGEX.test(phone.trim());
exports.isValidPhone = isValidPhone;
const validatePassword = (password) => {
    if (password.length < 8) {
        return { valid: false, message: "Password must be at least 8 characters" };
    }
    if (!/[a-z]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one lowercase letter",
        };
    }
    if (!/[A-Z]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one uppercase letter",
        };
    }
    if (!/[0-9]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one number",
        };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one special character",
        };
    }
    return { valid: true };
};
exports.validatePassword = validatePassword;
