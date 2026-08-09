import mongoose, { Document, Schema } from "mongoose";

export interface IBook extends Document {
  title: string;
  slug: string;

  author: string;
  publisher?: string;
  isbn?: string;

  description: string;

  category: mongoose.Types.ObjectId;

  images: string[];

  bookType: "physical" | "ebook" | "both";

  price: number;
  salePrice?: number;

  stock: number;

  language: string;
  pages?: number;

  isActive: boolean;
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    publisher: {
      type: String,
      trim: true,
    },

    isbn: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    bookType: {
      type: String,
      enum: ["physical", "ebook", "both"],
      default: "physical",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    salePrice: {
      type: Number,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    pages: {
      type: Number,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model<IBook>("Book", bookSchema);

export default Book;