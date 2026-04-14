const router = require('express').Router();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const auth = require('../middleware/auth');

const s3 = new S3Client({
  endpoint: process.env.YC_ENDPOINT || 'https://storage.yandexcloud.net',
  region: 'ru-central1',
  credentials: {
    accessKeyId: process.env.YC_ACCESS_KEY,
    secretAccessKey: process.env.YC_SECRET_KEY,
  },
});

const BUCKET = process.env.YC_BUCKET || 'vforme-uploads';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Только изображения (jpg, png, gif, webp)'));
  },
});

router.post('/image', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('Upload: req.file пустой, headers:', req.headers['content-type']);
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const key = `uploads/${filename}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const url = `${process.env.YC_ENDPOINT || 'https://storage.yandexcloud.net'}/${BUCKET}/${key}`;
    res.json({ url });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
