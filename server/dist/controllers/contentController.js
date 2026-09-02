"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContactMessage = exports.updateContactStatus = exports.getContactMessages = exports.updateSiteContent = exports.getPublicContent = void 0;
const ContactMessage_1 = __importDefault(require("../models/ContactMessage"));
const SiteContent_1 = __importDefault(require("../models/SiteContent"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const getContentDocument = () => SiteContent_1.default.findOneAndUpdate({ key: "main" }, { $setOnInsert: { key: "main" } }, { returnDocument: "after", upsert: true, setDefaultsOnInsert: true });
const getPublicContent = async (_req, res) => {
    try {
        res.json({ success: true, content: await getContentDocument() });
    }
    catch {
        res.status(500).json({ success: false, message: "உள்ளடக்கத்தை ஏற்ற முடியவில்லை" });
    }
};
exports.getPublicContent = getPublicContent;
const updateSiteContent = async (req, res) => {
    try {
        const { about, footer, hero, announcement } = req.body;
        const updates = {};
        for (const [section, rawValues] of Object.entries({ about, footer, hero })) {
            let values = rawValues;
            if (typeof values === "string") {
                try {
                    values = JSON.parse(values);
                }
                catch {
                    values = undefined;
                }
            }
            if (!values || typeof values !== "object")
                continue;
            for (const [field, value] of Object.entries(values))
                if (typeof value === "string")
                    updates[`${section}.${field}`] = value.trim();
        }
        let announcementValues = announcement;
        if (typeof announcementValues === "string") {
            try {
                announcementValues = JSON.parse(announcementValues);
            }
            catch {
                announcementValues = undefined;
            }
        }
        if (announcementValues && typeof announcementValues === "object") {
            const data = announcementValues;
            if (Array.isArray(data.messages))
                updates["announcement.messages"] = data.messages.map(String).map((item) => item.trim()).filter(Boolean);
            if (typeof data.enabled === "boolean")
                updates["announcement.enabled"] = data.enabled;
            const speed = Number(data.speed);
            const fontSize = Number(data.fontSize);
            if (Number.isFinite(speed))
                updates["announcement.speed"] = Math.min(120, Math.max(5, speed));
            if (Number.isFinite(fontSize))
                updates["announcement.fontSize"] = Math.min(24, Math.max(10, fontSize));
            if (typeof data.textColor === "string")
                updates["announcement.textColor"] = data.textColor;
            if (typeof data.backgroundColor === "string")
                updates["announcement.backgroundColor"] = data.backgroundColor;
        }
        const current = await getContentDocument();
        const file = req.file;
        if (file) {
            if (current?.hero?.imagePublicId)
                await cloudinary_1.default.uploader.destroy(current.hero.imagePublicId).catch(() => undefined);
            updates["hero.imageUrl"] = file.path;
            updates["hero.imagePublicId"] = file.filename;
        }
        const content = await SiteContent_1.default.findOneAndUpdate({ key: "main" }, { $set: updates, $setOnInsert: { key: "main" } }, { returnDocument: "after", upsert: true, setDefaultsOnInsert: true });
        res.json({ success: true, message: "இணையதள உள்ளடக்கம் புதுப்பிக்கப்பட்டது", content });
    }
    catch {
        res.status(500).json({ success: false, message: "உள்ளடக்கத்தைப் புதுப்பிக்க முடியவில்லை" });
    }
};
exports.updateSiteContent = updateSiteContent;
const getContactMessages = async (_req, res) => {
    try {
        res.json({ success: true, messages: await ContactMessage_1.default.find().sort({ createdAt: -1 }).limit(200) });
    }
    catch {
        res.status(500).json({ success: false, message: "தொடர்புச் செய்திகளை ஏற்ற முடியவில்லை" });
    }
};
exports.getContactMessages = getContactMessages;
const updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["new", "read", "resolved"].includes(status)) {
            res.status(400).json({ success: false, message: "தவறான நிலை" });
            return;
        }
        const message = await ContactMessage_1.default.findByIdAndUpdate(req.params.id, { status }, { returnDocument: "after" });
        if (!message) {
            res.status(404).json({ success: false, message: "செய்தி கிடைக்கவில்லை" });
            return;
        }
        res.json({ success: true, message });
    }
    catch {
        res.status(500).json({ success: false, message: "நிலையை மாற்ற முடியவில்லை" });
    }
};
exports.updateContactStatus = updateContactStatus;
const deleteContactMessage = async (req, res) => {
    try {
        const message = await ContactMessage_1.default.findByIdAndDelete(req.params.id);
        if (!message) {
            res.status(404).json({ success: false, message: "செய்தி கிடைக்கவில்லை" });
            return;
        }
        res.json({ success: true, message: "தொடர்புச் செய்தி நீக்கப்பட்டது" });
    }
    catch {
        res.status(500).json({ success: false, message: "செய்தியை நீக்க முடியவில்லை" });
    }
};
exports.deleteContactMessage = deleteContactMessage;
