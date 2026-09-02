import mongoose, { Schema } from "mongoose";
const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  status: { type: String, enum: ["new", "read", "resolved"], default: "new" },
}, { timestamps: true });
export default mongoose.model("ContactMessage", contactMessageSchema);
