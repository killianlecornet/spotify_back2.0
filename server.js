require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const musicRoutes = require('./src/routes/musicRoutes');
const artistRoutes = require('./src/routes/artistRoutes'); // Assurez-vous que les chemins sont corrects
const albumRoutes = require('./src/routes/albumRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connexion à MongoDB réussie'))
.catch(err => console.error('Erreur de connexion à MongoDB', err));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/music', musicRoutes);
app.use('/artist', artistRoutes);
app.use('/album', albumRoutes);
app.use('/playlist', playlistRoutes);

app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API de notre application musicale');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
