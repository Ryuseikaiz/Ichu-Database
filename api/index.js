const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Card = require('./models/Card');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Simple Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === 'Bearer secret-token-bedebede') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Connect to MongoDB (Cached connection for Serverless)
let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'bedebede' && password === '123') {
    res.json({ token: 'secret-token-bedebede', username: 'bedebede' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/cards', async (req, res) => {
  await connectToDatabase();
  try {
    const cards = await Card.find({});
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/cards/:id', authenticate, async (req, res) => {
  await connectToDatabase();
  try {
    const { id } = req.params;
    const updatedCard = await Card.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Export the app for Vercel
module.exports = app;
