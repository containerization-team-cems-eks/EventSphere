const express = require('express');
const cors = require('cors');
require('dotenv').config();

const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://wonderful-water-07646600f.3.azurestaticapps.net',
    'https://wonderful-water-07646600f-preview.eastus2.3.azurestaticapps.net'
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Notification service is running', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`\uD83D\uDD14 Notification service running on port ${PORT}`);
});

module.exports = app;
