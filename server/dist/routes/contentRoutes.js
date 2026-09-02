"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contentController_1 = require("../controllers/contentController");
const router = (0, express_1.Router)();
router.get("/", contentController_1.getPublicContent);
exports.default = router;
