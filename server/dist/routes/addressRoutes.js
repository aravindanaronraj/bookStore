"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addressController_1 = require("../controllers/addressController");
const protect_1 = require("../middleware/protect");
const router = (0, express_1.Router)();
// Every address route requires authentication
router.use(protect_1.protect);
router.post("/", addressController_1.createAddress);
router.get("/", addressController_1.getAddresses);
router.get("/:id", addressController_1.getAddressById);
router.put("/:id", addressController_1.updateAddress);
router.delete("/:id", addressController_1.deleteAddress);
router.patch("/:id/default", addressController_1.setDefaultAddress);
exports.default = router;
