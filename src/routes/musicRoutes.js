require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const Music = require('../models/music'); // Assurez-vous que le chemin vers votre modèle Music est correct
const router = express.Router();

// Configuration de Multer
const upload = multer({ dest: 'uploads/' });

// Configuration AWS S3
AWS.config.update({
    accessKeyId: process.env.ACCES_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCES_KEY_ID,
    region: 'us-east-1'
});

const s3 = new AWS.S3();

// Fonction pour téléverser un fichier sur S3
const uploadToS3 = (file, bucketPath) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("Fichier manquant"));
        }

        const uploadParams = {
            Bucket: 'spotify95',
            Key: `${bucketPath}/${Date.now()}_${file.originalname}`,
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

// Route POST pour ajouter une nouvelle musique
router.post('/upload', upload.fields([{ name: 'file' }, { name: 'image' }]), async (req, res) => {
    try {
        const audioUrl = req.files['file'] ? await uploadToS3(req.files['file'][0], 'audio') : null;
        const imageUrl = req.files['image'] ? await uploadToS3(req.files['image'][0], 'images') : null;

        const newMusic = new Music({
            title: req.body.title,
            artist: req.body.artist,
            genre: req.body.genre,
            url: audioUrl,
            imageUrl: imageUrl
        });

        await newMusic.save();
        res.status(201).json(newMusic);
    } catch (error) {
        console.error("Erreur lors de l'ajout de la musique :", error);
        res.status(500).json({ message: error.message });
    }
});

// Route GET pour récupérer toutes les musiques
router.get('/', async (req, res) => {
    try {
        const musics = await Music.find();
        res.json(musics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route GET pour récupérer une musique spécifique par son ID
router.get('/:id', async (req, res) => {
    try {
        const music = await Music.findById(req.params.id);
        if (!music) {
            return res.status(404).json({ message: "Musique non trouvée" });
        }
        res.json(music);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route PUT pour mettre à jour une musique existante
router.put('/:id', upload.fields([{ name: 'file' }, { name: 'image' }]), async (req, res) => {
    try {
        const updateData = {
            title: req.body.title,
            artist: req.body.artist,
            genre: req.body.genre,
        };

        if (req.files['file']) {
            updateData.url = await uploadToS3(req.files['file'][0], 'audio');
        }

        if (req.files['image']) {
            updateData.imageUrl = await uploadToS3(req.files['image'][0], 'images');
        }

        const updatedMusic = await Music.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedMusic) {
            return res.status(404).json({ message: "Musique non trouvée" });
        }

        res.json(updatedMusic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route DELETE pour supprimer une musique
router.delete('/:id', async (req, res) => {
    try {
        const music = await Music.findByIdAndDelete(req.params.id);
        if (!music) {
            return res.status(404).json({ message: "Musique non trouvée" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
