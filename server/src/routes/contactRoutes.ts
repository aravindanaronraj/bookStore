import { Router } from "express";
import ContactMessage from "../models/ContactMessage";
import { sendContactNotification } from "../services/emailService";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) { res.status(400).json({ success: false, message: "அனைத்து விவரங்களையும் நிரப்பவும்" }); return; }
    const clean = { name: String(name).trim(), email: String(email).trim().toLowerCase(), subject: String(subject).trim(), message: String(message).trim() };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) { res.status(400).json({ success: false, message: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்" }); return; }
    await ContactMessage.create(clean);
    void sendContactNotification(clean).catch((error) => console.error("Contact notification email failed:", error));
    res.status(201).json({ success: true, message: "உங்கள் செய்தி பெறப்பட்டது" });
  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ success: false, message: "செய்தியை அனுப்ப முடியவில்லை" });
  }
});

export default router;
