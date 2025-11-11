const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Associated event is required']
  },
  title: {
    type: String,
    required: [true, 'Schedule title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  speaker: {
    type: String,
    trim: true,
    maxlength: [120, 'Speaker name cannot exceed 120 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [160, 'Location cannot exceed 160 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Schedule start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'Schedule end time is required'],
    validate: {
      validator(value) {
        return !this.startTime || value > this.startTime;
      },
      message: 'Schedule end time must be after the start time'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

scheduleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

scheduleSchema.index({ event: 1, startTime: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
