require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const Artist = require('../models/artist');
const Album = require('../models/album');
const Music = require('../models/music');
const router = express.Router();

// Configuration de Multer pour gérer les fichiers entrants
const upload = multer();

AWS.config.update({
    accessKeyId: process.env.ACCES_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCES_KEY_ID,
    region: 'us-east-1'
});

const s3 = new AWS.S3();

// Fonction pour téléverser un fichier sur S3
const uploadToS3 = (buffer, filename, keyPrefix) => {
    return new Promise((resolve, reject) => {
        const uploadParams = {
            Bucket: 'spotify95', // Remplacez par le nom de votre bucket
            Key: `${keyPrefix}/${Date.now()}_${filename}`,
            Body: buffer
        };

        s3.upload(uploadParams, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
};

// Route GET pour récupérer tous les artistes
router.get('/', async (req, res) => {
    try {
        const artists = await Artist.find().populate('albums').populate('music');
        res.json(artists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route GET pour récupérer un seul artiste par ID
router.get('/:id', async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id).populate('albums').populate('music');
        if (!artist) {
            return res.status(404).json({ message: "Artiste non trouvé" });
        }
        res.json(artist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route POST pour créer un nouvel artiste
router.post('/upload', upload.single('image'), async (req, res) => {
    const { name, description, albums, musics } = req.body;
    let imageUrl = null;

    if (req.file) {
        const buffer = req.file.buffer;
        const filename = req.file.originalname;
        imageUrl = await uploadToS3(buffer, filename, 'artistImages');
    }

    try {
        const newArtist = new Artist({
            name,
            description,
            imageUrl,
            albums: albums.split(','),
            music: musics.split(',')
        });

        await newArtist.save();
        res.status(201).json(newArtist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route PUT pour mettre à jour un artiste par ID
router.put('/:id', upload.single('image'), async (req, res) => {
    const { name, description, albums, musics } = req.body;
    let imageUrl = null;

    if (req.file) {
        const buffer = req.file.buffer;
        const filename = req.file.originalname;
        imageUrl = await uploadToS3(buffer, filename, 'artistImages');
    }

    try {
        const updateData = {
            name,
            description,
            ...(imageUrl && { imageUrl }),
            albums: albums.split(','),
            music: musics.split(',')
        };

        const updatedArtist = await Artist.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedArtist) {
            return res.status(404).json({ message: "Artiste non trouvé" });
        }

        res.json(updatedArtist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route DELETE pour supprimer un artiste par ID
router.delete('/:id', async (req, res) => {
    try {
        const artist = await Artist.findByIdAndDelete(req.params.id);
        if (!artist) {
            return res.status(404).json({ message: "Artiste non trouvé" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
