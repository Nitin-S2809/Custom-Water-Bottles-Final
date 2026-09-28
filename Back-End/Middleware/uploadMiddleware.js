const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG, WEBP and SVG files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const privateDocumentDirectory = path.resolve(__dirname, "../private-uploads/supplier-documents");
const supplierDocumentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdir(privateDocumentDirectory, { recursive: true }, (error) => cb(error, privateDocumentDirectory));
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${require("crypto").randomBytes(16).toString("hex")}${extension}`);
  },
});

const supplierDocumentUploadHandler = multer({
  storage: supplierDocumentStorage,
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedTypes = new Map([
      [".pdf", "application/pdf"],
      [".jpg", "image/jpeg"],
      [".jpeg", "image/jpeg"],
      [".png", "image/png"],
    ]);

    if (allowedTypes.get(extension) === file.mimetype) {
      return cb(null, true);
    }

    const error = new Error("Documents must be PDF, JPG, JPEG, or PNG files");
    error.code = "INVALID_DOCUMENT_TYPE";
    return cb(error);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
}).fields([
  { name: "fssaiCertificate", maxCount: 1 },
  { name: "gstCertificate", maxCount: 1 },
]);

const supplierDocumentUpload = (req, res, next) => {
  supplierDocumentUploadHandler(req, res, (error) => {
    if (!error) return next();

    const uploadedFiles = Object.values(req.files || {}).flat();
    uploadedFiles.forEach((file) => fs.unlink(file.path, () => {}));
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : error.code === "INVALID_DOCUMENT_TYPE" || error instanceof multer.MulterError ? 400 : 500;
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Each document must be 5 MB or smaller"
      : error.code === "INVALID_DOCUMENT_TYPE"
        ? error.message
        : error instanceof multer.MulterError
        ? "Invalid document upload"
        : "Unable to process document upload";
    return res.status(status).json({ success: false, message });
  });
};

module.exports = upload;
module.exports.supplierDocumentUpload = supplierDocumentUpload;