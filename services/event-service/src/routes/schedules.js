const express = require('express');
const Schedule = require('../models/Schedule');
const Event = require('../models/Event');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/schedules - List schedules. Public but can filter by event.
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;
    const filter = {};

    if (eventId) {
      filter.event = eventId;
    }

    const schedules = await Schedule.find(filter)
      .populate('event', 'title date venue status')
      .sort({ startTime: 1 })
      .lean();

    res.json(schedules);
  } catch (err) {
    console.error('Get schedules error:', err);
    res.status(500).json({ error: 'Failed to fetch schedules', details: err.message });
  }
});

// GET /api/schedules/:id - Retrieve a single schedule.
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('event', 'title date venue status');

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (err) {
    console.error('Get schedule error:', err);
    res.status(500).json({ error: 'Failed to fetch schedule', details: err.message });
  }
});

// POST /api/schedules - Create a schedule item (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { eventId, ...payload } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Associated event not found' });
    }

    const schedule = new Schedule({
      ...payload,
      event: eventId
    });

    await schedule.save();

    res.status(201).json({
      message: 'Schedule item created successfully',
      schedule
    });
  } catch (err) {
    console.error('Create schedule error:', err);
    res.status(500).json({ error: 'Failed to create schedule item', details: err.message });
  }
});

// PUT /api/schedules/:id - Update a schedule item (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { eventId, ...payload } = req.body;
    const update = { ...payload, updatedAt: Date.now() };

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Associated event not found' });
      }
      update.event = eventId;
    }

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({
      message: 'Schedule item updated successfully',
      schedule
    });
  } catch (err) {
    console.error('Update schedule error:', err);
    res.status(500).json({ error: 'Failed to update schedule item', details: err.message });
  }
});

// DELETE /api/schedules/:id - Delete a schedule item (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({
      message: 'Schedule item deleted successfully',
      schedule
    });
  } catch (err) {
    console.error('Delete schedule error:', err);
    res.status(500).json({ error: 'Failed to delete schedule item', details: err.message });
  }
});

module.exports = router;
