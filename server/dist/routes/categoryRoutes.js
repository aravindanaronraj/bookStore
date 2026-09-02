"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const protect_1 = require("../middleware/protect");
const admin_1 = require("../middleware/admin");
const router = (0, express_1.Router)();
// Public
router.get("/", categoryController_1.getCategories);
router.get("/:id", categoryController_1.getCategoryById);
// Admin only
router.post("/", protect_1.protect, admin_1.admin, categoryController_1.createCategory);
router.put("/:id", protect_1.protect, admin_1.admin, categoryController_1.updateCategory);
router.delete("/:id", protect_1.protect, admin_1.admin, categoryController_1.deleteCategory);
exports.default = router;
