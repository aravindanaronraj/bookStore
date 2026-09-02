import { Router } from "express";

import upload from "../middleware/upload";
import {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} from "../controllers/bookController";

import { protect } from "../middleware/protect";
import { admin } from "../middleware/admin";
import { getBookReviews, saveBookReview } from "../controllers/reviewController";

const router = Router();

// Public routes
router.get("/", getBooks);
router.get("/:id/reviews", getBookReviews);
router.post("/:id/reviews", protect, saveBookReview);
router.get("/:id", getBookById);

// Admin routes


router.post(
  "/",
  protect,
  admin,
  upload.array("images"),
  createBook
);

router.put("/:id", protect, admin, upload.array("images", 10), updateBook);

router.delete("/:id", protect, admin, deleteBook);

export default router;
