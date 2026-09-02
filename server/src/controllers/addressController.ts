import { Request, Response } from "express";
import mongoose from "mongoose";

import Address from "../models/Address";
import { AuthRequest } from "../middleware/protect";

// CREATE ADDRESS
export const createAddress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      res.status(400).json({
        success: false,
        message:
          "Full name, phone, address, city, state and postal code are required",
      });
      return;
    }

    // If this is the first address, make it default
    const addressCount = await Address.countDocuments({
      user: req.user.id,
    });

    const shouldBeDefault =
      addressCount === 0 || isDefault === true;

    // If new address is default, remove default from others
    if (shouldBeDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      user: req.user.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2?.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country?.trim() || "India",
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      address,
    });
  } catch (error) {
    console.error("Create Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// GET ALL ADDRESSES
export const getAddresses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const addresses = await Address.find({
      user: req.user.id,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// GET SINGLE ADDRESS
export const getAddressById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
      return;
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!address) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    console.error("Get Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// UPDATE ADDRESS
export const updateAddress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
      return;
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!address) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    if (fullName !== undefined) {
      address.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      address.phone = phone.trim();
    }

    if (addressLine1 !== undefined) {
      address.addressLine1 = addressLine1.trim();
    }

    if (addressLine2 !== undefined) {
      address.addressLine2 = addressLine2.trim();
    }

    if (city !== undefined) {
      address.city = city.trim();
    }

    if (state !== undefined) {
      address.state = state.trim();
    }

    if (postalCode !== undefined) {
      address.postalCode = postalCode.trim();
    }

    if (country !== undefined) {
      address.country = country.trim();
    }

    // Make this address default
    if (isDefault === true) {
      await Address.updateMany(
        {
          user: req.user.id,
          _id: { $ne: id },
        },
        {
          $set: { isDefault: false },
        }
      );

      address.isDefault = true;
    }

    if (isDefault === false) {
      address.isDefault = false;
    }

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Update Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// DELETE ADDRESS
export const deleteAddress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
      return;
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!address) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    const wasDefault = address.isDefault;

    await address.deleteOne();

    // If deleted address was default,
    // make another address default
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        user: req.user.id,
      }).sort({
        createdAt: -1,
      });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// SET DEFAULT ADDRESS
export const setDefaultAddress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
      return;
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!address) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    await Address.updateMany(
      {
        user: req.user.id,
      },
      {
        $set: { isDefault: false },
      }
    );

    address.isDefault = true;

    await address.save();

    res.status(200).json({
      success: true,
      message: "Default address updated",
      address,
    });
  } catch (error) {
    console.error("Set Default Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};