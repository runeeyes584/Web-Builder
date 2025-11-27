import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadImage,
  uploadVideo,
  uploadImageFromUrl,
  uploadVideoFromUrl,
  deleteResource,
} from '../controllers/Cloudinary.controller';

const router = express.Router();

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const videoUploadDir = path.join(uploadDir, 'videos');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

// Configure multer for memory storage (for images - smaller files)
const memoryStorage = multer.memoryStorage();
const imageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

// Configure multer for disk storage (for videos - larger files)
// Disk storage is more memory efficient for large video files
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const videoUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only videos are allowed.'));
    }
  },
});

// Upload routes with appropriate storage configurations
router.post('/upload/image', imageUpload.single('file'), uploadImage);
router.post('/upload/video', videoUpload.single('file'), uploadVideo);
router.post('/upload/image/url', uploadImageFromUrl);
router.post('/upload/video/url', uploadVideoFromUrl);

// Delete route
router.delete('/delete', deleteResource);

export default router;
