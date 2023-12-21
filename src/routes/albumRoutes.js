require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const Album = require('../models/album');
const Artist = require('../models/artist');
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

// Route GET pour récupérer tous les albums
router.get('/', async (req, res) => {
    try {
        const albums = await Album.find().populate('artist').populate('music');
        res.json(albums);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route GET pour récupérer un seul album par ID
router.get('/:id', async (req, res) => {
    try {
        const album = await Album.findById(req.params.id).populate('artist').populate('music');
        if (!album) {
            return res.status(404).json({ message: "Album non trouvé" });
        }
        res.json(album);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route POST pour créer un nouvel album
router.post('/upload', upload.single('image'), async (req, res) => {
    const { title, artist, releaseDate, description, musics } = req.body;
    let imageUrl = null;

    if (req.file) {
        const buffer = req.file.buffer;
        const filename = req.file.originalname;
        imageUrl = await uploadToS3(buffer, filename, 'albumImages');
    }

    try {
        const artistObject = await Artist.findById(artist);
        if (!artistObject) {
            return res.status(400).send(`Artiste non trouvé pour l'ID : ${artist}`);
        }

        const musicObjects = await Music.find({ _id: { $in: musics.split(',') } });

        const newAlbum = new Album({
            title,
            artist: artistObject._id,
            releaseDate,
            imageUrl,
            description,
            music: musicObjects.map(m => m._id),
        });

        await newAlbum.save();
        res.status(201).json(newAlbum);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route PUT pour mettre à jour un album par ID
router.put('/:id', upload.single('image'), async (req, res) => {
    const { title, artist, releaseDate, description, musics } = req.body;
    let imageUrl = null;

    if (req.file) {
        const buffer = req.file.buffer;
        const filename = req.file.originalname;
        imageUrl = await uploadToS3(buffer, filename, 'albumImages');
    }

    try {
        const updateData = {
            title,
            artist,
            releaseDate,
            description,
            music: musics.split(','),
            ...(imageUrl && { imageUrl })
        };

        const updatedAlbum = await Album.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedAlbum) {
            return res.status(404).json({ message: "Album non trouvé" });
        }

        res.json(updatedAlbum);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route DELETE pour supprimer un album par ID
router.delete('/:id', async (req, res) => {
    try {
        const album = await Album.findByIdAndDelete(req.params.id);
        if (!album) {
            return res.status(404).json({ message: "Album non trouvé" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
