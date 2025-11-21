const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Card = require('./models/Card');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
app.get('/api/cards', async (req, res) => {
  await connectToDatabase();
  try {
    const cards = await Card.find({});
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/cards/:id', async (req, res) => {
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
