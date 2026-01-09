// routes/exercize_video_routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const ExerciseVideoController = require('../controllers/exercize_video_controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// ========================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ========================================

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      // Video file validation
      const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid video format. Only MP4, WebM, OGG, and MOV are allowed.'));
      }
    } else if (file.fieldname === 'thumbnail') {
      // Thumbnail file validation
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid thumbnail format. Only JPEG, PNG, and WebP are allowed.'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

// ========================================
// FILE UPLOAD ROUTES
// ========================================

// POST - Upload exercise video file
// Endpoint: POST /api/exercise-videos/upload
// Form fields: 
//   - video (file, required)
//   - thumbnail (file, optional)
//   - exerciseName (string, required)
//   - duration (number, optional)
//   - description (string, optional)
router.post(
  '/upload',
  verifyToken,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  ExerciseVideoController.uploadVideo
);

// GET - Stream video file
// Endpoint: GET /api/exercise-videos/stream/:fileId
// Supports range requests for video seeking
router.get(
  '/stream/:fileId',
  ExerciseVideoController.streamVideo
);

// ========================================
// MAIN ROUTES (URL-based)
// ========================================

// POST - Add or update exercise video using URL
// Endpoint: POST /api/exercise-videos
// Body: { exerciseName, videoUrl, thumbnailUrl, duration, description }
router.post(
  '/',
  verifyToken,
  ExerciseVideoController.addOrUpdateVideo
);

// GET - Get video by exercise name
// Endpoint: GET /api/exercise-videos/by-name/:exerciseName
router.get(
  '/by-name/:exerciseName',
  verifyToken,
  ExerciseVideoController.getVideoByName
);

// GET - Get exercises without videos
// Endpoint: GET /api/exercise-videos/missing
router.get(
  '/missing',
  verifyToken,
  ExerciseVideoController.getExercisesWithoutVideos
);

// ========================================
// ADDITIONAL UTILITY ROUTES
// ========================================

// GET - Get all videos (with optional search)
// Endpoint: GET /api/exercise-videos/all?search=push
router.get(
  '/all',
  verifyToken,
  ExerciseVideoController.getAllVideos
);

// GET - Get video statistics
// Endpoint: GET /api/exercise-videos/statistics
router.get(
  '/statistics',
  verifyToken,
  ExerciseVideoController.getStatistics
);

// POST - Bulk add videos
// Endpoint: POST /api/exercise-videos/bulk
// Body: { videos: [...] }
router.post(
  '/bulk',
  verifyToken,
  ExerciseVideoController.bulkAddVideos
);

// DELETE - Delete video by exercise name
// Endpoint: DELETE /api/exercise-videos/:exerciseName
router.delete(
  '/:exerciseName',
  verifyToken,
  ExerciseVideoController.deleteVideo
);

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large. Maximum size is 100MB for videos.'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
});

module.exports = router;