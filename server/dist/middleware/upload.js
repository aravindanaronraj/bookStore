"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadToCloudinary_1 = __importDefault(require("../utils/uploadToCloudinary"));
const fileFilter = (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp)$/i;
    if (allowed.test(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
    }
};
const memoryUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
});
const uploadFiles = (field, maxCount) => {
    const parse = maxCount === 1
        ? memoryUpload.single(field)
        : memoryUpload.array(field, maxCount);
    return (req, res, next) => {
        parse(req, res, async (parseError) => {
            if (parseError)
                return next(parseError);
            const files = maxCount === 1
                ? (req.file ? [req.file] : [])
                : (req.files || []);
            if (!files.length)
                return next();
            const uploadedPublicIds = [];
            try {
                for (const file of files) {
                    const uploaded = await (0, uploadToCloudinary_1.default)(file.buffer, "bookstore/books");
                    uploadedPublicIds.push(uploaded.publicId);
                    // Preserve the Multer file fields already consumed by the controllers.
                    file.path = uploaded.url;
                    file.filename = uploaded.publicId;
                }
                next();
            }
            catch (error) {
                if (uploadedPublicIds.length) {
                    await cloudinary_1.default.api.delete_resources(uploadedPublicIds).catch(() => undefined);
                }
                next(error);
            }
        });
    };
};
const upload = {
    array: (field, maxCount = 10) => uploadFiles(field, maxCount),
    single: (field) => uploadFiles(field, 1),
};
exports.default = upload;
