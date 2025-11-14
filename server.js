// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Corrected Routes Path
const authRoutes = require('./modules/routes/auth');
const scanRoutes = require('./modules/routes/scan');
// --- ADD NEW USER ROUTE ---
const userRoutes = require('./modules/models/User');


// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
// --- USE NEW USER ROUTE ---
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/db-check', (req, res) => {
  res.json({ connected: mongoose.connection.readyState === 1 });
});

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Mongo error:', err.message));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));