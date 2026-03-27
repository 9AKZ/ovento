import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from './error.middleware.js';

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024; // 5MB

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        'INVALID_FILE_TYPE',
      ),
      false,
    );
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Max 5 files per request
  },
});

/**
 * Single file upload middleware
 * @param {string} fieldName - Form field name
 */
export function uploadSingle(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.badRequest(
              `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
              'FILE_TOO_LARGE',
            ),
          );
        }
        return next(ApiError.badRequest(err.message, 'UPLOAD_ERROR'));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
}

/**
 * Multiple files upload middleware
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 */
export function uploadMultiple(fieldName, maxCount = 5) {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.badRequest(
              `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
              'FILE_TOO_LARGE',
            ),
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            ApiError.badRequest(
              `Too many files. Maximum is ${maxCount} files`,
              'TOO_MANY_FILES',
            ),
          );
        }
        return next(ApiError.badRequest(err.message, 'UPLOAD_ERROR'));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
}

/**
 * Get file URL from uploaded file
 * @param {Object} file - Multer file object
 */
export function getFileUrl(file) {
  if (!file) return null;
  return `/uploads/${file.filename}`;
}

export default {
  uploadSingle,
  uploadMultiple,
  getFileUrl,
};

