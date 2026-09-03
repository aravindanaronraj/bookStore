import cloudinary from "../config/cloudinary";

export interface CloudinaryImage {
  url: string;
  publicId: string;
}

const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<CloudinaryImage> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({ url: result.secure_url, publicId: result.public_id });
        } else {
          reject(new Error("Cloudinary upload failed"));
        }
      }
    );

    stream.end(buffer);
  });
};

export default uploadToCloudinary;
