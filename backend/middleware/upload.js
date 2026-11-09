import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_REQUEST,
} from "../utils/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploaded documents are stored outside the public web root and are only
// served through GET /api/documents/:id, which checks permissions first.
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads"));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXTENSIONS = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // Random file name — never trust or reuse the name the client sent
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${EXTENSIONS[file.mimetype] || ""}`),
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_REQUEST, fields: 30 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const error = new Error(`${file.originalname}: only PDF, JPG or PNG files are allowed.`);
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
}).any();

// The browser-supplied MIME type can be faked, so also check the first
// bytes of each file ("magic numbers") match the claimed type.
function hasValidSignature(filePath, mimeType) {
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  if (mimeType === "application/pdf") return buffer.subarray(0, 4).toString() === "%PDF";
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  return false;
}

export function removeUploadedFiles(files = []) {
  for (const file of files) {
    fs.unlink(file.path, () => {});
  }
}

// Accepts multipart/form-data with any number of file fields and validates
// every file. On failure all files from the request are deleted.
export function uploadDocuments(req, res, next) {
  multerUpload(req, res, (error) => {
    if (error) {
      removeUploadedFiles(req.files);
      if (error instanceof multer.MulterError) {
        const messages = {
          LIMIT_FILE_SIZE: "Each file must be 5MB or smaller.",
          LIMIT_FILE_COUNT: `You can upload at most ${MAX_FILES_PER_REQUEST} files at a time.`,
        };
        return res.status(400).json({ message: messages[error.code] || error.message });
      }
      return res.status(error.status || 500).json({ message: error.message });
    }

    const invalid = (req.files || []).find((file) => !hasValidSignature(file.path, file.mimetype));
    if (invalid) {
      removeUploadedFiles(req.files);
      return res.status(400).json({
        message: `${invalid.originalname}: the file content does not match its type.`,
      });
    }

    next();
  });
}
