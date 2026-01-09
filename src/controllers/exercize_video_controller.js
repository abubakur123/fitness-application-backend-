const ExerciseVideoService = require('../services/exercize_videos_service');

class ExerciseVideoController {
  /* =========================
     POST - Upload Video File
  ========================== */

  async uploadVideo(req, res) {
    try {
      const { exerciseName, duration, description } = req.body;

      if (!exerciseName) {
        return res.status(400).json({
          success: false,
          message: 'Exercise name is required'
        });
      }

      if (!req.files || !req.files.video) {
        return res.status(400).json({
          success: false,
          message: 'Video file is required'
        });
      }

      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

      const exerciseData = {
        exerciseName: exerciseName.trim(),
        duration: duration ? parseInt(duration) : undefined,
        description: description?.trim(),
        uploadedBy: req.user?._id
      };

      const result = await ExerciseVideoService.addOrUpdateExerciseVideoWithFile(
        exerciseData,
        videoFile,
        thumbnailFile
      );

      res.status(result.isNew ? 201 : 200).json(result);
    } catch (error) {
      console.error('Upload Video Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload exercise video'
      });
    }
  }

  /* =========================
     GET - Stream Video File
  ========================== */

  async streamVideo(req, res) {
    try {
      const { fileId } = req.params;
      const range = req.headers.range;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required'
        });
      }

      const result = await ExerciseVideoService.streamVideoFile(fileId, range);

      if (range && result.range) {
        // Partial content response for video seeking
        res.writeHead(206, {
          'Content-Range': `bytes ${result.range.start}-${result.range.end}/${result.file.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': result.range.chunksize,
          'Content-Type': result.file.metadata.mimetype || 'video/mp4'
        });
      } else {
        // Full content response
        res.writeHead(200, {
          'Content-Length': result.file.length,
          'Content-Type': result.file.metadata.mimetype || 'video/mp4'
        });
      }

      result.stream.pipe(res);
    } catch (error) {
      console.error('Stream Video Controller Error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Video file not found'
      });
    }
  }

  /* =========================
     POST - Add or Update Video (URL-based - backward compatibility)
  ========================== */

  async addOrUpdateVideo(req, res) {
    try {
      const { exerciseName, videoUrl, thumbnailUrl, duration, description } = req.body;

      if (!exerciseName || !videoUrl) {
        return res.status(400).json({
          success: false,
          message: 'Exercise name and video URL are required'
        });
      }

      const exerciseData = {
        exerciseName: exerciseName.trim(),
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl?.trim(),
        duration,
        description: description?.trim(),
        uploadedBy: req.user?._id
      };

      const result = await ExerciseVideoService.addOrUpdateExerciseVideo(exerciseData);

      res.status(result.isNew ? 201 : 200).json(result);
    } catch (error) {
      console.error('Add/Update Video Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add/update exercise video'
      });
    }
  }

  /* =========================
     GET - Get Video by Exercise Name
  ========================== */

  async getVideoByName(req, res) {
    try {
      const { exerciseName } = req.params;

      if (!exerciseName) {
        return res.status(400).json({
          success: false,
          message: 'Exercise name is required'
        });
      }

      const result = await ExerciseVideoService.getExerciseVideo(
        decodeURIComponent(exerciseName)
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Get Video Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get exercise video'
      });
    }
  }

  /* =========================
     GET - Get Exercises Without Videos
  ========================== */

  async getExercisesWithoutVideos(req, res) {
    try {
      const result = await ExerciseVideoService.getExercisesWithoutVideos();

      res.status(200).json(result);
    } catch (error) {
      console.error('Get Exercises Without Videos Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get exercises without videos'
      });
    }
  }

  /* =========================
     GET - Get All Videos
  ========================== */

  async getAllVideos(req, res) {
    try {
      const filters = {
        exerciseName: req.query.search
      };

      const result = await ExerciseVideoService.getAllExerciseVideos(filters);

      res.status(200).json(result);
    } catch (error) {
      console.error('Get All Videos Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get exercise videos'
      });
    }
  }

  /* =========================
     DELETE - Delete Video
  ========================== */

  async deleteVideo(req, res) {
    try {
      const { exerciseName } = req.params;

      if (!exerciseName) {
        return res.status(400).json({
          success: false,
          message: 'Exercise name is required'
        });
      }

      // Use the file deletion method if video has files
      const result = await ExerciseVideoService.deleteExerciseVideoWithFile(
        decodeURIComponent(exerciseName)
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Delete Video Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete exercise video'
      });
    }
  }

  /* =========================
     POST - Bulk Add Videos
  ========================== */

  async bulkAddVideos(req, res) {
    try {
      const { videos } = req.body;

      if (!Array.isArray(videos) || videos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Videos array is required and must not be empty'
        });
      }

      const result = await ExerciseVideoService.bulkAddVideos(videos);

      res.status(200).json(result);
    } catch (error) {
      console.error('Bulk Add Videos Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk add videos'
      });
    }
  }

  /* =========================
     GET - Video Statistics
  ========================== */

  async getStatistics(req, res) {
    try {
      const result = await ExerciseVideoService.getVideoStatistics();

      res.status(200).json(result);
    } catch (error) {
      console.error('Get Statistics Controller Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get video statistics'
      });
    }
  }
}

module.exports = new ExerciseVideoController();