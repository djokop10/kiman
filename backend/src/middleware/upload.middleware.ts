import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const pendaftaranId = req.params.id || "temp";
    // Target folder: storage/bukti-transfer/pendaftaran-<id>
    const destDir = path.join(config.storageDir, "bukti-transfer", pendaftaranId);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `bukti-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung! Unggah gambar JPG, PNG, WEBP, atau file PDF."));
  }
};

export const uploadBuktiTransfer = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Maksimal 5MB
  }
});
