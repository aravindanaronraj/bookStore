"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoryPermanently = exports.getAdminCategories = exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.createCategory = void 0;
const Category_1 = __importDefault(require("../models/Category"));
const Book_1 = __importDefault(require("../models/Book"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Create category
const createCategory = async (req, res) => {
    try {
        const { name, slug, description, image } = req.body;
        const file = req.file;
        if (!name || !slug) {
            res.status(400).json({
                success: false,
                message: "Name and slug are required",
            });
            return;
        }
        const existingCategory = await Category_1.default.findOne({
            $or: [
                { name: name.trim() },
                { slug: slug.toLowerCase().trim() },
            ],
        });
        if (existingCategory) {
            res.status(409).json({
                success: false,
                message: "Category already exists",
            });
            return;
        }
        const category = await Category_1.default.create({
            name: name.trim(),
            slug: slug.toLowerCase().trim(),
            description,
            image: file?.path || image,
            imagePublicId: file?.filename,
        });
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
        });
    }
    catch (error) {
        console.error("Create Category Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.createCategory = createCategory;
// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category_1.default.find({
            isActive: true,
        }).sort({
            name: 1,
        });
        res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });
    }
    catch (error) {
        console.error("Get Categories Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.getCategories = getCategories;
// Get single category
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category_1.default.findOne({
            _id: id,
            isActive: true,
        });
        if (!category) {
            res.status(404).json({
                success: false,
                message: "Category not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            category,
        });
    }
    catch (error) {
        console.error("Get Category Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.getCategoryById = getCategoryById;
// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, image, isActive, removeImage } = req.body;
        const file = req.file;
        const category = await Category_1.default.findById(id);
        if (!category) {
            res.status(404).json({
                success: false,
                message: "Category not found",
            });
            return;
        }
        if (name !== undefined) {
            category.name = name.trim();
        }
        if (slug !== undefined) {
            category.slug = slug.toLowerCase().trim();
        }
        if (description !== undefined) {
            category.description = description;
        }
        if (image !== undefined) {
            category.image = image;
        }
        if (removeImage === "true" || removeImage === true || file) {
            if (category.imagePublicId)
                await cloudinary_1.default.uploader.destroy(category.imagePublicId).catch(() => undefined);
            category.image = file?.path;
            category.imagePublicId = file?.filename;
        }
        if (isActive !== undefined) {
            category.isActive = isActive;
        }
        await category.save();
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    }
    catch (error) {
        console.error("Update Category Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.updateCategory = updateCategory;
// Delete category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category_1.default.findById(id);
        if (!category) {
            res.status(404).json({
                success: false,
                message: "Category not found",
            });
            return;
        }
        // Soft delete
        category.isActive = false;
        await category.save();
        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete Category Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.deleteCategory = deleteCategory;
const getAdminCategories = async (_req, res) => {
    try {
        res.json({ success: true, categories: await Category_1.default.find().sort({ name: 1 }) });
    }
    catch {
        res.status(500).json({ success: false, message: "Unable to load categories" });
    }
};
exports.getAdminCategories = getAdminCategories;
const deleteCategoryPermanently = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid category ID" });
            return;
        }
        if (await Book_1.default.exists({ category: id })) {
            res.status(409).json({ success: false, message: "இந்த வகையில் நூல்கள் உள்ளன. முதலில் அவற்றை வேறு வகைக்கு மாற்றவும்" });
            return;
        }
        const category = await Category_1.default.findByIdAndDelete(id);
        if (!category) {
            res.status(404).json({ success: false, message: "Category not found" });
            return;
        }
        if (category.imagePublicId)
            await cloudinary_1.default.uploader.destroy(category.imagePublicId).catch(() => undefined);
        res.json({ success: true, message: "Category permanently deleted" });
    }
    catch {
        res.status(500).json({ success: false, message: "Unable to delete category" });
    }
};
exports.deleteCategoryPermanently = deleteCategoryPermanently;
