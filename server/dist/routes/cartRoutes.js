"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const protect_1 = require("../middleware/protect");
const router = (0, express_1.Router)();
// All cart routes require login
router.use(protect_1.protect);
router.get("/", cartController_1.getCart);
router.post("/add", cartController_1.addToCart);
router.put("/:bookId", cartController_1.updateCartItem);
router.delete("/:bookId", cartController_1.removeFromCart);
router.delete("/", cartController_1.clearCart);
exports.default = router;
