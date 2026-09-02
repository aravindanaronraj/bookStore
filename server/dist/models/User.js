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
const addressSchema = new mongoose_1.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    pincode: {
        type: String,
        required: true,
        trim: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, {
    _id: true,
});
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ["user", "staff", "admin"],
        default: "user",
    },
    staffApproval: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    permissions: {
        type: [String],
        enum: ["dashboard", "products", "orders", "customers"],
        default: [],
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    addresses: {
        type: [addressSchema],
        default: [],
    },
    subscription: {
        plan: {
            type: String,
            enum: ["free", "premium"],
            default: "free",
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
    },
    emailVerificationTokenHash: {
        type: String,
    },
    emailVerificationTokenExpires: {
        type: Date,
    },
    emailVerificationOtpHash: {
        type: String,
    },
    emailVerificationOtpExpires: {
        type: Date,
    },
    emailVerificationOtpAttempts: {
        type: Number,
        default: 0,
    },
    emailVerificationLastSentAt: {
        type: Date,
    },
    passwordResetOtpHash: { type: String },
    passwordResetOtpExpires: { type: Date },
    passwordResetOtpAttempts: { type: Number, default: 0 },
}, {
    timestamps: true,
});
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
