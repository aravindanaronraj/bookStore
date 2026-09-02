import { Request, Response } from "express";
import mongoose from "mongoose";
import Review from "../models/Review";
import Book from "../models/Book";
import { AuthRequest } from "../middleware/protect";

export const getBookReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ success: false, message: "Invalid book ID" }); return; }
    const [reviews, stats] = await Promise.all([Review.find({ book: id }).populate("user", "name").sort({ createdAt: -1 }).limit(100), Review.aggregate([{ $match: { book: new mongoose.Types.ObjectId(id) } }, { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }])]);
    res.json({ success: true, reviews, averageRating: stats[0]?.average || 0, reviewCount: stats[0]?.count || 0 });
  } catch { res.status(500).json({ success: false, message: "Unable to load reviews" }); }
};

export const saveBookReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id; const rating = Number(req.body.rating); const comment = String(req.body.comment || "").trim();
    if (!id || !mongoose.Types.ObjectId.isValid(id) || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3 || comment.length > 1000) { res.status(400).json({ success: false, message: "1 முதல் 5 வரை மதிப்பீடும் குறைந்தது 3 எழுத்து விமர்சனமும் தேவை" }); return; }
    if (!await Book.exists({ _id: id, isActive: true })) { res.status(404).json({ success: false, message: "Book not found" }); return; }
    const review = await Review.findOneAndUpdate({ book: id, user: req.user?.id }, { $set: { rating, comment } }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }).populate("user", "name");
    res.json({ success: true, message: "உங்கள் மதிப்புரை சேமிக்கப்பட்டது", review });
  } catch (error) { console.error("Save review error:", error); res.status(500).json({ success: false, message: "மதிப்புரையைச் சேமிக்க முடியவில்லை" }); }
};
