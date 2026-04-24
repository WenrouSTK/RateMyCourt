// 图片上传：开发阶段存本地 uploads/，上线切腾讯云 COS
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { requireUser } = require('../middleware/auth');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/\.(jpe?g|png|webp)$/i.test(file.originalname)) cb(null, true);
    else cb(new Error('只支持 jpg/png/webp'));
  },
});

const router = express.Router();

router.post('/', requireUser, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '无文件' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
