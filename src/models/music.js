const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: String,
  artist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
    },
  ],
  album: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
    },
  ],
  genre: String,
  url: String,
  imageUrl: String,
});

module.exports = mongoose.model('Music', musicSchema);
