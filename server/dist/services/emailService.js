"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminRegistrationEmail = exports.sendOrderConfirmationEmails = exports.sendPasswordResetSuccess = exports.sendPasswordResetOtp = exports.sendVerificationEmail = exports.sendContactNotification = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const getAdminRecipients = () => (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[character] || character));
const requireEmailConfig = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email configuration is incomplete: EMAIL_USER and EMAIL_PASS are required");
    }
};
const readEmailTemplate = (fileName) => promises_1.default.readFile(path_1.default.join(process.cwd(), "src", "templates", "emails", fileName), "utf-8");
const renderTemplate = (template, values) => Object.entries(values).reduce((html, [key, value]) => html.replace(new RegExp(`{{${key}}}`, "g"), value), template);
const sendContactNotification = async (contact) => {
    const recipients = getAdminRecipients();
    if (!recipients.length || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Contact email notification skipped: email configuration is incomplete");
        return;
    }
    const safeName = escapeHtml(contact.name);
    const safeEmail = escapeHtml(contact.email);
    const safeSubject = escapeHtml(contact.subject);
    const safeMessage = escapeHtml(contact.message).replace(/\r?\n/g, "<br />");
    await transporter.sendMail({
        from: `"தூறல் பதிப்பகம்" <${process.env.EMAIL_USER}>`, to: recipients, replyTo: contact.email,
        subject: `புதிய தொடர்புச் செய்தி: ${contact.subject}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:28px;color:#173f35"><h2>புதிய தொடர்புச் செய்தி</h2><p><strong>பெயர்:</strong> ${safeName}</p><p><strong>மின்னஞ்சல்:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p><p><strong>தலைப்பு:</strong> ${safeSubject}</p><div style="margin-top:20px;padding:18px;background:#f4f6f5;border-left:4px solid #c99935;line-height:1.7">${safeMessage}</div><p style="margin-top:22px;color:#66756f">இந்த மின்னஞ்சலுக்கு Reply செய்தால் வாடிக்கையாளருக்கு நேரடியாக பதிலளிக்கலாம்.</p></div>`,
    });
};
exports.sendContactNotification = sendContactNotification;
const sendVerificationEmail = async (email, name, verificationToken, verificationOtp) => {
    const templatePath = path_1.default.join(process.cwd(), "src", "templates", "emails", "verifyEmail.html");
    let html = await promises_1.default.readFile(templatePath, "utf-8");
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
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
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetOtp = async (email, name, otp) => {
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
exports.sendPasswordResetOtp = sendPasswordResetOtp;
const sendPasswordResetSuccess = async (email, name) => {
    await transporter.sendMail({
        from: `"தூறல் பதிப்பகம்" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "உங்கள் கடவுச்சொல் மாற்றப்பட்டது",
        html: `<div style="font-family:Arial,'Noto Sans Tamil',sans-serif;max-width:560px;margin:auto;padding:28px;color:#172554"><h2>வணக்கம் ${escapeHtml(name)},</h2><p>உங்கள் தூறல் பதிப்பகம் கணக்கின் கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது.</p><p>இந்த மாற்றத்தை நீங்கள் செய்யவில்லை என்றால், உடனடியாக எங்கள் ஆதரவுக் குழுவைத் தொடர்புகொள்ளவும்.</p><p style="margin-top:28px;color:#64748b">நன்றி,<br /><strong>தூறல் பதிப்பகம்</strong></p></div>`,
    });
};
exports.sendPasswordResetSuccess = sendPasswordResetSuccess;
const money = (value) => new Intl.NumberFormat("ta-IN", { style: "currency", currency: "INR" }).format(value);
const orderRows = (order) => order.items.map((item) => `<tr><td style="padding:10px;border-bottom:1px solid #dbeafe">${escapeHtml(item.title)}</td><td style="padding:10px;text-align:center;border-bottom:1px solid #dbeafe">${item.quantity}</td><td style="padding:10px;text-align:right;border-bottom:1px solid #dbeafe">${money(item.price * item.quantity)}</td></tr>`).join("");
const addressHtml = (order) => [order.shippingAddress.addressLine1, order.shippingAddress.addressLine2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode, order.shippingAddress.country].filter(Boolean).map((part) => escapeHtml(String(part))).join(", ");
const sendLegacyOrderConfirmationEmails = async (order) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Order emails skipped: email configuration is incomplete");
        return;
    }
    const adminRecipients = getAdminRecipients();
    const orderNumber = escapeHtml(order.id.slice(-8).toUpperCase());
    const summary = `<table style="width:100%;border-collapse:collapse;margin:22px 0"><thead><tr style="background:#eff6ff"><th style="padding:10px;text-align:left">நூல்</th><th style="padding:10px">எண்ணிக்கை</th><th style="padding:10px;text-align:right">தொகை</th></tr></thead><tbody>${orderRows(order)}</tbody></table><p>இடைத் தொகை: <strong>${money(order.subtotal)}</strong><br />தள்ளுபடி: <strong>${money(order.discount)}</strong><br />விநியோகக் கட்டணம்: <strong>${money(order.shippingFee)}</strong></p><p style="font-size:18px">மொத்தம்: <strong>${money(order.totalAmount)}</strong></p>`;
    const shell = (body) => `<div style="font-family:Arial,'Noto Sans Tamil',sans-serif;max-width:680px;margin:auto;padding:30px;color:#172554;border:1px solid #dbeafe;border-radius:12px"><div style="padding-bottom:18px;border-bottom:3px solid #2563eb"><h2 style="margin:0">தூறல் பதிப்பகம்</h2></div>${body}<p style="margin-top:28px;color:#64748b">நன்றி,<br /><strong>தூறல் பதிப்பகம்</strong></p></div>`;
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
const sendOrderConfirmationEmails = async (order) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Order emails skipped: email configuration is incomplete");
        return;
    }
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
    await Promise.all([
        transporter.sendMail({ from: `"Thooral Pathippagam" <${process.env.EMAIL_USER}>`, to: order.customerEmail, subject: `Order confirmed - #${values.orderNumber}`, html: renderTemplate(customerTemplate, values) }),
        transporter.sendMail({ from: `"Thooral Pathippagam" <${process.env.EMAIL_USER}>`, to: getAdminRecipients(), replyTo: order.customerEmail, subject: `New order received - #${values.orderNumber}`, html: renderTemplate(adminTemplate, values) }),
    ]);
};
exports.sendOrderConfirmationEmails = sendOrderConfirmationEmails;
const sendAdminRegistrationEmail = async (user) => {
    requireEmailConfig();
    const recipients = getAdminRecipients();
    if (!recipients.length)
        return;
    const template = await readEmailTemplate("newCustomerAdmin.html");
    const html = renderTemplate(template, {
        customerName: escapeHtml(user.name), customerEmail: escapeHtml(user.email),
        customerPhone: escapeHtml(user.phone),
        registeredAt: escapeHtml(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })),
    });
    await transporter.sendMail({ from: `"Thooral Pathippagam" <${process.env.EMAIL_USER}>`, to: recipients, replyTo: user.email, subject: `New customer registered - ${user.name}`, html });
};
exports.sendAdminRegistrationEmail = sendAdminRegistrationEmail;
