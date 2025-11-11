const express = require('express');
const { sendReminder } = require('../services/snsService');

const router = express.Router();

router.post('/reminders', async (req, res) => {
  try {
    const { subject, message, phoneNumber, topicArn } = req.body;

    const result = await sendReminder({ subject, message, phoneNumber, topicArn });

    res.status(202).json({
      message: 'Reminder queued successfully',
      metadata: result
    });
  } catch (err) {
    console.error('Send reminder error:', err);
    res.status(400).json({ error: err.message || 'Failed to send reminder' });
  }
});

module.exports = router;
