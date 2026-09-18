/* =============================================
   SERVER.JS — StudyFlow Backend
   Main entry point for the Express app
============================================= */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/db');
const taskRoutes = require('./routes/tasks');

// ─── Create Express App ───────────────────
const app = express();
const PORT = process.env.PORT || 5000;

/* ─── SECURITY MIDDLEWARE ───────────────────
   helmet() adds important HTTP security headers
   (Content-Security-Policy, X-Frame-Options etc)
   Every production Node app should use this!
──────────────────────────────────────────── */
app.use(helmet());

/* ─── CORS MIDDLEWARE ───────────────────────
   Allows your frontend (Live Server) to call
   this backend API without browser blocking it
──────────────────────────────────────────── */
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        'http://localhost:5500',
        'http://127.0.0.1:5500',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));

/* ─── BODY PARSER MIDDLEWARE ────────────────
   Parses incoming JSON request bodies
   so we can read req.body in controllers
──────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─── REQUEST LOGGER ────────────────────────
   morgan('dev') logs every request like:
   GET /api/tasks 200 12ms
   Great for debugging during development!
──────────────────────────────────────────── */
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

/* ─── HEALTH CHECK ROUTE ────────────────────
   GET /api/health
   Used to verify the server is running
──────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 StudyFlow API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

/* ─── API ROUTES ────────────────────────────
   All task routes go through /api/tasks
──────────────────────────────────────────── */
app.use('/api/tasks', taskRoutes);

/* ─── 404 HANDLER ───────────────────────────
   Catches any route that doesn't exist
──────────────────────────────────────────── */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`,
    });
});

/* ─── GLOBAL ERROR HANDLER ──────────────────
   Catches any unhandled errors in the app
──────────────────────────────────────────── */
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong on the server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

/* ─── START SERVER ──────────────────────────
   First test DB connection, then start server
──────────────────────────────────────────── */
async function startServer() {
    try {
        // Test DB connection FIRST
        await testConnection();

        // Then start the server
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ================================');
            console.log(`   StudyFlow Server Running!`);
            console.log(`   Port    : ${PORT}`);
            console.log(`   Mode    : ${process.env.NODE_ENV}`);
            console.log(`   API     : http://localhost:${PORT}/api`);
            console.log(`   Health  : http://localhost:${PORT}/api/health`);
            console.log('================================ 🚀');
            console.log('');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();