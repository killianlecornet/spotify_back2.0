require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const Playlist = require('../models/playlist');
const Music = require('../models/music');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

AWS.config.update({
    accessKeyId: process.env.ACCES_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCES_KEY_ID,
    region: 'us-east-1'
});

const s3 = new AWS.S3();

const uploadToS3 = (file, keyPrefix) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("Fichier manquant"));
        }

        const uploadParams = {
            Bucket: 'spotify95', // Remplacez par le nom de votre bucket
            Key: `${keyPrefix}/${Date.now()}_${file.originalname}`,
            Body: fs.createReadStream(file.path)
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

// Route GET pour récupérer toutes les playlists
router.get('/', async (req, res) => {
    try {
        const playlists = await Playlist.find().populate('music');
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route GET pour récupérer une playlist par ID
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id).populate('music');
        if (!playlist) {
            return res.status(404).json({ message: "Playlist non trouvée" });
        }
        res.json(playlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route POST pour créer une nouvelle playlist
router.post('/upload', upload.single('image'), async (req, res) => {
    const { title, description, musics } = req.body;
    const imageFile = req.file;

    try {
        const imageUrl = imageFile ? await uploadToS3(imageFile, 'playlistImages') : null;

        const newPlaylist = new Playlist({
            title,
            description,
            imageUrl,
            music: musics.split(',')
        });

        await newPlaylist.save();
        res.status(201).json(newPlaylist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route PUT pour mettre à jour une playlist par ID
router.put('/:id', upload.single('image'), async (req, res) => {
    const { title, description, musics } = req.body;
    const imageFile = req.file;

    try {
        const imageUrl = imageFile ? await uploadToS3(imageFile, 'playlistImages') : null;

        const updateData = {
            title,
            description,
            ...(imageUrl && { imageUrl }),
            music: musics.split(',')
        };

        const updatedPlaylist = await Playlist.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedPlaylist) {
            return res.status(404).json({ message: "Playlist non trouvée" });
        }

        res.json(updatedPlaylist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route DELETE pour supprimer une playlist
router.delete('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findByIdAndDelete(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist non trouvée" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
