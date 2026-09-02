import { Router } from "express";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController";

import { protect } from "../middleware/protect";

const router = Router();

// All cart routes require login
router.use(protect);

router.get("/", getCart);

router.post("/add", addToCart);

router.put("/:bookId", updateCartItem);

router.delete("/:bookId", removeFromCart);

router.delete("/", clearCart);

export default router;