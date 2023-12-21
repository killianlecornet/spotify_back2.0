const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: String,
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
  },
  releaseDate: Date,
  imageUrl: String,
  description: String,
  music: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Music',
    },
  ],
});

module.exports = mongoose.model('Album', albumSchema);
