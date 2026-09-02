"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerificationOtp = exports.generateVerificationToken = exports.hashVerificationValue = void 0;
const crypto_1 = __importDefault(require("crypto"));
const hashVerificationValue = (value) => {
    return crypto_1.default
        .createHash("sha256")
        .update(value)
        .digest("hex");
};
exports.hashVerificationValue = hashVerificationValue;
const generateVerificationToken = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
exports.generateVerificationToken = generateVerificationToken;
const generateVerificationOtp = () => {
    return crypto_1.default.randomInt(100000, 1000000).toString();
};
exports.generateVerificationOtp = generateVerificationOtp;
