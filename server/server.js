const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const treeRoutes = require('./src/routes/treeRoutes');
const growthLogRoutes = require('./src/routes/growthLogRoutes');
const reminderRoutes = require('./src/routes/reminderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Dynamic CORS configuration supporting Vercel and local environments
const allowedOrigins = [
  'https://lambo-v1.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, server-to-server)
      if (!origin) return callback(null, true);

      // Allow explicitly listed origins, localhost, or any *.vercel.app preview
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:');

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'LAMBO API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.send('LAMBO API Server is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/growth-logs', growthLogRoutes);
app.use('/api/reminders', reminderRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[LAMBO Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;
