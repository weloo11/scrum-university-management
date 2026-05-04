import fs from "fs";
import path from "path";
import multer from "multer";

const uploadRoot = path.resolve("uploads");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === "documents" ? "admissions" : "issues";
    const destination = path.join(uploadRoot, folder);
    fs.mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }
});
