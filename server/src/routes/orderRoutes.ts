import { Router } from "express";

import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getMyOrderById,
} from "../controllers/orderController";
import { protect } from "../middleware/protect";


const router = Router();

router.use(protect);

router.post("/create", createOrder);
router.post("/verify-payment", verifyPayment);

router.get("/my-orders", getMyOrders);

router.get("/:id", getMyOrderById);

export default router;
