import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationToken: string,
  verificationOtp: string
): Promise<void> => {
  const templatePath = path.join(
  process.cwd(),
  "src",
  "templates",
  "emails",
  "verifyEmail.html"
);

  let html = await fs.readFile(templatePath, "utf-8");

  const verificationUrl =
    `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  html = html
    .replace(/{{name}}/g, name)
    .replace(/{{verificationUrl}}/g, verificationUrl)
    .replace(/{{otp}}/g, verificationOtp);

  await transporter.sendMail({
    from: `"Book Store" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Book Store Email",
    html,
  });
};