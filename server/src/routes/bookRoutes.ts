import { Router } from "express";

import {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} from "../controllers/bookController";

import { protect } from "../middleware/protect";
import { admin } from "../middleware/admin";

const router = Router();

// Public routes
router.get("/", getBooks);
router.get("/:id", getBookById);

// Admin routes
router.post("/", protect, admin, createBook);
router.put("/:id", protect, admin, updateBook);
router.delete("/:id", protect, admin, deleteBook);

export default router;