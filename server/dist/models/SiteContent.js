"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const siteContentSchema = new mongoose_1.Schema({
    key: { type: String, unique: true, default: "main" },
    about: {
        eyebrow: { type: String, default: "எங்கள் கதை" },
        heading: { type: String, default: "தமிழ் வாசிப்பின் மகிழ்ச்சியை ஒவ்வொரு இல்லத்திற்கும் கொண்டு செல்கிறோம்." },
        title: { type: String, default: "தூறல் பதிப்பகம்" },
        description: { type: String, default: "தமிழ் மொழியின் செழுமையையும் சிறந்த படைப்புகளையும் வாசகர்களிடம் கொண்டு சேர்க்கும் நோக்கில் உருவான பதிப்பகம்." },
    },
    hero: {
        badge: { type: String, default: "தேர்ந்தெடுக்கப்பட்ட தமிழ் நூல்கள்" },
        heading: { type: String, default: "மனதில் தூறலாய் தங்கும் கதைகள்." },
        description: { type: String, default: "தமிழ் இலக்கியம், நவீனப் புதினங்கள், சிறார் நூல்கள் மற்றும் வாழ்வியல் சிந்தனைகளின் சிறந்த தொகுப்பு." },
        primaryButton: { type: String, default: "நூல்களைப் பாருங்கள்" },
        secondaryButton: { type: String, default: "வகைகளை ஆராயுங்கள்" },
        imageUrl: { type: String, default: "" },
        imagePublicId: { type: String, default: "" },
    },
    announcement: {
        enabled: { type: Boolean, default: true },
        messages: { type: [String], default: ["₹1,000-க்கு மேல் இலவச விநியோகம்", "தேர்ந்தெடுக்கப்பட்ட தமிழ் நூல்கள்", "பாதுகாப்பான UPI கட்டணம்"] },
        speed: { type: Number, default: 24, min: 5, max: 120 },
        fontSize: { type: Number, default: 13, min: 10, max: 24 },
        textColor: { type: String, default: "#FFFFFF" },
        backgroundColor: { type: String, default: "#0D2B24" },
    },
    footer: {
        description: { type: String, default: "தமிழ் வாசகர்களுக்கான தரமான நூல்களை அன்புடன் தேர்ந்தெடுத்து வழங்குகிறோம்." },
        email: { type: String, default: "support@thooralpathippagam.in" },
        phone: { type: String, default: "+91 98765 43210" },
        address: { type: String, default: "தமிழ்நாடு, இந்தியா" },
        workingHours: { type: String, default: "திங்கள்–சனி, காலை 9–மாலை 6" },
        copyright: { type: String, default: "© 2026 தூறல் பதிப்பகம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை." },
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("SiteContent", siteContentSchema);
