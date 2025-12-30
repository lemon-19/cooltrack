// server.js
// UPDATE your existing server.js - Add the userRoutes import and route

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// Error middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Create HTTP server
const httpServer = http.createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Make io globally available
global.io = io;

// Socket auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

  // Subscribe to inventory updates
  socket.on('subscribe:inventory', (itemId) => {
    socket.join(`inventory:${itemId}`);
    console.log(`User ${socket.user.id} subscribed to inventory:${itemId}`);
  });

  // Subscribe to job updates
  socket.on('subscribe:job', (jobId) => {
    socket.join(`job:${jobId}`);
    console.log(`User ${socket.user.id} subscribed to job:${jobId}`);
  });

  // Admin users auto-join dashboard room
  if (socket.user.role === 'admin') {
    socket.join('dashboard');
    console.log(`Admin ${socket.user.id} joined dashboard room`);
  }

  socket.on('disconnect', () => {
    // User disconnected
  });
});

// Start server
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;