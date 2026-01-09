const ExerciseVideo = require('../models/exercize_video_model');
const FitnessPlan = require('../models/fitness_plan_model');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

class ExerciseVideoService {
  constructor() {
    this.gfs = null;
    this.gridfsBucket = null;
    this._initializeGridFS();
  }

  _initializeGridFS() {
    mongoose.connection.once('open', () => {
      this.gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'exerciseVideos'
      });
      this.gfs = Grid(mongoose.connection.db, mongoose.mongo);
      this.gfs.collection('exerciseVideos');
      console.log('GridFS initialized for exercise videos');
    });
  }

  /* =========================
     UPLOAD VIDEO FILE
  ========================== */

  /* =========================
   UPLOAD VIDEO FILE
    ========================== */

    async uploadVideoFile(file, exerciseName) {
    return new Promise((resolve, reject) => {
        if (!file) {
        return reject(new Error('No file provided'));
        }

        // Validate file type
        const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
        return reject(new Error('Invalid file type. Only MP4, WebM, OGG, and MOV videos are allowed'));
        }

        // Validate file size (e.g., max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
        return reject(new Error('File size exceeds 100MB limit'));
        }

        const filename = `${exerciseName.replace(/\s+/g, '_')}_${Date.now()}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;

        const uploadStream = this.gridfsBucket.openUploadStream(filename, {
        metadata: {
            exerciseName,
            originalName: file.originalname,
            mimetype: file.mimetype,
            uploadDate: new Date()
        }
        });

        uploadStream.on('error', (error) => {
        reject(error);
        });

        uploadStream.on('finish', () => {
        // The file ID is available as uploadStream.id after the stream finishes
        resolve({
            fileId: uploadStream.id,
            filename: filename,
            url: `/api/exercise-videos/stream/${uploadStream.id}`
        });
        });

        uploadStream.end(file.buffer);
    });
    }

    /* =========================
    UPLOAD THUMBNAIL FILE
    ========================== */

    async uploadThumbnailFile(file, exerciseName) {
    return new Promise((resolve, reject) => {
        if (!file) {
        return resolve(null); // Thumbnail is optional
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
        return reject(new Error('Invalid thumbnail type. Only JPEG, PNG, and WebP images are allowed'));
        }

        // Validate file size (e.g., max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
        return reject(new Error('Thumbnail size exceeds 5MB limit'));
        }

        const filename = `thumb_${exerciseName.replace(/\s+/g, '_')}_${Date.now()}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;

        const uploadStream = this.gridfsBucket.openUploadStream(filename, {
        metadata: {
            exerciseName,
            originalName: file.originalname,
            mimetype: file.mimetype,
            type: 'thumbnail',
            uploadDate: new Date()
        }
        });

        uploadStream.on('error', (error) => {
        reject(error);
        });

        uploadStream.on('finish', () => {
        // The file ID is available as uploadStream.id after the stream finishes
        resolve({
            fileId: uploadStream.id,
            filename: filename,
            url: `/api/exercise-videos/stream/${uploadStream.id}`
        });
        });

        uploadStream.end(file.buffer);
    });
    }


  /* =========================
     CREATE/UPDATE VIDEO WITH FILE UPLOAD
  ========================== */

  async addOrUpdateExerciseVideoWithFile(exerciseData, videoFile, thumbnailFile) {
    try {
      const { exerciseName, duration, description, uploadedBy } = exerciseData;

      if (!exerciseName) {
        throw new Error('Exercise name is required');
      }

      if (!videoFile) {
        throw new Error('Video file is required');
      }

      // Check if video already exists
      const existingVideo = await ExerciseVideo.findOne({ exerciseName });

      // Upload new video file
      const videoUpload = await this.uploadVideoFile(videoFile, exerciseName);

      // Upload thumbnail if provided
      let thumbnailUpload = null;
      if (thumbnailFile) {
        thumbnailUpload = await this.uploadThumbnailFile(thumbnailFile, exerciseName);
      }

      if (existingVideo) {
        // Delete old video file from GridFS
        if (existingVideo.videoFileId) {
          try {
            await this.gridfsBucket.delete(new mongoose.Types.ObjectId(existingVideo.videoFileId));
          } catch (err) {
            console.error('Error deleting old video file:', err);
          }
        }

        // Delete old thumbnail if new one is uploaded
        if (thumbnailUpload && existingVideo.thumbnailFileId) {
          try {
            await this.gridfsBucket.delete(new mongoose.Types.ObjectId(existingVideo.thumbnailFileId));
          } catch (err) {
            console.error('Error deleting old thumbnail file:', err);
          }
        }

        // Update existing video
        existingVideo.videoUrl = videoUpload.url;
        existingVideo.videoFileId = videoUpload.fileId;
        existingVideo.videoFilename = videoUpload.filename;
        
        if (thumbnailUpload) {
          existingVideo.thumbnailUrl = thumbnailUpload.url;
          existingVideo.thumbnailFileId = thumbnailUpload.fileId;
          existingVideo.thumbnailFilename = thumbnailUpload.filename;
        }
        
        if (duration) existingVideo.duration = duration;
        if (description) existingVideo.description = description;
        if (uploadedBy) existingVideo.uploadedBy = uploadedBy;
        existingVideo.updatedAt = new Date();

        await existingVideo.save();

        return {
          success: true,
          message: 'Exercise video updated successfully',
          video: existingVideo.getVideoInfo(),
          isNew: false
        };
      } else {
        // Create new video
        const newVideo = new ExerciseVideo({
          exerciseName,
          videoUrl: videoUpload.url,
          videoFileId: videoUpload.fileId,
          videoFilename: videoUpload.filename,
          thumbnailUrl: thumbnailUpload?.url,
          thumbnailFileId: thumbnailUpload?.fileId,
          thumbnailFilename: thumbnailUpload?.filename,
          duration,
          description,
          uploadedBy
        });

        await newVideo.save();

        return {
          success: true,
          message: 'Exercise video added successfully',
          video: newVideo.getVideoInfo(),
          isNew: true
        };
      }
    } catch (error) {
      console.error('Add/Update Exercise Video With File Error:', error);
      throw error;
    }
  }

  /* =========================
     STREAM VIDEO FILE
  ========================== */

  async streamVideoFile(fileId, range) {
    try {
      const _id = new mongoose.Types.ObjectId(fileId);

      // Get file info
      const files = await this.gridfsBucket.find({ _id }).toArray();
      
      if (!files || files.length === 0) {
        throw new Error('Video file not found');
      }

      const file = files[0];
      
      if (range) {
        // Handle range requests for video seeking
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
        const chunksize = (end - start) + 1;

        return {
          file,
          stream: this.gridfsBucket.openDownloadStream(_id, { start, end: end + 1 }),
          range: { start, end, chunksize }
        };
      } else {
        // Full file stream
        return {
          file,
          stream: this.gridfsBucket.openDownloadStream(_id),
          range: null
        };
      }
    } catch (error) {
      console.error('Stream Video File Error:', error);
      throw error;
    }
  }

  /* =========================
     DELETE VIDEO FILE
  ========================== */

  async deleteExerciseVideoWithFile(exerciseName) {
    try {
      if (!exerciseName) {
        throw new Error('Exercise name is required');
      }

      const video = await ExerciseVideo.findOne({ 
        exerciseName: { $regex: new RegExp(`^${exerciseName}$`, 'i') }
      });

      if (!video) {
        throw new Error('Video not found for this exercise');
      }

      // Delete video file from GridFS
      if (video.videoFileId) {
        try {
          await this.gridfsBucket.delete(new mongoose.Types.ObjectId(video.videoFileId));
        } catch (err) {
          console.error('Error deleting video file:', err);
        }
      }

      // Delete thumbnail file from GridFS
      if (video.thumbnailFileId) {
        try {
          await this.gridfsBucket.delete(new mongoose.Types.ObjectId(video.thumbnailFileId));
        } catch (err) {
          console.error('Error deleting thumbnail file:', err);
        }
      }

      // Soft delete the record
      video.isActive = false;
      await video.save();

      return {
        success: true,
        message: 'Exercise video and files deleted successfully'
      };
    } catch (error) {
      console.error('Delete Exercise Video With File Error:', error);
      throw error;
    }
  }

  /* =========================
     ORIGINAL METHODS (for backward compatibility with URL-based videos)
  ========================== */

  async addOrUpdateExerciseVideo(exerciseData) {
    try {
      const { exerciseName, videoUrl, thumbnailUrl, duration, description, uploadedBy } = exerciseData;

      if (!exerciseName || !videoUrl) {
        throw new Error('Exercise name and video URL are required');
      }

      const existingVideo = await ExerciseVideo.findOne({ exerciseName });

      if (existingVideo) {
        existingVideo.videoUrl = videoUrl;
        if (thumbnailUrl) existingVideo.thumbnailUrl = thumbnailUrl;
        if (duration) existingVideo.duration = duration;
        if (description) existingVideo.description = description;
        if (uploadedBy) existingVideo.uploadedBy = uploadedBy;
        existingVideo.updatedAt = new Date();

        await existingVideo.save();

        return {
          success: true,
          message: 'Exercise video updated successfully',
          video: existingVideo.getVideoInfo(),
          isNew: false
        };
      } else {
        const newVideo = new ExerciseVideo({
          exerciseName,
          videoUrl,
          thumbnailUrl,
          duration,
          description,
          uploadedBy
        });

        await newVideo.save();

        return {
          success: true,
          message: 'Exercise video added successfully',
          video: newVideo.getVideoInfo(),
          isNew: true
        };
      }
    } catch (error) {
      console.error('Add/Update Exercise Video Error:', error);
      throw error;
    }
  }

  async getExerciseVideo(exerciseName) {
    try {
      if (!exerciseName) {
        throw new Error('Exercise name is required');
      }

      const video = await ExerciseVideo.findOne({ 
        exerciseName: { $regex: new RegExp(`^${exerciseName}$`, 'i') },
        isActive: true
      });

      if (!video) {
        return {
          success: false,
          message: 'No video found for this exercise',
          video: null
        };
      }

      return {
        success: true,
        video: video.getVideoInfo()
      };
    } catch (error) {
      console.error('Get Exercise Video Error:', error);
      throw error;
    }
  }

  async getExercisesWithoutVideos() {
    try {
      const allExercises = await this._getAllUniqueExercises();
      const videosExist = await ExerciseVideo.find({ isActive: true })
        .select('exerciseName')
        .lean();

      const exercisesWithVideos = new Set(
        videosExist.map(v => v.exerciseName.toLowerCase())
      );

      const exercisesWithoutVideos = allExercises.filter(exercise => 
        !exercisesWithVideos.has(exercise.name.toLowerCase())
      );

      return {
        success: true,
        exercisesWithoutVideos,
        totalExercises: allExercises.length,
        exercisesWithVideos: exercisesWithVideos.size,
        exercisesMissingVideos: exercisesWithoutVideos.length,
        coveragePercentage: allExercises.length > 0 
          ? ((exercisesWithVideos.size / allExercises.length) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      console.error('Get Exercises Without Videos Error:', error);
      throw error;
    }
  }

  async getAllExerciseVideos(filters = {}) {
    try {
      const query = { isActive: true };

      if (filters.exerciseName) {
        query.exerciseName = { $regex: new RegExp(filters.exerciseName, 'i') };
      }

      const videos = await ExerciseVideo.find(query)
        .sort({ exerciseName: 1 })
        .lean();

      return {
        success: true,
        videos: videos.map(v => ({
          exerciseName: v.exerciseName,
          videoUrl: v.videoUrl,
          thumbnailUrl: v.thumbnailUrl,
          duration: v.duration,
          description: v.description,
          uploadedAt: v.createdAt
        })),
        totalVideos: videos.length
      };
    } catch (error) {
      console.error('Get All Exercise Videos Error:', error);
      throw error;
    }
  }

  async deleteExerciseVideo(exerciseName) {
    try {
      if (!exerciseName) {
        throw new Error('Exercise name is required');
      }

      const video = await ExerciseVideo.findOne({ 
        exerciseName: { $regex: new RegExp(`^${exerciseName}$`, 'i') }
      });

      if (!video) {
        throw new Error('Video not found for this exercise');
      }

      video.isActive = false;
      await video.save();

      return {
        success: true,
        message: 'Exercise video deleted successfully'
      };
    } catch (error) {
      console.error('Delete Exercise Video Error:', error);
      throw error;
    }
  }

  async _getAllUniqueExercises() {
    const fitnessPlans = await FitnessPlan.find()
      .select('plan')
      .lean();

    const exercisesMap = new Map();

    fitnessPlans.forEach(plan => {
      if (plan.plan && plan.plan.days) {
        plan.plan.days.forEach(day => {
          if (day.type === 'workout' && day.workout && day.workout.exercises) {
            day.workout.exercises.forEach(exercise => {
              if (exercise.name) {
                const key = exercise.name.toLowerCase();
                if (!exercisesMap.has(key)) {
                  exercisesMap.set(key, {
                    name: exercise.name,
                    occurrences: 0
                  });
                }
                exercisesMap.get(key).occurrences++;
              }
            });
          }
        });
      }
    });

    return Array.from(exercisesMap.values())
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  async bulkAddVideos(videosArray) {
    try {
      const results = {
        success: [],
        failed: []
      };

      for (const videoData of videosArray) {
        try {
          const result = await this.addOrUpdateExerciseVideo(videoData);
          results.success.push({
            exerciseName: videoData.exerciseName,
            ...result
          });
        } catch (error) {
          results.failed.push({
            exerciseName: videoData.exerciseName,
            error: error.message
          });
        }
      }

      return {
        success: true,
        results,
        totalProcessed: videosArray.length,
        successCount: results.success.length,
        failedCount: results.failed.length
      };
    } catch (error) {
      console.error('Bulk Add Videos Error:', error);
      throw error;
    }
  }

  async getVideoStatistics() {
    try {
      const allExercises = await this._getAllUniqueExercises();
      const totalVideos = await ExerciseVideo.countDocuments({ isActive: true });
      
      const coveragePercentage = allExercises.length > 0
        ? ((totalVideos / allExercises.length) * 100).toFixed(2)
        : 0;

      return {
        success: true,
        statistics: {
          totalExercisesInPlans: allExercises.length,
          totalVideosUploaded: totalVideos,
          coveragePercentage: parseFloat(coveragePercentage),
          exercisesMissingVideos: allExercises.length - totalVideos
        }
      };
    } catch (error) {
      console.error('Get Video Statistics Error:', error);
      throw error;
    }
  }
}

module.exports = new ExerciseVideoService();