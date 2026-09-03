import multer from "multer";
import type { RequestHandler } from "express";
import cloudinary from "../config/cloudinary";
import uploadToCloudinary from "../utils/uploadToCloudinary";

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = /^image\/(jpeg|jpg|png|webp)$/i;

  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
  }
};

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

const uploadFiles = (field: string, maxCount?: number): RequestHandler => {
  const parse = maxCount === 1
    ? memoryUpload.single(field)
    : memoryUpload.array(field, maxCount);

  return (req, res, next) => {
    parse(req, res, async (parseError) => {
      if (parseError) return next(parseError);

      const files = maxCount === 1
        ? (req.file ? [req.file] : [])
        : ((req.files as Express.Multer.File[] | undefined) || []);

      if (!files.length) return next();

      const uploadedPublicIds: string[] = [];
      try {
        for (const file of files) {
          const uploaded = await uploadToCloudinary(file.buffer, "bookstore/books");
          uploadedPublicIds.push(uploaded.publicId);
          // Preserve the Multer file fields already consumed by the controllers.
          file.path = uploaded.url;
          file.filename = uploaded.publicId;
        }
        next();
      } catch (error) {
        if (uploadedPublicIds.length) {
          await cloudinary.api.delete_resources(uploadedPublicIds).catch(() => undefined);
        }
        next(error);
      }
    });
  };
};

const upload = {
  array: (field: string, maxCount = 10) => uploadFiles(field, maxCount),
  single: (field: string) => uploadFiles(field, 1),
};

export default upload;
