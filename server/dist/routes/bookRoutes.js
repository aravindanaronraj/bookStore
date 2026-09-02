"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = __importDefault(require("../middleware/upload"));
const bookController_1 = require("../controllers/bookController");
const protect_1 = require("../middleware/protect");
const admin_1 = require("../middleware/admin");
const reviewController_1 = require("../controllers/reviewController");
const router = (0, express_1.Router)();
// Public routes
router.get("/", bookController_1.getBooks);
router.get("/:id/reviews", reviewController_1.getBookReviews);
router.post("/:id/reviews", protect_1.protect, reviewController_1.saveBookReview);
router.get("/:id", bookController_1.getBookById);
// Admin routes
router.post("/", protect_1.protect, admin_1.admin, upload_1.default.array("images"), bookController_1.createBook);
router.put("/:id", protect_1.protect, admin_1.admin, upload_1.default.array("images", 10), bookController_1.updateBook);
router.delete("/:id", protect_1.protect, admin_1.admin, bookController_1.deleteBook);
exports.default = router;
