const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Card = require('./models/Card');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large payloads if needed

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes

// GET all cards
app.get('/api/cards', async (req, res) => {
  try {
    const cards = await Card.find({});
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update card
app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCard = await Card.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
