import { Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Book from "../models/Book";
import { AuthRequest } from "../middleware/protect";

// GET CART
export const getCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    let cart = await Cart.findOne({
      user: req.user.id,
    }).populate(
      "cartItems.book",
      "title author images price salePrice stock bookType"
    );

    // Create empty cart if user doesn't have one
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        cartItems: [],
      });
    }

    // Remove references to books that were permanently deleted after being
    // added to the cart. Populating such references produces a null book.
    const validItems = cart.cartItems.filter((item) => Boolean(item.book));
    if (validItems.length !== cart.cartItems.length) {
      cart.cartItems.splice(0, cart.cartItems.length, ...validItems);
      await cart.save();
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ADD TO CART
export const addToCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { bookId, quantity = 1 } = req.body;

    if (!bookId) {
      res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
      return;
    }

    // Find book
    const book = await Book.findOne({
      _id: bookId,
      isActive: true,
    });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    // Check physical stock
    if (
      book.bookType !== "ebook" &&
      book.stock < requestedQuantity
    ) {
      res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
      return;
    }

    // Find or create cart
    let cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        cartItems: [],
      });
    }

    // Check whether book already exists
    const existingItem = cart.cartItems.find(
      (item) => item.book.toString() === bookId
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + requestedQuantity;

      if (
        book.bookType !== "ebook" &&
        newQuantity > book.stock
      ) {
        res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
        return;
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.cartItems.push({
        book: new mongoose.Types.ObjectId(bookId),
        quantity: requestedQuantity,
      });
    }

    await cart.save();

    await cart.populate(
      "cartItems.book",
      "title author images price salePrice stock bookType"
    );

    res.status(200).json({
      success: true,
      message: "Book added to cart",
      cart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// UPDATE CART QUANTITY
export const updateCartItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { bookId } = req.params;
    const { quantity } = req.body;

    if (typeof bookId !== 'string' || !mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    const newQuantity = Number(quantity);

    if (!Number.isInteger(newQuantity) || newQuantity < 1) {
      res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
      return;
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const item = cart.cartItems.find(
      (item) => item.book.toString() === bookId
    );

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Book is not in cart",
      });
      return;
    }

    const book = await Book.findById(bookId);

    if (!book || book.isActive === false) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    if (
      book.bookType !== "ebook" &&
      newQuantity > book.stock
    ) {
      res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
      return;
    }

    item.quantity = newQuantity;

    await cart.save();

    await cart.populate(
      "cartItems.book",
      "title author images price salePrice stock bookType"
    );

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    console.error("Update Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// REMOVE ITEM FROM CART
export const removeFromCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { bookId } = req.params;

    if (typeof bookId !== 'string' || !mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const originalLength = cart.cartItems.length;

    cart.cartItems = cart.cartItems.filter(
      (item) => item.book.toString() !== bookId
    );

    if (cart.cartItems.length === originalLength) {
      res.status(404).json({
        success: false,
        message: "Book is not in cart",
      });
      return;
    }

    await cart.save();

    await cart.populate(
      "cartItems.book",
      "title author images price salePrice stock bookType"
    );

    res.status(200).json({
      success: true,
      message: "Book removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// CLEAR CART
export const clearCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    cart.cartItems = [];

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
