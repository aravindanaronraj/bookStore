import { Request, Response } from "express";
import Category from "../models/Category";
import Book from "../models/Book";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary";

// Create category
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, slug, description, image } = req.body;
    const file = req.file as Express.Multer.File | undefined;

    if (!name || !slug) {
      res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
      return;
    }

    const existingCategory = await Category.findOne({
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

    const category = await Category.create({
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
  } catch (error) {
    console.error("Create Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all categories
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({
      name: 1,
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get single category
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
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
  } catch (error) {
    console.error("Get Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update category
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, isActive, removeImage } = req.body;
    const file = req.file as Express.Multer.File | undefined;

    const category = await Category.findById(id);

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
      if (category.imagePublicId) await cloudinary.uploader.destroy(category.imagePublicId).catch(() => undefined);
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
  } catch (error) {
    console.error("Update Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete category
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

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
  } catch (error) {
    console.error("Delete Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAdminCategories = async (_req: Request, res: Response): Promise<void> => {
  try { res.json({ success: true, categories: await Category.find().sort({ name: 1 }) }); }
  catch { res.status(500).json({ success: false, message: "Unable to load categories" }); }
};

export const deleteCategoryPermanently = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ success: false, message: "Invalid category ID" }); return; }
    if (await Book.exists({ category: id })) { res.status(409).json({ success: false, message: "இந்த வகையில் நூல்கள் உள்ளன. முதலில் அவற்றை வேறு வகைக்கு மாற்றவும்" }); return; }
    const category = await Category.findByIdAndDelete(id); if (!category) { res.status(404).json({ success: false, message: "Category not found" }); return; }
    if (category.imagePublicId) await cloudinary.uploader.destroy(category.imagePublicId).catch(() => undefined);
    res.json({ success: true, message: "Category permanently deleted" });
  } catch { res.status(500).json({ success: false, message: "Unable to delete category" }); }
};
