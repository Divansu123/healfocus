const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ─── Ensure uploads directory exists ─────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── Storage config ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // healfocus_<timestamp>_<randomhex>.<ext>
    const ext    = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + '_' + Math.random().toString(16).slice(2, 8);
    cb(null, `healfocus_${unique}${ext}`);
  },
});

// ─── File filter — only jpg/jpeg/png/pdf ─────────────────────────────────────
const allowedMimes  = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed.'), false);
  }
};

// ─── Image-only filter (for skin scan) ───────────────────────────────────────
const imageOnlyFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const imgMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  const imgExts  = ['.jpg', '.jpeg', '.png'];
  if (imgMimes.includes(file.mimetype) && imgExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, and PNG images are allowed.'), false);
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

/** Medical record attachments — max 5 files, 10 MB each, jpg/jpeg/png/pdf */
const uploadRecordAttachments = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).array('attachments', 5);

/** Skin scan — single image, max 8 MB, jpg/jpeg/png only */
const uploadSkinScan = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
}).single('skinImage');

/** Insurance / Claim attachments — max 5 files, 10 MB each, jpg/jpeg/png/pdf */
const uploadInsuranceAttachments = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).array('attachments', 5);

module.exports = { uploadRecordAttachments, uploadSkinScan, uploadInsuranceAttachments, UPLOAD_DIR };
