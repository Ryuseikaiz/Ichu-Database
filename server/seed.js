const mongoose = require('mongoose');
const Card = require('./models/Card');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Path to your existing JSON file
const jsonPath = path.join(__dirname, '../web/src/data/ichu_cards.json');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB Atlas for seeding...');
  
  try {
    // Read JSON file
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const cardsData = JSON.parse(rawData);

    console.log(`Found ${cardsData.length} cards in JSON.`);

    // Clear existing data
    await Card.deleteMany({});
    console.log('Cleared existing cards collection.');

    // Transform data to only keep Etoile stats
    const transformedData = cardsData.map(card => {
      const etoileStats = card.stats?.idolized?.etoile || { wild: "0", pop: "0", cool: "0" };
      return {
        ...card,
        stats: etoileStats
      };
    });

    // Insert new data
    await Card.insertMany(transformedData);
    console.log('Successfully imported cards to MongoDB!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
