import { Router } from "express";

import {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController";

import { protect } from "../middleware/protect";

const router = Router();

// Every address route requires authentication
router.use(protect);

router.post("/", createAddress);

router.get("/", getAddresses);

router.get("/:id", getAddressById);

router.put("/:id", updateAddress);

router.delete("/:id", deleteAddress);

router.patch("/:id/default", setDefaultAddress);

export default router;