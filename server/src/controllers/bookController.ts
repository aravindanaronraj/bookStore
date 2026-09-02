import { Request, Response } from "express";
import mongoose from "mongoose";
import Book from "../models/Book";
import cloudinary from "../config/cloudinary";
import Cart from "../models/Cart";
import Review from "../models/Review";

const asBoolean = (value: unknown, fallback = false) => value === undefined ? fallback : value === true || value === "true";

// CREATE BOOK
export const createBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      slug,
      author,
      publisher,
      isbn,
      description,
      category,
      images,
      bookType,
      price,
      salePrice,
      stock,
      language,
      pages,
      isFeatured,
      isNewLaunch,
      isActive,
    } = req.body;

    if (
      !title ||
      !slug ||
      !author ||
      !description ||
      !category ||
      price === undefined ||
      !language
    ) {
      res.status(400).json({
        success: false,
        message:
          "Title, slug, author, description, category, price and language are required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    const regularPrice = Number(price);
    const discountedPrice = salePrice === "" || salePrice === undefined ? undefined : Number(salePrice);
    if (!Number.isFinite(regularPrice) || regularPrice < 0 || (discountedPrice !== undefined && (!Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice >= regularPrice))) {
      res.status(400).json({ success: false, message: "Enter a valid price; sale price must be lower than the regular price" });
      return;
    }

    const existingBook = await Book.findOne({
      slug: slug.toLowerCase().trim(),
    });

    if (existingBook) {
      res.status(409).json({
        success: false,
        message: "Book with this slug already exists",
      });
      return;
    }

    const book = await Book.create({
      title: title.trim(),
      slug: slug.toLowerCase().trim(),
      author: author.trim(),
      publisher: typeof publisher === "string" && publisher.trim() ? publisher.trim() : undefined,
      isbn: typeof isbn === "string" && isbn.trim() ? isbn.trim().toUpperCase() : undefined,
      description: description.trim(),
      category,
      images: images || [],
      bookType: bookType || "physical",
      price: Number(price),
      salePrice: salePrice === "" || salePrice === undefined ? undefined : Number(salePrice),
      stock: stock || 0,
      language: language.trim(),
      pages,
      isFeatured: asBoolean(isFeatured),
      isNewLaunch: asBoolean(isNewLaunch),
      isActive: asBoolean(isActive, true),
    });

    // If files were uploaded via multer (CloudinaryStorage), map them to images
    const files = req.files as Express.Multer.File[] | undefined;

    if (files && files.length > 0) {
      const uploadedImages = files.map((file) => ({
        url: (file as any).path,
        publicId: (file as any).filename,
      }));

      book.images = uploadedImages;
      await book.save();
    }

    const populatedBook = await book.populate("category");

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      book: populatedBook,
    });
  } catch (error: any) {
    console.error("Create Book Error:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    const message = error?.message || "Create book failed";

    res.status(500).json({
      success: false,
      message,
    });
    return;
  }
};


// GET ALL BOOKS
export const getBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      category,
      language,
      bookType,
      featured,
      newLaunch,
      minPrice,
      maxPrice,
      page = "1",
      limit = "12",
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      50
    );

    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {
      isActive: true,
    };

    // Search
    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          author: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Category
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category as string)) {
        res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
        return;
      }

      filter.category = category;
    }

    // Language
    if (language) {
      filter.language = language;
    }

    // Book type
    if (bookType) {
      filter.bookType = bookType;
    }

    // Featured
    if (featured === "true") {
      filter.isFeatured = true;
    }
    if (newLaunch === "true") filter.isNewLaunch = true;

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      Book.countDocuments(filter),
    ]);

    const reviewStats = await Review.aggregate([
      { $match: { book: { $in: books.map((book) => book._id) } } },
      { $group: { _id: "$book", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]);
    const reviewMap = new Map(reviewStats.map((item) => [String(item._id), item]));
    const booksWithRatings = books.map((book) => {
      const stats = reviewMap.get(String(book._id));
      return { ...book.toObject(), averageRating: stats?.averageRating || 0, reviewCount: stats?.reviewCount || 0 };
    });

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      books: booksWithRatings,
    });
  } catch (error) {
    console.error("Get Books Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// GET SINGLE BOOK
export const getBookById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    const book = await Book.findOne({
      _id: id,
      isActive: true,
    }).populate("category");

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error("Get Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};  



// UPDATE BOOK
export const updateBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }


    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    const files = req.files as Express.Multer.File[];

if (files && files.length > 0) {
  const uploadedImages = files.map((file) => ({
  url: file.path,
  publicId: file.filename,
}));

book.images = uploadedImages;
} 


    const {
      title,
      slug,
      author,
      publisher,
      isbn,
      description,
      category,
      images,
      bookType,
      price,
      salePrice,
      stock,
      language,
      pages,
      isActive,
      isFeatured,
      isNewLaunch,
    } = req.body;

    if (title !== undefined) book.title = title.trim();

    if (slug !== undefined) {
      book.slug = slug.toLowerCase().trim();
    }

    if (author !== undefined) book.author = author.trim();

    if (publisher !== undefined) book.publisher = typeof publisher === "string" && publisher.trim() ? publisher.trim() : undefined;

    if (isbn !== undefined) book.isbn = typeof isbn === "string" && isbn.trim() ? isbn.trim().toUpperCase() : undefined;

    if (description !== undefined) {
      book.description = description.trim();
    }

    if (category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
        return;
      }

      book.category = category;
    }

    if (images !== undefined) book.images = images;

    if (bookType !== undefined) book.bookType = bookType;

    if (price !== undefined) book.price = price;

    if (salePrice !== undefined) {
      if (salePrice === "" || salePrice === null) book.salePrice = undefined;
      else {
        const parsedSalePrice = Number(salePrice);
        const regularPrice = Number(price !== undefined ? price : book.price);
        if (!Number.isFinite(parsedSalePrice) || parsedSalePrice <= 0 || parsedSalePrice >= regularPrice) { res.status(400).json({ success: false, message: "Discount price must be greater than zero and lower than regular price" }); return; }
        book.salePrice = parsedSalePrice;
      }
    }

    if (salePrice !== undefined && salePrice !== "" && (Number(salePrice) <= 0 || Number(salePrice) >= Number(price))) {
      res.status(400).json({ success: false, message: "Discount price must be greater than zero and lower than regular price" });
      return;
    }

    if (stock !== undefined) book.stock = stock;

    if (language !== undefined) {
      book.language = language.trim();
    }

    if (pages !== undefined) book.pages = pages;

    if (isActive !== undefined) book.isActive = asBoolean(isActive);

    if (isFeatured !== undefined) {
      book.isFeatured = asBoolean(isFeatured);
    }
    if (isNewLaunch !== undefined) book.isNewLaunch = asBoolean(isNewLaunch);

    await book.save();

    const populatedBook = await book.populate("category");

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      book: populatedBook,
    });
  } catch (error) {
    console.error("Update Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// DELETE BOOK
export const deleteBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const bookId = Array.isArray(id) ? id[0] : id;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    const book = await Book.findById(bookId);

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    // Soft delete
    book.isActive = false;

    await book.save();

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const manageBookRemoval = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const action = req.body?.action;
    if (!id || !mongoose.Types.ObjectId.isValid(id) || !["hide", "delete"].includes(action)) { res.status(400).json({ success: false, message: "Invalid removal request" }); return; }
    const book = await Book.findById(id);
    if (!book) { res.status(404).json({ success: false, message: "Book not found" }); return; }
    if (action === "hide") {
      book.isActive = false; await book.save();
      res.json({ success: true, message: "Book hidden from store" }); return;
    }
    const imageIds = book.images.map((image) => image.publicId).filter(Boolean);
    if (imageIds.length) await cloudinary.api.delete_resources(imageIds).catch((error) => console.error("Book image cleanup failed:", error));
    await Cart.updateMany({ "cartItems.book": book._id }, { $pull: { cartItems: { book: book._id } } });
    await Review.deleteMany({ book: book._id });
    await book.deleteOne();
    res.json({ success: true, message: "Book permanently deleted" });
  } catch (error) { console.error("Book removal error:", error); res.status(500).json({ success: false, message: "Unable to remove book" }); }
};
