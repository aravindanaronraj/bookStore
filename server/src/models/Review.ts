import mongoose, { Schema } from "mongoose";
const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  book: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 1000 },
}, { timestamps: true });
reviewSchema.index({ user: 1, book: 1 }, { unique: true });
export default mongoose.model("Review", reviewSchema);
