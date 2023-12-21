const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: String,
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
  },
  imageUrl: String,
  description: String,
  music: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Music',
    },
  ],
});

module.exports = mongoose.model('Playlist', playlistSchema);
