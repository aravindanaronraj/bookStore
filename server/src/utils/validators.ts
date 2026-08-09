const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/; // adjust if you need country codes

export const isValidEmail = (email: string): boolean =>
  EMAIL_REGEX.test(email.trim());

export const isValidPhone = (phone: string): boolean =>
  PHONE_REGEX.test(phone.trim());

export interface PasswordCheckResult {
  valid: boolean;
  message?: string;
}

export const validatePassword = (password: string): PasswordCheckResult => {
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