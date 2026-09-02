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

export const verifyEmailTransport = async (): Promise<void> => {
  requireEmailConfig();
  await transporter.verify();
};

const getAdminRecipients = (): string[] => (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[character] || character));

const requireEmailConfig = (): void => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email configuration is incomplete: EMAIL_USER and EMAIL_PASS are required");
  }
};

const readEmailTemplate = async (fileName: string): Promise<string> => {
  const candidates = [
    path.join(__dirname, "..", "templates", "emails", fileName),
    path.join(process.cwd(), "src", "templates", "emails", fileName),
    path.join(process.cwd(), "dist", "templates", "emails", fileName),
  ];

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, "utf-8");
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  throw new Error(`Email template not found: ${fileName}`);
};

const renderTemplate = (template: string, values: Record<string, string>): string =>
  Object.entries(values).reduce(
    (html, [key, value]) => html.replace(new RegExp(`{{${key}}}`, "g"), value),
    template
  );

export const sendContactNotification = async (contact: { name: string; email: string; subject: string; message: string }): Promise<void> => {
  const recipients = getAdminRecipients();
  if (!recipients.length || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) { console.warn("Contact email notification skipped: email configuration is incomplete"); return; }
  const safeName = escapeHtml(contact.name); const safeEmail = escapeHtml(contact.email); const safeSubject = escapeHtml(contact.subject);
  const safeMessage = escapeHtml(contact.message).replace(/\r?\n/g, "<br />");
  await transporter.sendMail({
    from: `"தூறல் பதிப்பகம்" <${process.env.EMAIL_USER}>`, to: recipients, replyTo: contact.email,
    subject: `புதிய தொடர்புச் செய்தி: ${contact.subject}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:28px;color:#173f35"><h2>புதிய தொடர்புச் செய்தி</h2><p><strong>பெயர்:</strong> ${safeName}</p><p><strong>மின்னஞ்சல்:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p><p><strong>தலைப்பு:</strong> ${safeSubject}</p><div style="margin-top:20px;padding:18px;background:#f4f6f5;border-left:4px solid #c99935;line-height:1.7">${safeMessage}</div><p style="margin-top:22px;color:#66756f">இந்த மின்னஞ்சலுக்கு Reply செய்தால் வாடிக்கையாளருக்கு நேரடியாக பதிலளிக்கலாம்.</p></div>`,
  });
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationToken: string,
  verificationOtp: string
): Promise<void> => {
  requireEmailConfig();
  let html = await readEmailTemplate("verifyEmail.html");

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const verificationUrl = `${frontendUrl}/verify-email/${encodeURIComponent(verificationToken)}`;

  html = html
    .replace(/{{name}}/g, escapeHtml(name))
    .replace(/{{verificationUrl}}/g, verificationUrl)
    .replace(/{{otp}}/g, verificationOtp);

  await transporter.sendMail({
    from: `"தூறல் பதிப்பகம்" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "தூறல் பதிப்பகம் - மின்னஞ்சல் உறுதிப்படுத்தல்",
    html,
  });
};

export const sendPasswordResetOtp = async (email: string, name: string, otp: string): Promise<void> => {
  requireEmailConfig();
  const template = await readEmailTemplate("passwordResetOtp.html");
  const html = template
    .replace(/{{name}}/g, escapeHtml(name))
    .replace(/{{otp}}/g, escapeHtml(otp));

  await transporter.sendMail({
    from: `"தூறல் பதிப்பகம்" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "கடவுச்சொல் மீட்டமைப்பு குறியீடு",
    html,
  });
};

export const sendPasswordResetSuccess = async (email: string, name: string): Promise<void> => {
  requireEmailConfig();
  await transporter.sendMail({
    from: `"தூறல் பதிப்பகம்" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "உங்கள் கடவுச்சொல் மாற்றப்பட்டது",
    html: `<div style="font-family:Arial,'Noto Sans Tamil',sans-serif;max-width:560px;margin:auto;padding:28px;color:#172554"><h2>வணக்கம் ${escapeHtml(name)},</h2><p>உங்கள் தூறல் பதிப்பகம் கணக்கின் கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது.</p><p>இந்த மாற்றத்தை நீங்கள் செய்யவில்லை என்றால், உடனடியாக எங்கள் ஆதரவுக் குழுவைத் தொடர்புகொள்ளவும்.</p><p style="margin-top:28px;color:#64748b">நன்றி,<br /><strong>தூறல் பதிப்பகம்</strong></p></div>`,
  });
};

type OrderEmailData = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { title: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: { addressLine1: string; addressLine2?: string; city: string; state: string; postalCode: string; country: string };
};

const money = (value: number) => new Intl.NumberFormat("ta-IN", { style: "currency", currency: "INR" }).format(value);
const orderRows = (order: OrderEmailData) => order.items.map((item) => `<tr><td style="padding:10px;border-bottom:1px solid #dbeafe">${escapeHtml(item.title)}</td><td style="padding:10px;text-align:center;border-bottom:1px solid #dbeafe">${item.quantity}</td><td style="padding:10px;text-align:right;border-bottom:1px solid #dbeafe">${money(item.price * item.quantity)}</td></tr>`).join("");
const addressHtml = (order: OrderEmailData) => [order.shippingAddress.addressLine1, order.shippingAddress.addressLine2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode, order.shippingAddress.country].filter(Boolean).map((part) => escapeHtml(String(part))).join(", ");

const sendLegacyOrderConfirmationEmails = async (order: OrderEmailData): Promise<void> => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) { console.warn("Order emails skipped: email configuration is incomplete"); return; }
  const adminRecipients = getAdminRecipients();
  const orderNumber = escapeHtml(order.id.slice(-8).toUpperCase());
  const summary = `<table style="width:100%;border-collapse:collapse;margin:22px 0"><thead><tr style="background:#eff6ff"><th style="padding:10px;text-align:left">நூல்</th><th style="padding:10px">எண்ணிக்கை</th><th style="padding:10px;text-align:right">தொகை</th></tr></thead><tbody>${orderRows(order)}</tbody></table><p>இடைத் தொகை: <strong>${money(order.subtotal)}</strong><br />தள்ளுபடி: <strong>${money(order.discount)}</strong><br />விநியோகக் கட்டணம்: <strong>${money(order.shippingFee)}</strong></p><p style="font-size:18px">மொத்தம்: <strong>${money(order.totalAmount)}</strong></p>`;
  const shell = (body: string) => `<div style="font-family:Arial,'Noto Sans Tamil',sans-serif;max-width:680px;margin:auto;padding:30px;color:#172554;border:1px solid #dbeafe;border-radius:12px"><div style="padding-bottom:18px;border-bottom:3px solid #2563eb"><h2 style="margin:0">தூறல் பதிப்பகம்</h2></div>${body}<p style="margin-top:28px;color:#64748b">நன்றி,<br /><strong>தூறல் பதிப்பகம்</strong></p></div>`;

  await Promise.all([
    transporter.sendMail({
      from: `"தூறல் பதிப்பகம்" <${process.env.EMAIL_USER}>`, to: order.customerEmail,
      subject: `உங்கள் ஆர்டர் உறுதிசெய்யப்பட்டது - #${orderNumber}`,
      html: shell(`<h2>வணக்கம் ${escapeHtml(order.customerName)},</h2><p>உங்கள் ஆர்டர் வெற்றிகரமாக உறுதிசெய்யப்பட்டது. ஆர்டர் எண்: <strong>#${orderNumber}</strong></p>${summary}<h3>விநியோக முகவரி</h3><p>${addressHtml(order)}</p><p>உங்கள் ஆர்டர் அனுப்பப்பட்டதும் அடுத்த தகவலைத் தெரிவிப்போம்.</p>`),
    }),
    transporter.sendMail({
      from: `"தூறல் பதிப்பகம்" <${process.env.EMAIL_USER}>`, to: adminRecipients, replyTo: order.customerEmail,
      subject: `புதிய ஆர்டர் பெறப்பட்டது - #${orderNumber}`,
      html: shell(`<h2>புதிய ஆர்டர் பெறப்பட்டது</h2><p>ஆர்டர் எண்: <strong>#${orderNumber}</strong></p><p><strong>வாடிக்கையாளர்:</strong> ${escapeHtml(order.customerName)}<br /><strong>மின்னஞ்சல்:</strong> ${escapeHtml(order.customerEmail)}<br /><strong>தொலைபேசி:</strong> ${escapeHtml(order.customerPhone)}</p>${summary}<h3>விநியோக முகவரி</h3><p>${addressHtml(order)}</p><p>ஆர்டரை நிர்வாகப் பலகையில் சரிபார்த்து செயலாக்கவும்.</p>`),
    }),
  ]);
};

export const sendOrderConfirmationEmails = async (order: OrderEmailData): Promise<void> => {
  requireEmailConfig();
  const adminRecipients = getAdminRecipients();
  if (!adminRecipients.length) throw new Error("ADMIN_EMAIL or EMAIL_USER is required for order notifications");
  const [customerTemplate, adminTemplate] = await Promise.all([
    readEmailTemplate("orderConfirmation.html"),
    readEmailTemplate("newOrderAdmin.html"),
  ]);
  const values = {
    orderNumber: escapeHtml(order.id.slice(-8).toUpperCase()),
    customerName: escapeHtml(order.customerName), customerEmail: escapeHtml(order.customerEmail),
    customerPhone: escapeHtml(order.customerPhone), orderRows: orderRows(order),
    subtotal: money(order.subtotal), discount: money(order.discount),
    shippingFee: money(order.shippingFee), totalAmount: money(order.totalAmount),
    shippingAddress: addressHtml(order),
  };
  const results = await Promise.allSettled([
    transporter.sendMail({ from: `"Thooral Pathippagam" <${process.env.EMAIL_USER}>`, to: order.customerEmail, subject: `Order confirmed - #${values.orderNumber}`, html: renderTemplate(customerTemplate, values) }),
    transporter.sendMail({ from: `"Thooral Pathippagam" <${process.env.EMAIL_USER}>`, to: adminRecipients, replyTo: order.customerEmail, subject: `New order received - #${values.orderNumber}`, html: renderTemplate(adminTemplate, values) }),
  ]);
  const failures = results
    .map((result, index) => result.status === "rejected" ? `${index === 0 ? "customer" : "admin"}: ${String(result.reason)}` : null)
    .filter(Boolean);
  if (failures.length) throw new Error(`Order email delivery failed (${failures.join("; ")})`);
};

export const sendAdminRegistrationEmail = async (user: { name: string; email: string; phone: string }): Promise<void> => {
  requireEmailConfig();
  const recipients = getAdminRecipients();
  if (!recipients.length) return;
  const template = await readEmailTemplate("newCustomerAdmin.html");
  const html = renderTemplate(template, {
    customerName: escapeHtml(user.name), customerEmail: escapeHtml(user.email),
    customerPhone: escapeHtml(user.phone),
    registeredAt: escapeHtml(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })),
  });
  await transporter.sendMail({ from: `"Thooral Pathippagam" <${process.env.EMAIL_USER}>`, to: recipients, replyTo: user.email, subject: `New customer registered - ${user.name}`, html });
};
