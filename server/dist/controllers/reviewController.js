"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBookReview = exports.getBookReviews = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Review_1 = __importDefault(require("../models/Review"));
const Book_1 = __importDefault(require("../models/Book"));
const getBookReviews = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid book ID" });
            return;
        }
        const [reviews, stats] = await Promise.all([Review_1.default.find({ book: id }).populate("user", "name").sort({ createdAt: -1 }).limit(100), Review_1.default.aggregate([{ $match: { book: new mongoose_1.default.Types.ObjectId(id) } }, { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }])]);
        res.json({ success: true, reviews, averageRating: stats[0]?.average || 0, reviewCount: stats[0]?.count || 0 });
    }
    catch {
        res.status(500).json({ success: false, message: "Unable to load reviews" });
    }
};
exports.getBookReviews = getBookReviews;
const saveBookReview = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const rating = Number(req.body.rating);
        const comment = String(req.body.comment || "").trim();
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id) || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3 || comment.length > 1000) {
            res.status(400).json({ success: false, message: "1 முதல் 5 வரை மதிப்பீடும் குறைந்தது 3 எழுத்து விமர்சனமும் தேவை" });
            return;
        }
        if (!await Book_1.default.exists({ _id: id, isActive: true })) {
            res.status(404).json({ success: false, message: "Book not found" });
            return;
        }
        const review = await Review_1.default.findOneAndUpdate({ book: id, user: req.user?.id }, { $set: { rating, comment } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }).populate("user", "name");
        res.json({ success: true, message: "உங்கள் மதிப்புரை சேமிக்கப்பட்டது", review });
    }
    catch (error) {
        console.error("Save review error:", error);
        res.status(500).json({ success: false, message: "மதிப்புரையைச் சேமிக்க முடியவில்லை" });
    }
};
exports.saveBookReview = saveBookReview;
