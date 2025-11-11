const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Associated event is required']
  },
  user: {
    type: String,
    required: [true, 'User identifier is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Attendee name is required'],
    trim: true,
    maxlength: [120, 'Name cannot exceed 120 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be valid']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [32, 'Phone number cannot exceed 32 characters']
  },
  status: {
    type: String,
    enum: ['going', 'interested', 'declined', 'cancelled'],
    default: 'going'
  },
  guests: {
    type: Number,
    default: 0,
    min: [0, 'Guest count cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
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

rsvpSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

rsvpSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('RSVP', rsvpSchema);
