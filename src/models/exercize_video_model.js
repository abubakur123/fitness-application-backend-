// models/exercize_video_model.js
const mongoose = require('mongoose');

const exerciseVideoSchema = new mongoose.Schema({
  exerciseName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true,
    trim: true
  },
  // GridFS file references for uploaded videos
  videoFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'exerciseVideos.files'
  },
  videoFilename: {
    type: String
  },
  // Thumbnail URL and file references
  thumbnailUrl: {
    type: String,
    trim: true
  },
  thumbnailFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'exerciseVideos.files'
  },
  thumbnailFilename: {
    type: String
  },
  // Video metadata
  duration: {
    type: Number, // Duration in seconds
  },
  description: {
    type: String,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
exerciseVideoSchema.index({ exerciseName: 1 });
exerciseVideoSchema.index({ isActive: 1 });
exerciseVideoSchema.index({ videoFileId: 1 });

// Method to get video info
exerciseVideoSchema.methods.getVideoInfo = function() {
  return {
    exerciseName: this.exerciseName,
    videoUrl: this.videoUrl,
    thumbnailUrl: this.thumbnailUrl,
    duration: this.duration,
    description: this.description,
    uploadedAt: this.createdAt,
    hasFile: !!this.videoFileId
  };
};

const ExerciseVideo = mongoose.model('ExerciseVideo', exerciseVideoSchema);

module.exports = ExerciseVideo;