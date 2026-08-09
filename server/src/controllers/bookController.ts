import { Request, Response } from "express";
import mongoose from "mongoose";
import Book from "../models/Book";

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
      publisher,
      isbn,
      description: description.trim(),
      category,
      images: images || [],
      bookType: bookType || "physical",
      price,
      salePrice,
      stock: stock || 0,
      language: language.trim(),
      pages,
      isFeatured: isFeatured || false,
    });

    const populatedBook = await book.populate("category");

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      book: populatedBook,
    });
  } catch (error) {
    console.error("Create Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      books,
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
    } = req.body;

    if (title !== undefined) book.title = title.trim();

    if (slug !== undefined) {
      book.slug = slug.toLowerCase().trim();
    }

    if (author !== undefined) book.author = author.trim();

    if (publisher !== undefined) book.publisher = publisher;

    if (isbn !== undefined) book.isbn = isbn;

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
      book.salePrice = salePrice;
    }

    if (stock !== undefined) book.stock = stock;

    if (language !== undefined) {
      book.language = language.trim();
    }

    if (pages !== undefined) book.pages = pages;

    if (isActive !== undefined) book.isActive = isActive;

    if (isFeatured !== undefined) {
      book.isFeatured = isFeatured;
    }

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