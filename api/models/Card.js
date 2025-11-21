const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: String,
  images: {
    unidolized: String,
    idolized: String
  },
  skill: {
    name: String,
    description: String,
    icon: String
  },
  leader_skill: {
    name: String,
    description: String,
    icon: String
  },
  stats: {
    wild: String,
    pop: String,
    cool: String
  },
  stat_icons: {
    wild: String,
    pop: String,
    cool: String
  }
}, { timestamps: true });

// Prevent OverwriteModelError
module.exports = mongoose.models.Card || mongoose.model('Card', CardSchema);
