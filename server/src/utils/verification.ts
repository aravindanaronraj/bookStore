import crypto from "crypto";

export const hashVerificationValue = (value: string): string => {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateVerificationOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};