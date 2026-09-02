"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Book_1 = __importDefault(require("../models/Book"));
// GET CART
const getCart = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
            return;
        }
        let cart = await Cart_1.default.findOne({
            user: req.user.id,
        }).populate("cartItems.book", "title author images price salePrice stock bookType");
        // Create empty cart if user doesn't have one
        if (!cart) {
            cart = await Cart_1.default.create({
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
    }
    catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.getCart = getCart;
// ADD TO CART
const addToCart = async (req, res) => {
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
        if (!mongoose_1.default.Types.ObjectId.isValid(bookId)) {
            res.status(400).json({
                success: false,
                message: "Invalid book ID",
            });
            return;
        }
        const requestedQuantity = Number(quantity);
        if (!Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1) {
            res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer",
            });
            return;
        }
        // Find book
        const book = await Book_1.default.findOne({
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
        if (book.bookType !== "ebook" &&
            book.stock < requestedQuantity) {
            res.status(400).json({
                success: false,
                message: "Not enough stock available",
            });
            return;
        }
        // Find or create cart
        let cart = await Cart_1.default.findOne({
            user: req.user.id,
        });
        if (!cart) {
            cart = new Cart_1.default({
                user: req.user.id,
                cartItems: [],
            });
        }
        // Check whether book already exists
        const existingItem = cart.cartItems.find((item) => item.book.toString() === bookId);
        if (existingItem) {
            const newQuantity = existingItem.quantity + requestedQuantity;
            if (book.bookType !== "ebook" &&
                newQuantity > book.stock) {
                res.status(400).json({
                    success: false,
                    message: "Requested quantity exceeds available stock",
                });
                return;
            }
            existingItem.quantity = newQuantity;
        }
        else {
            cart.cartItems.push({
                book: new mongoose_1.default.Types.ObjectId(bookId),
                quantity: requestedQuantity,
            });
        }
        await cart.save();
        await cart.populate("cartItems.book", "title author images price salePrice stock bookType");
        res.status(200).json({
            success: true,
            message: "Book added to cart",
            cart,
        });
    }
    catch (error) {
        console.error("Add To Cart Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.addToCart = addToCart;
// UPDATE CART QUANTITY
const updateCartItem = async (req, res) => {
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
        if (typeof bookId !== 'string' || !mongoose_1.default.Types.ObjectId.isValid(bookId)) {
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
        const cart = await Cart_1.default.findOne({
            user: req.user.id,
        });
        if (!cart) {
            res.status(404).json({
                success: false,
                message: "Cart not found",
            });
            return;
        }
        const item = cart.cartItems.find((item) => item.book.toString() === bookId);
        if (!item) {
            res.status(404).json({
                success: false,
                message: "Book is not in cart",
            });
            return;
        }
        const book = await Book_1.default.findById(bookId);
        if (!book || book.isActive === false) {
            res.status(404).json({
                success: false,
                message: "Book not found",
            });
            return;
        }
        if (book.bookType !== "ebook" &&
            newQuantity > book.stock) {
            res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock",
            });
            return;
        }
        item.quantity = newQuantity;
        await cart.save();
        await cart.populate("cartItems.book", "title author images price salePrice stock bookType");
        res.status(200).json({
            success: true,
            message: "Cart updated",
            cart,
        });
    }
    catch (error) {
        console.error("Update Cart Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.updateCartItem = updateCartItem;
// REMOVE ITEM FROM CART
const removeFromCart = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
            return;
        }
        const { bookId } = req.params;
        if (typeof bookId !== 'string' || !mongoose_1.default.Types.ObjectId.isValid(bookId)) {
            res.status(400).json({
                success: false,
                message: "Invalid book ID",
            });
            return;
        }
        const cart = await Cart_1.default.findOne({
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
        cart.cartItems = cart.cartItems.filter((item) => item.book.toString() !== bookId);
        if (cart.cartItems.length === originalLength) {
            res.status(404).json({
                success: false,
                message: "Book is not in cart",
            });
            return;
        }
        await cart.save();
        await cart.populate("cartItems.book", "title author images price salePrice stock bookType");
        res.status(200).json({
            success: true,
            message: "Book removed from cart",
            cart,
        });
    }
    catch (error) {
        console.error("Remove Cart Item Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.removeFromCart = removeFromCart;
// CLEAR CART
const clearCart = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
            return;
        }
        const cart = await Cart_1.default.findOne({
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
    }
    catch (error) {
        console.error("Clear Cart Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.clearCart = clearCart;
