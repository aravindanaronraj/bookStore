"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default,
    params: async () => ({
        folder: "bookstore/books",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    }),
});
const fileFilter = (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp)$/i;
    if (allowed.test(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
    }
};
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
});
exports.default = upload;
