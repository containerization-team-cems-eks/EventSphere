const express = require('express');
const RSVP = require('../models/RSVP');
const Event = require('../models/Event');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/rsvps - List RSVPs (requires authentication)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { eventId, status } = req.query;
    const filter = {};

    if (eventId) {
      filter.event = eventId;
    }

    if (status) {
      filter.status = status;
    }

    if (!req.user || req.user.role !== 'admin') {
      filter.user = req.user?._id;
    }

    const rsvps = await RSVP.find(filter)
      .populate('event', 'title date venue status')
      .sort({ createdAt: -1 })
      .lean();

    res.json(rsvps);
  } catch (err) {
    console.error('Get RSVPs error:', err);
    res.status(500).json({ error: 'Failed to fetch RSVPs', details: err.message });
  }
});

// GET /api/rsvps/:id - Get single RSVP
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const rsvp = await RSVP.findById(req.params.id)
      .populate('event', 'title date venue status');

    if (!rsvp) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    if (req.user.role !== 'admin' && rsvp.user !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(rsvp);
  } catch (err) {
    console.error('Get RSVP error:', err);
    res.status(500).json({ error: 'Failed to fetch RSVP', details: err.message });
  }
});

// POST /api/rsvps - Create or update RSVP for logged-in user
router.post('/', verifyToken, async (req, res) => {
  try {
    const { eventId, status, guests, notes, phone, name, email } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const attendeeName = name || req.user?.name;
    const attendeeEmail = email || req.user?.email;

    if (!attendeeName || !attendeeEmail) {
      return res.status(400).json({ error: 'Name and email are required to RSVP' });
    }

    const guestCount = Number.isFinite(guests)
      ? guests
      : Number.isNaN(Number.parseInt(guests, 10))
        ? 0
        : Number.parseInt(guests, 10);

    const payload = {
      event: eventId,
      user: req.user._id,
      name: attendeeName,
      email: attendeeEmail,
      phone: phone || '',
      status: status || 'going',
      guests: guestCount,
      notes: notes || ''
    };

    if (payload.guests < 0) {
      return res.status(400).json({ error: 'Guest count cannot be negative' });
    }

    const rsvp = await RSVP.findOneAndUpdate(
      { event: eventId, user: req.user._id },
      { ...payload, updatedAt: Date.now() },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(201).json({
      message: 'RSVP saved successfully',
      rsvp
    });
  } catch (err) {
    console.error('Create RSVP error:', err);
    res.status(500).json({ error: 'Failed to save RSVP', details: err.message });
  }
});

// PUT /api/rsvps/:id - Update an RSVP (owner or admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const rsvp = await RSVP.findById(req.params.id);

    if (!rsvp) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    if (req.user.role !== 'admin' && rsvp.user !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allowedFields = ['status', 'guests', 'notes', 'phone'];
    const updates = { updatedAt: Date.now() };

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.guests !== undefined) {
      const parsedGuests = Number.parseInt(updates.guests, 10);
      if (Number.isNaN(parsedGuests) || parsedGuests < 0) {
        return res.status(400).json({ error: 'Guest count must be a non-negative number' });
      }
      updates.guests = parsedGuests;
    }

    const updated = await RSVP.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'RSVP updated successfully',
      rsvp: updated
    });
  } catch (err) {
    console.error('Update RSVP error:', err);
    res.status(500).json({ error: 'Failed to update RSVP', details: err.message });
  }
});

// DELETE /api/rsvps/:id - Delete an RSVP (owner or admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const rsvp = await RSVP.findById(req.params.id);

    if (!rsvp) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    if (req.user.role !== 'admin' && rsvp.user !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await RSVP.findByIdAndDelete(req.params.id);

    res.json({ message: 'RSVP deleted successfully' });
  } catch (err) {
    console.error('Delete RSVP error:', err);
    res.status(500).json({ error: 'Failed to delete RSVP', details: err.message });
  }
});

module.exports = router;
