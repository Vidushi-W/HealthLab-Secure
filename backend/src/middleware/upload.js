const path = require("path");
const multer = require("multer");
const fs = require("fs");

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "affiliation-proofs");
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  // dir may already exist
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP) or PDF."), false);
  }
};

const uploadAffiliationProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single("affiliationProof");

module.exports = { uploadAffiliationProof, UPLOAD_DIR };
