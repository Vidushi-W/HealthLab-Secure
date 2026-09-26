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

// V1 fix: do not keep the uploader's file extension.
// The old code used the original filename, so a web page could be saved as .html.
// The browser then opened that file as a page on this site and ran the script inside it.
// The extension now comes only from an allowed type (image or PDF).
const EXTENSION_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

function storedFilename(file) {
  const ext = EXTENSION_BY_MIME[file.mimetype] || ".bin";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

// The type label sent with the upload can be faked (for example, a web page labeled as a PNG).
// Read the file's own header bytes and accept it only when those bytes match a real image or PDF.
function matchesDeclaredType(buffer, mimetype) {
  if (buffer.length < 12) return false;
  if (mimetype === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimetype === "image/gif") {
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  }
  if (mimetype === "image/webp") {
    return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  if (mimetype === "application/pdf") {
    return buffer.toString("ascii", 0, 4) === "%PDF";
  }
  return false;
}

function assertFileContent(file) {
  if (!file) return;
  const handle = fs.openSync(file.path, "r");
  const buffer = Buffer.alloc(16);
  try {
    fs.readSync(handle, buffer, 0, 16, 0);
  } finally {
    fs.closeSync(handle);
  }
  if (!matchesDeclaredType(buffer, file.mimetype)) {
    // Delete the saved file so a rejected web page is not left in the uploads folder.
    fs.unlinkSync(file.path);
    const error = new Error("File content does not match an allowed image or PDF.");
    error.statusCode = 400;
    throw error;
  }
}

function withContentCheck(upload) {
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return next(err);
      try {
        assertFileContent(req.file);
        next();
      } catch (checkError) {
        next(checkError);
      }
    });
  };
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, storedFilename(file)),
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP) or PDF."), false);
  }
};

const uploadAffiliationProof = withContentCheck(multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single("affiliationProof"));

// Post images: optional single image, images only
const POST_IMAGE_DIR = path.join(process.cwd(), "uploads", "post-images");
const POST_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const POST_IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

try {
  fs.mkdirSync(POST_IMAGE_DIR, { recursive: true });
} catch (e) {}

const postImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, POST_IMAGE_DIR),
  filename: (req, file, cb) => cb(null, storedFilename(file)),
});

const postImageFilter = (req, file, cb) => {
  if (POST_IMAGE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid image type. Allowed: JPEG, PNG, GIF, WebP."), false);
  }
};

const uploadPostImage = withContentCheck(multer({
  storage: postImageStorage,
  fileFilter: postImageFilter,
  limits: { fileSize: POST_IMAGE_MAX_SIZE },
}).single("image"));

module.exports = { uploadAffiliationProof, uploadPostImage, UPLOAD_DIR };
